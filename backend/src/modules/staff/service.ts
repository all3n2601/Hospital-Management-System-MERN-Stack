import { Types } from 'mongoose';
import { User } from '../../models/User';
import { Doctor } from '../../models/Doctor';
import { Nurse } from '../../models/Nurse';
import { Receptionist } from '../../models/Receptionist';
import { Department } from '../../models/Department';
import { ConflictError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { z } from 'zod';
import { CreateStaffSchema, UpdateStaffSchema, CreateDepartmentSchema, UpdateDepartmentSchema } from './schema';

type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;

const DAY_OF_WEEK_MAP: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export async function createStaffMember(input: CreateStaffInput) {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new ConflictError('Email already registered');

  if (input.role === 'doctor' && !input.specialization) {
    throw new ValidationError('Specialization is required for doctors');
  }

  // NOTE: Not using Mongoose sessions/transactions here for single-instance compatibility.
  // In a production multi-replica environment, wrap these in a session transaction.
  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
    role: input.role,
    phone: input.phone,
    dob: input.dob ? new Date(input.dob) : undefined,
    gender: input.gender,
  });

  let profile;
  try {
    if (input.role === 'doctor') {
      profile = await Doctor.create({
        userId: user._id,
        specialization: input.specialization!,
        qualification: input.qualification ?? [],
        department: input.departmentId ? new Types.ObjectId(input.departmentId) : undefined,
        consultationFee: input.consultationFee ?? 0,
      });
    } else if (input.role === 'nurse') {
      profile = await Nurse.create({
        userId: user._id,
        ward: input.ward,
        department: input.departmentId ? new Types.ObjectId(input.departmentId) : undefined,
        shift: input.shift ?? 'morning',
        qualification: input.qualification ?? [],
      });
    } else if (input.role === 'receptionist') {
      profile = await Receptionist.create({
        userId: user._id,
        department: input.departmentId ? new Types.ObjectId(input.departmentId) : undefined,
      });
    }
  } catch (err) {
    // Best-effort cleanup if profile creation fails
    await User.findByIdAndDelete(user._id);
    throw err;
  }

  return { user, profile };
}

export async function getStaffMember(staffId: string, role: string) {
  let profile;
  if (role === 'doctor') {
    profile = await Doctor.findById(staffId).populate('department').populate('userId');
  } else if (role === 'nurse') {
    profile = await Nurse.findById(staffId).populate('department').populate('userId');
  } else if (role === 'receptionist') {
    profile = await Receptionist.findById(staffId).populate('department').populate('userId');
  }
  if (!profile) throw new NotFoundError('Staff member');
  return profile;
}

