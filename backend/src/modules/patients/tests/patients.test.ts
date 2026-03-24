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
import { Patient } from '../../../models/Patient';
import { Doctor } from '../../../models/Doctor';

let mongoServer: MongoMemoryServer;

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
});

async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body?.data?.accessToken ?? '';
}

async function createUser(overrides: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: string;
}) {
  return User.create({
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    email: overrides.email,
    password: overrides.password,
    role: overrides.role,
  });
}

describe('Patient Routes', () => {
  it('1. POST /api/v1/patients — receptionist creates patient', async () => {
    await createUser({ email: 'rec@test.com', password: 'RecPass1!', role: 'receptionist' });
    const recToken = await loginAs('rec@test.com', 'RecPass1!');

    const res = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${recToken}`)
      .send({
        firstName: 'Alice',
        lastName: 'Patient',
        email: 'alice.patient@test.com',
        password: 'PatPass1!',
        bloodGroup: 'O+',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patient.patientId).toMatch(/^PAT-\d{4}$/);
  });

  it('2. GET /api/v1/patients/:id — doctor can read patient', async () => {
    // Create doctor
    const doctorUser = await createUser({ email: 'doc@test.com', password: 'DocPass1!', role: 'doctor' });
    await Doctor.create({ userId: doctorUser._id, specialization: 'General' });
    const docToken = await loginAs('doc@test.com', 'DocPass1!');

    // Create patient
    const patientUser = await createUser({ email: 'pat@test.com', password: 'PatPass1!', role: 'patient' });
    const patient = await Patient.create({ userId: patientUser._id });

    const res = await request(app)
      .get(`/api/v1/patients/${patient._id}`)
      .set('Authorization', `Bearer ${docToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(patient._id.toString());
  });

  it('3. GET /api/v1/patients/:id — patient can read own record', async () => {
    // Register via register endpoint so patient user gets created
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Bob',
        lastName: 'Patient',
        email: 'bob.patient@test.com',
        password: 'PatPass1!',
      });

    const patientToken = registerRes.body?.data?.accessToken;
    const patientUserId = registerRes.body?.data?.user?._id;

    // Get patient profile id
    const patientProfile = await Patient.findOne({ userId: patientUserId });
    expect(patientProfile).toBeDefined();

    const res = await request(app)
      .get(`/api/v1/patients/${patientProfile!._id}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('4. GET /api/v1/patients/:id — patient cannot read another patient record (403)', async () => {
    // Create two patients
    const reg1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Patient',
        lastName: 'One',
        email: 'patient.one@test.com',
        password: 'PatPass1!',
      });

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Patient',
        lastName: 'Two',
        email: 'patient.two@test.com',
        password: 'PatPass1!',
      });

    const patient1Token = reg1.body?.data?.accessToken;
    const patient2UserId = (await User.findOne({ email: 'patient.two@test.com' }))?._id;
    const patient2Profile = await Patient.findOne({ userId: patient2UserId });

    const res = await request(app)
      .get(`/api/v1/patients/${patient2Profile!._id}`)
      .set('Authorization', `Bearer ${patient1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('5. GET /api/v1/patients — excludes profiles linked to non-patient users', async () => {
    const admin = await createUser({
      email: 'admin@test.com',
      password: 'AdminPass1!',
      role: 'admin',
    });
    await Patient.create({ userId: admin._id });

    const patientUser = await createUser({
      email: 'real.patient@test.com',
      password: 'PatPass1!',
      role: 'patient',
    });
    const realPatient = await Patient.create({ userId: patientUser._id });

    const adminToken = await loginAs('admin@test.com', 'AdminPass1!');
    const res = await request(app)
      .get('/api/v1/patients?limit=50')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const listedIds = (res.body.data as { _id: string }[]).map((p) => p._id);
    expect(listedIds).toContain(realPatient._id.toString());
    const strayProfile = await Patient.findOne({ userId: admin._id });
    expect(strayProfile).toBeDefined();
    expect(listedIds).not.toContain(strayProfile!._id.toString());
  });

  it('6. PATCH /api/v1/patients/me — patient updates own profile', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Charlie',
        lastName: 'Patient',
        email: 'charlie.patient@test.com',
        password: 'PatPass1!',
      });

    const patientToken = reg.body?.data?.accessToken;

    const res = await request(app)
      .patch('/api/v1/patients/me')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        bloodGroup: 'A+',
        allergies: ['Penicillin'],
        emergencyContact: {
          name: 'Jane Patient',
          relationship: 'Spouse',
          phone: '+1234567890',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bloodGroup).toBe('A+');
    expect(res.body.data.allergies).toContain('Penicillin');
  });
});
