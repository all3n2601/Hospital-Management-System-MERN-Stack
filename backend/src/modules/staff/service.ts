import { Types } from 'mongoose';
import { User } from '../../models/User';
import { Doctor } from '../../models/Doctor';
import { Nurse } from '../../models/Nurse';
import { Receptionist } from '../../models/Receptionist';
import { Department } from '../../models/Department';
import { AppError, ConflictError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
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

function getModelForRole(role: string) {
  if (role === 'doctor') return Doctor;
  if (role === 'nurse') return Nurse;
  if (role === 'receptionist') return Receptionist;
  throw new AppError(400, 'INVALID_ROLE', `Unknown staff role: ${role}`);
}

export async function getStaffMember(userId: string) {
  const user = await User.findById(userId).select('-password').lean();
  if (!user) throw new NotFoundError('Staff member');

  // Find profile based on role
  let profile = null;
  if (user.role === 'doctor') {
    profile = await Doctor.findOne({ userId }).populate('department').lean();
  } else if (user.role === 'nurse') {
    profile = await Nurse.findOne({ userId }).populate('department').lean();
  } else if (user.role === 'receptionist') {
    profile = await Receptionist.findOne({ userId }).populate('department').lean();
  }

  return { user, profile };
}

export async function listStaff(filters: {
  role?: string;
  department?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const { role, department, isActive = true, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  // Build profile filter
  const profileFilter: Record<string, unknown> = { isActive };
  if (department) profileFilter.department = new Types.ObjectId(department);

  if (role) {
    // Single-role query — straightforward
    const Model = getModelForRole(role) as typeof Doctor;
    const [data, total] = await Promise.all([
      Model.find(profileFilter)
        .populate('userId', '-password')
        .populate('department')
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(profileFilter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Multi-role: fetch all, combine, then slice
  const [doctors, nurses, receptionists] = await Promise.all([
    Doctor.find(profileFilter).populate('userId', '-password').populate('department').lean(),
    Nurse.find(profileFilter).populate('userId', '-password').populate('department').lean(),
    Receptionist.find(profileFilter).populate('userId', '-password').populate('department').lean(),
  ]);

  const all = [...doctors, ...nurses, ...receptionists];
  const total = all.length;
  const data = all.slice(skip, skip + limit);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
