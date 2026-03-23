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

import { app } from '../../../app';
import { User } from '../../../models/User';
import { Doctor } from '../../../models/Doctor';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let doctorToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = 'test-secret-key-for-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jwt';
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  adminToken = '';
  doctorToken = '';
});

async function createAdminAndLogin() {
  // Directly create admin user (register endpoint forces patient role)
  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'AdminPass1!',
    role: 'admin',
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'AdminPass1!' });
  // If login returns tokens
  if (res.body?.data?.accessToken) return res.body.data.accessToken;
  // fallback: try register then manual patch
  return null;
}

async function createDoctorAndLogin() {
  // Create doctor user directly
  const doctor = await User.create({
    firstName: 'Dr',
    lastName: 'Smith',
    email: 'doctor@test.com',
    password: 'DoctorPass1!',
    role: 'doctor',
  });
  await Doctor.create({
    userId: doctor._id,
    specialization: 'Cardiology',
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'doctor@test.com', password: 'DoctorPass1!' });
  if (res.body?.data?.accessToken) return res.body.data.accessToken as string;
  return null;
}

describe('Staff Routes', () => {
  beforeEach(async () => {
    adminToken = (await createAdminAndLogin()) ?? '';
    doctorToken = (await createDoctorAndLogin()) ?? '';
  });

  it('1. POST /api/v1/staff — admin creates a doctor (returns DOC-XXXX id)', async () => {
    const res = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@hospital.com',
        password: 'Password1!',
        role: 'doctor',
        specialization: 'Neurology',
        qualification: ['MBBS', 'MD'],
        consultationFee: 150,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile).toBeDefined();
    expect(res.body.data.profile.doctorId).toMatch(/^DOC-\d{4}$/);
  });

  it('2. POST /api/v1/staff — non-admin (doctor token) gets 403', async () => {
    const res = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        firstName: 'Test',
        lastName: 'Nurse',
        email: 'nurse@test.com',
        password: 'Password1!',
        role: 'nurse',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('3. GET /api/v1/doctors — returns paginated doctor list', async () => {
    const res = await request(app)
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeDefined();
  });

  it('4. GET /api/v1/doctors/available?date=2025-01-06&specialization=Cardiology — returns matching doctors', async () => {
    // 2025-01-06 is a Monday
    const doctor = await User.create({
      firstName: 'Cardio',
      lastName: 'Doctor',
      email: 'cardio@test.com',
      password: 'Password1!',
      role: 'doctor',
    });
    await Doctor.create({
      userId: doctor._id,
      specialization: 'Cardiology',
      availability: [{ day: 'monday', startTime: '09:00', endTime: '17:00' }],
    });

    const res = await request(app)
      .get('/api/v1/doctors/available?date=2025-01-06&specialization=Cardiology')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].specialization).toBe('Cardiology');
  });

  it('5. GET /api/v1/departments — returns departments list', async () => {
    const res = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('6. POST /api/v1/departments — admin creates department', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Cardiology',
        description: 'Heart department',
        bedCount: 20,
        location: 'Floor 3',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Cardiology');
    expect(res.body.data._id).toBeDefined();
  });
});
