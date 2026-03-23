import { Types } from 'mongoose';
import { User } from '../../models/User';
import { Patient } from '../../models/Patient';
import { ConflictError, ForbiddenError, NotFoundError } from '../../middleware/errorHandler';
import { z } from 'zod';
import { CreatePatientSchema, UpdatePatientSchema } from './schema';

type CreatePatientInput = z.infer<typeof CreatePatientSchema>;
type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;

export async function createPatient(input: CreatePatientInput) {
  // If userId is provided, just create patient profile linked to existing user
  if (input.userId) {
    const user = await User.findById(input.userId);
    if (!user) throw new NotFoundError('User');

    const existingProfile = await Patient.findOne({ userId: input.userId });
    if (existingProfile) throw new ConflictError('Patient profile already exists for this user');

    const patient = await Patient.create({ userId: new Types.ObjectId(input.userId) });
    return { user, patient };
  }

  // Otherwise create user + patient profile together
  if (!input.email || !input.password || !input.firstName || !input.lastName) {
    throw new ConflictError('firstName, lastName, email, and password are required to create a new patient');
  }

  const existing = await User.findOne({ email: input.email });
  if (existing) throw new ConflictError('Email already registered');

  // NOTE: Not using Mongoose sessions/transactions here for single-instance compatibility.
  // In a production multi-replica environment, wrap these in a session transaction.
  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
    role: 'patient',
    phone: input.phone,
    dob: input.dob ? new Date(input.dob) : undefined,
    gender: input.gender,
  });

  let patient;
  try {
    patient = await Patient.create({
      userId: user._id,
      bloodGroup: input.bloodGroup,
      allergies: input.allergies ?? [],
      emergencyContact: input.emergencyContact,
      insuranceInfo: input.insuranceInfo
        ? {
            ...input.insuranceInfo,
            expiryDate: input.insuranceInfo.expiryDate
              ? new Date(input.insuranceInfo.expiryDate)
              : undefined,
          }
        : undefined,
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }

  return { user, patient };
}

export async function listPatients(filters: { page?: number; limit?: number; search?: string }) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  let userFilter: Record<string, unknown> = { role: 'patient' };
  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    userFilter = {
      role: 'patient',
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
    };
  }

  const users = await User.find(userFilter).select('-password -failedLoginAttempts -lockedUntil').lean();
  const userIds = users.map((u) => u._id);

  const patients = await Patient.find({ userId: { $in: userIds } })
    .populate('userId', '-password -failedLoginAttempts -lockedUntil')
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Patient.countDocuments({ userId: { $in: userIds } });

  return {
    data: patients,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPatient(patientProfileId: string, requestingUserId: string, requestingRole: string) {
  const patient = await Patient.findById(patientProfileId)
    .populate('userId', '-password -failedLoginAttempts -lockedUntil')
    .lean();

  if (!patient) throw new NotFoundError('Patient');

  // If patient role, can only access own record
  if (requestingRole === 'patient') {
    const patientUserId = (patient.userId as unknown as { _id: Types.ObjectId })._id?.toString()
      ?? patient.userId?.toString();
    if (patientUserId !== requestingUserId) {
      throw new ForbiddenError('You can only access your own patient record');
    }
  }

  return patient;
}

export async function getPatientByUserId(userId: string) {
  const patient = await Patient.findOne({ userId: new Types.ObjectId(userId) })
    .populate('userId', '-password -failedLoginAttempts -lockedUntil')
    .lean();
  if (!patient) throw new NotFoundError('Patient profile');
  return patient;
}

export async function updatePatient(
  patientProfileId: string,
  input: UpdatePatientInput,
  requestingUserId: string,
  requestingRole: string
) {
  const patient = await Patient.findById(patientProfileId);
  if (!patient) throw new NotFoundError('Patient');

  // Only admin/doctor can update any patient; patient can only update own
  if (requestingRole === 'patient') {
    if (patient.userId.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only update your own patient record');
    }
  }

  const updateFields: Record<string, unknown> = {};
  if (input.bloodGroup !== undefined) updateFields.bloodGroup = input.bloodGroup;
  if (input.allergies !== undefined) updateFields.allergies = input.allergies;
  if (input.emergencyContact !== undefined) updateFields.emergencyContact = input.emergencyContact;
  if (input.insuranceInfo !== undefined) {
    updateFields.insuranceInfo = {
      ...input.insuranceInfo,
      expiryDate: input.insuranceInfo.expiryDate ? new Date(input.insuranceInfo.expiryDate) : undefined,
    };
  }

  // Update User fields if provided
  const userFields: Record<string, unknown> = {};
  if (input.phone !== undefined) userFields.phone = input.phone;
  if (input.dob !== undefined) userFields.dob = new Date(input.dob);
  if (input.gender !== undefined) userFields.gender = input.gender;

  if (Object.keys(userFields).length > 0) {
    await User.findByIdAndUpdate(patient.userId, userFields);
  }

  return Patient.findByIdAndUpdate(patientProfileId, updateFields, { new: true })
    .populate('userId', '-password -failedLoginAttempts -lockedUntil');
}

export async function updateOwnPatientProfile(
  userId: string,
  input: UpdatePatientInput
) {
  const patient = await Patient.findOne({ userId: new Types.ObjectId(userId) });
  if (!patient) throw new NotFoundError('Patient profile');

  return updatePatient(patient._id.toString(), input, userId, 'patient');
}
