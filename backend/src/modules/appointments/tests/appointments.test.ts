import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Request, Response, NextFunction } from 'express';

// Mock rate limiter and requestLogger before importing app
jest.mock('../../../middleware/rateLimiter', () => ({
  rateLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../../../middleware/requestLogger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  requestLogger: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// Mock socket so emitToUser doesn't crash in tests
jest.mock('../../../socket', () => ({
  emitToUser: jest.fn(),
  emitToRole: jest.fn(),
}));

import { app } from '../../../app';
import { User } from '../../../models/User';
import { Patient } from '../../../models/Patient';
import { Doctor } from '../../../models/Doctor';

let mongoServer: MongoMemoryServer;

// IDs we'll reuse across tests
let doctorProfileId = '';
let patientProfileId = '';
let patientToken = '';
let doctorToken = '';
let adminToken = '';

// A future date for scheduling
const FUTURE_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  // Get the day of week to align with doctor availability
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
})();

// Day name for FUTURE_DATE
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const futureDayName = DAY_NAMES[new Date(FUTURE_DATE + 'T12:00:00Z').getDay()];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = 'test-secret-key-for-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jwt';
  process.env.NODE_ENV = 'test';

  // Create doctor user
  const docUser = await User.create({
    firstName: 'Dr',
    lastName: 'Smith',
    email: 'doctor@test.com',
    password: 'DocPass1!',
    role: 'doctor',
  });

  // Create doctor profile with availability on all days
  const doctorProfile = await Doctor.create({
    userId: docUser._id,
    specialization: 'General Medicine',
    qualification: ['MBBS'],
    availability: [
      { day: 'monday', startTime: '09:00', endTime: '17:00' },
      { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'friday', startTime: '09:00', endTime: '17:00' },
      { day: 'saturday', startTime: '09:00', endTime: '17:00' },
      { day: 'sunday', startTime: '09:00', endTime: '17:00' },
    ],
    consultationFee: 100,
  });
  doctorProfileId = doctorProfile._id.toString();

  // Create patient user
  const patUser = await User.create({
    firstName: 'Jane',
    lastName: 'Patient',
    email: 'patient@test.com',
    password: 'PatPass1!',
    role: 'patient',
  });

  // Create patient profile
  const patientProfile = await Patient.create({ userId: patUser._id });
  patientProfileId = patientProfile._id.toString();

  // Create admin user
  await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'AdminPass1!',
    role: 'admin',
  });

  // Login all users
  const docLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'doctor@test.com', password: 'DocPass1!' });
  doctorToken = docLoginRes.body?.data?.accessToken ?? '';

  const patLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'patient@test.com', password: 'PatPass1!' });
  patientToken = patLoginRes.body?.data?.accessToken ?? '';

  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'AdminPass1!' });
  adminToken = adminLoginRes.body?.data?.accessToken ?? '';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Only clear appointments between tests, not users/doctors/patients
  const collections = mongoose.connection.collections;
  if (collections['appointments']) {
    await collections['appointments'].deleteMany({});
  }
});

describe('Appointment Routes', () => {
  it('1. POST /api/v1/appointments — books a new appointment, returns APT-XXXX id', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        patientId: patientProfileId,
        date: FUTURE_DATE,
        timeSlot: '09:00',
        type: 'consultation',
        reason: 'Regular checkup',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointmentId).toMatch(/^APT-\d{4}$/);
    expect(res.body.data.status).toBe('scheduled');
  });

  it('2. POST /api/v1/appointments — same doctor+date+slot second time returns 409', async () => {
    // First booking
    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        patientId: patientProfileId,
        date: FUTURE_DATE,
        timeSlot: '10:00',
        type: 'consultation',
      });

    // Second booking same slot
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        patientId: patientProfileId,
        date: FUTURE_DATE,
        timeSlot: '10:00',
        type: 'consultation',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('3. POST /api/v1/appointments — date in the past returns 400', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        patientId: patientProfileId,
        date: pastDate,
        timeSlot: '09:00',
        type: 'consultation',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. GET /api/v1/appointments/slots?doctorId=&date= — returns array of available time strings', async () => {
    const res = await request(app)
      .get(`/api/v1/appointments/slots?doctorId=${doctorProfileId}&date=${FUTURE_DATE}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Slots should be HH:MM format
    expect(res.body.data[0]).toMatch(/^\d{2}:\d{2}$/);
  });

  it('5. PATCH /api/v1/appointments/:id/status — doctor updates to confirmed', async () => {
    // Book first
    const bookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        patientId: patientProfileId,
        date: FUTURE_DATE,
        timeSlot: '11:00',
        type: 'consultation',
      });

    expect(bookRes.status).toBe(201);
    const appointmentId = bookRes.body.data._id;

    // Doctor confirms
    const res = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('6. DELETE /api/v1/appointments/:id — patient cancels own appointment', async () => {
    // Book first
    const bookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        patientId: patientProfileId,
        date: FUTURE_DATE,
        timeSlot: '12:00',
        type: 'consultation',
      });

    expect(bookRes.status).toBe(201);
    const appointmentId = bookRes.body.data._id;

    // Patient cancels
    const res = await request(app)
      .delete(`/api/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ cancelReason: 'Change of plans' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('7. DELETE /api/v1/appointments/:id — patient cannot cancel another patient appointment (403)', async () => {
    // Create another patient
    const otherPatUser = await User.create({
      firstName: 'Other',
      lastName: 'Patient',
      email: 'other.patient@test.com',
      password: 'OtherPass1!',
      role: 'patient',
    });
    const otherPatProfile = await Patient.create({ userId: otherPatUser._id });

    // Book appointment for the other patient (as admin)
    const bookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        doctorId: doctorProfileId,
        patientId: otherPatProfile._id.toString(),
        date: FUTURE_DATE,
        timeSlot: '14:00',
        type: 'consultation',
      });

    expect(bookRes.status).toBe(201);
    const appointmentId = bookRes.body.data._id;

    // Original patient tries to cancel other patient's appointment
    const res = await request(app)
      .delete(`/api/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ cancelReason: 'Unauthorized cancel' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// Suppress unused variable warning for setup variable
void futureDayName;