export async function listStaff(filters: {
  role?: string;
  department?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  // Determine which models to query
  const roles = filters.role
    ? [filters.role]
    : ['doctor', 'nurse', 'receptionist'];

  const profileFilter: Record<string, unknown> = {};
  if (filters.isActive !== undefined) profileFilter.isActive = filters.isActive;
  if (filters.department) profileFilter.department = new Types.ObjectId(filters.department);

  const results: {
    role: string;
    profile: unknown;
  }[] = [];

  for (const role of roles) {
    let Model: typeof Doctor | typeof Nurse | typeof Receptionist;
    if (role === 'doctor') Model = Doctor;
    else if (role === 'nurse') Model = Nurse;
    else Model = Receptionist;

    const docs = await (Model as typeof Doctor)
      .find(profileFilter)
      .populate('userId', '-password -failedLoginAttempts -lockedUntil')
      .populate('department')
      .skip(skip)
      .limit(limit)
      .lean();

    for (const doc of docs) {
      results.push({ role, profile: doc });
    }
  }

  // Get total count
  let total = 0;
  for (const role of roles) {
    let Model: typeof Doctor | typeof Nurse | typeof Receptionist;
    if (role === 'doctor') Model = Doctor;
    else if (role === 'nurse') Model = Nurse;
    else Model = Receptionist;
    total += await (Model as typeof Doctor).countDocuments(profileFilter);
  }

  return {
    data: results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateStaffMember(userId: string, input: UpdateStaffInput) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('Staff member');

  // Update User fields
  const userFields: Partial<typeof input> = {};
  if (input.firstName !== undefined) userFields.firstName = input.firstName;
  if (input.lastName !== undefined) userFields.lastName = input.lastName;
  if (input.phone !== undefined) userFields.phone = input.phone;
  if (input.dob !== undefined) userFields.dob = input.dob;
  if (input.gender !== undefined) userFields.gender = input.gender;

  if (Object.keys(userFields).length > 0) {
    await User.findByIdAndUpdate(userId, userFields);
  }

  // Update profile fields based on role
  const profileFields: Record<string, unknown> = {};
  if (input.departmentId !== undefined)
    profileFields.department = input.departmentId ? new Types.ObjectId(input.departmentId) : null;

  if (user.role === 'doctor') {
    if (input.specialization !== undefined) profileFields.specialization = input.specialization;
    if (input.qualification !== undefined) profileFields.qualification = input.qualification;
    if (input.consultationFee !== undefined) profileFields.consultationFee = input.consultationFee;
    await Doctor.findOneAndUpdate({ userId }, profileFields);
  } else if (user.role === 'nurse') {
    if (input.ward !== undefined) profileFields.ward = input.ward;
    if (input.shift !== undefined) profileFields.shift = input.shift;
    if (input.qualification !== undefined) profileFields.qualification = input.qualification;
    await Nurse.findOneAndUpdate({ userId }, profileFields);
  } else if (user.role === 'receptionist') {
    await Receptionist.findOneAndUpdate({ userId }, profileFields);
  }

  return User.findById(userId);
}

export async function deactivateStaff(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('Staff member');

  await User.findByIdAndUpdate(userId, { isActive: false });

  if (user.role === 'doctor') {
    await Doctor.findOneAndUpdate({ userId }, { isActive: false });
  } else if (user.role === 'nurse') {
    await Nurse.findOneAndUpdate({ userId }, { isActive: false });
  } else if (user.role === 'receptionist') {
    await Receptionist.findOneAndUpdate({ userId }, { isActive: false });
  }
}

export async function getAvailableDoctors(date: string, specialization?: string) {
  const dayOfWeek = new Date(date).getUTCDay();
  const dayName = DAY_OF_WEEK_MAP[dayOfWeek];

  const filter: Record<string, unknown> = {
    isActive: true,
    'availability.day': dayName,
  };

  if (specialization) {
    filter.specialization = { $regex: new RegExp(specialization, 'i') };
  }

  const doctors = await Doctor.find(filter)
    .populate('userId', '-password -failedLoginAttempts -lockedUntil')
    .populate('department')
    .lean();

  return doctors;
}

export async function createDepartment(input: CreateDepartmentInput) {
  const existing = await Department.findOne({ name: input.name });
  if (existing) throw new ConflictError('Department with this name already exists');

  let headObjectId: Types.ObjectId | undefined;
  if (input.headDoctorId) {
    const doctor = await Doctor.findById(input.headDoctorId);
    if (!doctor) throw new NotFoundError('Doctor');
    headObjectId = doctor._id;
  }

  const department = await Department.create({
    name: input.name,
    description: input.description,
    head: headObjectId,
    bedCount: input.bedCount ?? 0,
    location: input.location,
  });

  return department;
}

export async function listDepartments() {
  return Department.find({ isActive: true })
    .populate({
      path: 'head',
      populate: { path: 'userId', select: 'firstName lastName email' },
    })
    .lean();
}

export async function updateDepartment(deptId: string, input: UpdateDepartmentInput) {
  const dept = await Department.findById(deptId);
  if (!dept) throw new NotFoundError('Department');

  const updateFields: Record<string, unknown> = {};
  if (input.name !== undefined) updateFields.name = input.name;
  if (input.description !== undefined) updateFields.description = input.description;
  if (input.bedCount !== undefined) updateFields.bedCount = input.bedCount;
  if (input.location !== undefined) updateFields.location = input.location;

  if (input.headDoctorId !== undefined) {
    if (input.headDoctorId) {
      const doctor = await Doctor.findById(input.headDoctorId);
      if (!doctor) throw new NotFoundError('Doctor');
      updateFields.head = doctor._id;
    } else {
      updateFields.head = null;
    }
  }

  return Department.findByIdAndUpdate(deptId, updateFields, { new: true })
    .populate({
      path: 'head',
      populate: { path: 'userId', select: 'firstName lastName email' },
    });
}
