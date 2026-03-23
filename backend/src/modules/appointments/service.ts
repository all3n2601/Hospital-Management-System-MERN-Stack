import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { Appointment } from '../../models/Appointment';
import { Doctor } from '../../models/Doctor';
import { Patient } from '../../models/Patient';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { emitToUser } from '../../socket';
import { CreateAppointmentSchema, UpdateStatusSchema } from './schema';

type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let m = startMinutes; m < endMinutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export async function bookAppointment(input: CreateAppointmentInput, createdByUserId: string) {
  // Validate date is not in the past
  const appointmentDate = new Date(input.date);
  appointmentDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    throw new ValidationError('Appointment date cannot be in the past');
  }

  // Find the Doctor document
  const doctor = await Doctor.findById(input.doctorId);
  if (!doctor) throw new NotFoundError('Doctor');
  if (!doctor.isActive) throw new ValidationError('Doctor is not available');

  // Find the Patient document
  const patient = await Patient.findById(input.patientId);
  if (!patient) throw new NotFoundError('Patient');

  // Check doctor availability for that day of week
  const dayOfWeek = DAY_NAMES[appointmentDate.getDay()];
  const availabilityForDay = doctor.availability.find(a => a.day === dayOfWeek);
  if (!availabilityForDay) {
    throw new ValidationError(`Doctor is not available on ${dayOfWeek}`);
  }

  // Validate the time slot is within doctor's availability
  const allSlots = generateTimeSlots(availabilityForDay.startTime, availabilityForDay.endTime);
  if (!allSlots.includes(input.timeSlot)) {
    throw new ValidationError(`Time slot ${input.timeSlot} is not within doctor's availability`);
  }

  // Use a normalized date (midnight UTC for the date part)
  const normalizedDate = new Date(input.date + 'T00:00:00.000Z');

  // Try with transaction first, fall back to non-transactional if replica set not available
  let appointment;
  try {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Check for existing appointment in this slot (within transaction)
      const existing = await Appointment.findOne({
        doctor: new Types.ObjectId(input.doctorId),
        date: normalizedDate,
        timeSlot: input.timeSlot,
        status: { $nin: ['cancelled', 'noShow'] },
      }).session(session);

      if (existing) throw new ConflictError('This time slot is already booked');

      const [created] = await Appointment.create(
        [{
          patient: new Types.ObjectId(input.patientId),
          doctor: new Types.ObjectId(input.doctorId),
          department: doctor.department,
          date: normalizedDate,
          timeSlot: input.timeSlot,
          type: input.type ?? 'consultation',
          reason: input.reason,
          createdBy: new Types.ObjectId(createdByUserId),
        }],
        { session }
      );

      await session.commitTransaction();
      appointment = created;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    // If it's a ConflictError or ValidationError, re-throw
    if (err instanceof ConflictError || err instanceof ValidationError || err instanceof NotFoundError) {
      throw err;
    }
    // If transactions not supported (standalone MongoMemoryServer), fall back
    const errMsg = (err as Error).message ?? '';
    if (errMsg.includes('Transaction numbers are only allowed on a replica') || errMsg.includes('not supported')) {
      // Fallback: non-transactional insert (unique index will catch duplicates)
      const existing = await Appointment.findOne({
        doctor: new Types.ObjectId(input.doctorId),
        date: normalizedDate,
        timeSlot: input.timeSlot,
        status: { $nin: ['cancelled', 'noShow'] },
      });

      if (existing) throw new ConflictError('This time slot is already booked');

      appointment = await Appointment.create({
        patient: new Types.ObjectId(input.patientId),
        doctor: new Types.ObjectId(input.doctorId),
        department: doctor.department,
        date: normalizedDate,
        timeSlot: input.timeSlot,
        type: input.type ?? 'consultation',
        reason: input.reason,
        createdBy: new Types.ObjectId(createdByUserId),
      });
    } else {
      // Handle MongoDB duplicate key error (E11000) from the unique index
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        throw new ConflictError('This time slot is already booked');
      }
      throw err;
    }
  }

  return appointment;
}

