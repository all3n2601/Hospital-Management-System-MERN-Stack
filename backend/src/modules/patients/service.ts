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
    if (user.role !== 'patient') {
      throw new ConflictError('Patient profiles can only be linked to users with the patient role');
    }

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

export async function listPatients(filters: { search?: string; page?: number; limit?: number }) {
  const { search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (search) {
    // Only users with patient role can appear in the patient directory
    const matchingUsers = await User.find({
      role: 'patient',
      $or: [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ],
    }).select('_id').limit(100).lean();

    const userIds = matchingUsers.map(u => u._id);
    query.userId = { $in: userIds };
  } else {
    const patientUserIds = await User.find({ role: 'patient' }).distinct('_id');
    query.userId = { $in: patientUserIds };
  }

  const [data, total] = await Promise.all([
    Patient.find(query)
      .populate('userId', '-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(query),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