export async function getAvailableSlots(doctorId: string, date: string) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new NotFoundError('Doctor');

  const appointmentDate = new Date(date + 'T00:00:00.000Z');
  const dayOfWeek = DAY_NAMES[new Date(date).getDay()];
  const availabilityForDay = doctor.availability.find(a => a.day === dayOfWeek);

  if (!availabilityForDay) return [];

  const allSlots = generateTimeSlots(availabilityForDay.startTime, availabilityForDay.endTime);

  // Query existing booked slots for that doctor+date (non-cancelled)
  const bookedAppointments = await Appointment.find({
    doctor: new Types.ObjectId(doctorId),
    date: appointmentDate,
    status: { $nin: ['cancelled', 'noShow'] },
  }).select('timeSlot').lean();

  const bookedSlots = new Set(bookedAppointments.map(a => a.timeSlot));
  return allSlots.filter(slot => !bookedSlots.has(slot));
}

export async function updateAppointmentStatus(
  appointmentId: string,
  input: UpdateStatusInput,
  requestingUserId: string,
  requestingRole: string
) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patient')
    .populate('doctor');

  if (!appointment) throw new NotFoundError('Appointment');

  const patientDoc = appointment.patient as unknown as { userId: Types.ObjectId };
  const doctorDoc = appointment.doctor as unknown as { userId: Types.ObjectId };

  // Permission check
  if (requestingRole === 'patient') {
    // Patient can only cancel their own appointments
    if (patientDoc.userId?.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only modify your own appointments');
    }
    if (input.status !== 'cancelled') {
      throw new ForbiddenError('Patients can only cancel appointments');
    }
  } else if (requestingRole === 'doctor') {
    // Doctor can only update their own appointments
    if (doctorDoc.userId?.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only modify your own appointments');
    }
  }

  // Update the appointment
  appointment.status = input.status;
  if (input.notes) appointment.notes = input.notes;

  if (input.status === 'cancelled') {
    appointment.cancelledBy = new Types.ObjectId(requestingUserId);
    appointment.cancelReason = input.cancelReason;
  }

  await appointment.save();

  // Emit Socket.io events to patient and doctor
  try {
    if (patientDoc.userId) {
      emitToUser(patientDoc.userId.toString(), 'appointment:statusChanged', {
        appointmentId: appointment._id.toString(),
        appointmentRef: appointment.appointmentId,
        status: input.status,
      });
    }
    if (doctorDoc.userId) {
      emitToUser(doctorDoc.userId.toString(), 'appointment:statusChanged', {
        appointmentId: appointment._id.toString(),
        appointmentRef: appointment.appointmentId,
        status: input.status,
      });
    }
  } catch {
    // Socket emission failure should not fail the HTTP response
  }

  return appointment;
}

export async function listAppointments(filters: {
  date?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = {};

  if (filters.date) {
    query.date = new Date(filters.date + 'T00:00:00.000Z');
  }
  if (filters.doctorId) {
    query.doctor = new Types.ObjectId(filters.doctorId);
  }
  if (filters.patientId) {
    query.patient = new Types.ObjectId(filters.patientId);
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.departmentId) {
    query.department = new Types.ObjectId(filters.departmentId);
  }

  const [data, total] = await Promise.all([
    Appointment.find(query)
      .populate({ path: 'doctor', populate: { path: 'userId', select: '-password' } })
      .populate({ path: 'patient', populate: { path: 'userId', select: '-password' } })
      .populate('department')
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(query),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAppointmentById(id: string) {
  const appointment = await Appointment.findById(id)
    .populate({ path: 'doctor', populate: { path: 'userId', select: '-password' } })
    .populate({ path: 'patient', populate: { path: 'userId', select: '-password' } })
    .populate('department')
    .lean();

  if (!appointment) throw new NotFoundError('Appointment');
  return appointment;
}

export async function getUpcomingAppointments(patientId: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return Appointment.find({
    patient: new Types.ObjectId(patientId),
    status: { $in: ['scheduled', 'confirmed'] },
    date: { $gte: now },
  })
    .populate({ path: 'doctor', populate: { path: 'userId', select: '-password' } })
    .populate('department')
    .sort({ date: 1, timeSlot: 1 })
    .lean();
}

export async function cancelAppointment(
  appointmentId: string,
  requestingUserId: string,
  requestingRole: string,
  cancelReason?: string
) {
  return updateAppointmentStatus(
    appointmentId,
    { status: 'cancelled', cancelReason },
    requestingUserId,
    requestingRole
  );
}
