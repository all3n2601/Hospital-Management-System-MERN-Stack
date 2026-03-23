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

let adminToken = '';
let doctorToken = '';
let nurseToken = '';
let patientToken = '';
let secondPatientToken = '';

let patientProfileId = '';
let secondPatientProfileId = '';
let doctorProfileId = '';

// Helper to create a lab order
const createLabOrder = async (
  token: string,
  patientId: string,
  doctorId: string,
) => {
  return request(app)
    .post('/api/v1/lab/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      patientId,
      doctorId,
      tests: [{ name: 'CBC', code: 'CBC-001' }],
    });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = 'test-secret-key-for-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jwt';
  process.env.NODE_ENV = 'test';

  // Create admin user
  await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'AdminPass1!',
    role: 'admin',
  });

  // Create doctor user + Doctor profile
  const doctorUser = await User.create({
    firstName: 'Doctor',
    lastName: 'Smith',
    email: 'doctor@test.com',
    password: 'DoctorPass1!',
    role: 'doctor',
  });
  const doctorProfile = await Doctor.create({
    userId: doctorUser._id,
    specialization: 'General Medicine',
  });
  doctorProfileId = doctorProfile._id.toString();

  // Create nurse user
  await User.create({
    firstName: 'Nurse',
    lastName: 'Jones',
    email: 'nurse@test.com',
    password: 'NursePass1!',
    role: 'nurse',
  });

  // Create first patient user + Patient profile
  const patUser = await User.create({
    firstName: 'Jane',
    lastName: 'Patient',
    email: 'patient@test.com',
    password: 'PatPass1!',
    role: 'patient',
  });
  const patientProfile = await Patient.create({ userId: patUser._id });
  patientProfileId = patientProfile._id.toString();

  // Create second patient user + Patient profile
  const secondPatUser = await User.create({
    firstName: 'Other',
    lastName: 'Patient',
    email: 'other.patient@test.com',
    password: 'OtherPass1!',
    role: 'patient',
  });
  const secondPatientProfile = await Patient.create({ userId: secondPatUser._id });
  secondPatientProfileId = secondPatientProfile._id.toString();

  // Login all users
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'AdminPass1!' });
  adminToken = adminLoginRes.body?.data?.accessToken ?? '';

  const doctorLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'doctor@test.com', password: 'DoctorPass1!' });
  doctorToken = doctorLoginRes.body?.data?.accessToken ?? '';

  const nurseLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'nurse@test.com', password: 'NursePass1!' });
  nurseToken = nurseLoginRes.body?.data?.accessToken ?? '';

  const patLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'patient@test.com', password: 'PatPass1!' });
  patientToken = patLoginRes.body?.data?.accessToken ?? '';

  const secondPatLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'other.patient@test.com', password: 'OtherPass1!' });
  secondPatientToken = secondPatLoginRes.body?.data?.accessToken ?? '';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  if (collections['laborders']) {
    await collections['laborders'].deleteMany({});
  }
  if (collections['labresults']) {
    await collections['labresults'].deleteMany({});
  }
});

describe('Lab Routes', () => {
  it('1. POST /api/v1/lab/orders — doctor creates order → 201, orderId matches /^LAB-\\d{4,}$/', async () => {
    const res = await createLabOrder(doctorToken, patientProfileId, doctorProfileId);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toMatch(/^LAB-\d{4,}$/);
  });

  it('2. POST /api/v1/lab/orders — patient gets 403', async () => {
    const res = await createLabOrder(patientToken, patientProfileId, doctorProfileId);

    expect(res.status).toBe(403);
  });

  it('3. POST /api/v1/lab/orders — nurse gets 403', async () => {
    const res = await createLabOrder(nurseToken, patientProfileId, doctorProfileId);

    expect(res.status).toBe(403);
  });

  it('4. POST /api/v1/lab/orders — admin creates order → 201', async () => {
    const res = await createLabOrder(adminToken, patientProfileId, doctorProfileId);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toMatch(/^LAB-\d{4,}$/);
  });

  it('5. GET /api/v1/lab/orders — admin lists all orders (sees all)', async () => {
    // Create orders for both patients
    await createLabOrder(adminToken, patientProfileId, doctorProfileId);
    await createLabOrder(adminToken, secondPatientProfileId, doctorProfileId);

    const res = await request(app)
      .get('/api/v1/lab/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('6. GET /api/v1/lab/orders — patient sees only own orders (not other patient\'s)', async () => {
    // Create an order for the primary patient
    await createLabOrder(adminToken, patientProfileId, doctorProfileId);
    // Create an order for the second patient (should NOT appear for first patient)
    await createLabOrder(adminToken, secondPatientProfileId, doctorProfileId);

    const res = await request(app)
      .get('/api/v1/lab/orders')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Only the first patient's orders should appear
    expect(res.body.data.length).toBe(1);
    for (const order of res.body.data) {
      const orderPatientId =
        typeof order.patient === 'object' ? order.patient._id : order.patient;
      expect(orderPatientId.toString()).toBe(patientProfileId);
      expect(orderPatientId.toString()).not.toBe(secondPatientProfileId);
    }
  });

  it('7. GET /api/v1/lab/orders/:id — doctor gets single order by id → 200', async () => {
    const createRes = await createLabOrder(doctorToken, patientProfileId, doctorProfileId);
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/lab/orders/${orderId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(orderId);
  });

  it('8. GET /api/v1/lab/orders/:id — patient cannot see other patient\'s order → 403 or 404', async () => {
    // Create an order for the second patient
    const createRes = await createLabOrder(adminToken, secondPatientProfileId, doctorProfileId);
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data._id;

    // First patient tries to access second patient's order
    const res = await request(app)
      .get(`/api/v1/lab/orders/${orderId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect([403, 404]).toContain(res.status);
  });

  it('9. PATCH /api/v1/lab/orders/:id/status — admin updates order status → 200', async () => {
    const createRes = await createLabOrder(adminToken, patientProfileId, doctorProfileId);
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/lab/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('10. POST /api/v1/lab/results — admin enters results for an order → 201', async () => {
    const createOrderRes = await createLabOrder(adminToken, patientProfileId, doctorProfileId);
    expect(createOrderRes.status).toBe(201);
    const labOrderId = createOrderRes.body.data._id;

    const res = await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labOrderId,
        results: [
          { testCode: 'CBC-001', testName: 'CBC', value: '12.5', unit: 'g/dL', isNormal: true },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.labOrder.toString()).toBe(labOrderId);
  });

  it('11. POST /api/v1/lab/results — nurse gets 403', async () => {
    const createOrderRes = await createLabOrder(adminToken, patientProfileId, doctorProfileId);
    expect(createOrderRes.status).toBe(201);
    const labOrderId = createOrderRes.body.data._id;

    const res = await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        labOrderId,
        results: [
          { testCode: 'CBC-001', testName: 'CBC', value: '12.5', unit: 'g/dL', isNormal: true },
        ],
      });

    expect(res.status).toBe(403);
  });

  it('12. POST /api/v1/lab/results — cannot create duplicate result for same order → 400', async () => {
    const createOrderRes = await createLabOrder(adminToken, patientProfileId, doctorProfileId);
    expect(createOrderRes.status).toBe(201);
    const labOrderId = createOrderRes.body.data._id;

    const resultPayload = {
      labOrderId,
      results: [
        { testCode: 'CBC-001', testName: 'CBC', value: '12.5', unit: 'g/dL', isNormal: true },
      ],
    };

    // Create first result
    const firstRes = await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(resultPayload);
    expect(firstRes.status).toBe(201);

    // Try to create duplicate result
    const dupRes = await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(resultPayload);

    expect(dupRes.status).toBe(400);
  });

  it('13. GET /api/v1/lab/results/:orderId — doctor retrieves result → 200, has results array', async () => {
    const createOrderRes = await createLabOrder(doctorToken, patientProfileId, doctorProfileId);
    expect(createOrderRes.status).toBe(201);
    const labOrderId = createOrderRes.body.data._id;

    // Admin creates the result
    const createResultRes = await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labOrderId,
        results: [
          { testCode: 'CBC-001', testName: 'CBC', value: '12.5', unit: 'g/dL', isNormal: true },
        ],
      });
    expect(createResultRes.status).toBe(201);

    const res = await request(app)
      .get(`/api/v1/lab/results/${labOrderId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.results)).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThanOrEqual(1);
  });

  it('14. GET /api/v1/lab/results/:orderId — patient retrieves own result → 200', async () => {
    const createOrderRes = await createLabOrder(adminToken, patientProfileId, doctorProfileId);
    expect(createOrderRes.status).toBe(201);
    const labOrderId = createOrderRes.body.data._id;

    // Admin creates the result
    await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labOrderId,
        results: [
          { testCode: 'CBC-001', testName: 'CBC', value: '12.5', unit: 'g/dL', isNormal: true },
        ],
      });

    const res = await request(app)
      .get(`/api/v1/lab/results/${labOrderId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('15. GET /api/v1/lab/results/:orderId — patient cannot see other patient\'s result → 403 or 404', async () => {
    // Create an order and result for the second patient
    const createOrderRes = await createLabOrder(adminToken, secondPatientProfileId, doctorProfileId);
    expect(createOrderRes.status).toBe(201);
    const labOrderId = createOrderRes.body.data._id;

    await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labOrderId,
        results: [
          { testCode: 'CBC-001', testName: 'CBC', value: '12.5', unit: 'g/dL', isNormal: true },
        ],
      });

    // First patient tries to view second patient's result
    const res = await request(app)
      .get(`/api/v1/lab/results/${labOrderId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect([403, 404]).toContain(res.status);
  });

  it('16. PATCH /api/v1/lab/results/:id/verify — doctor verifies result → 200, status=\'final\', verifiedBy set', async () => {
    const createOrderRes = await createLabOrder(doctorToken, patientProfileId, doctorProfileId);
    expect(createOrderRes.status).toBe(201);
    const labOrderId = createOrderRes.body.data._id;

    // Admin creates the result
    const createResultRes = await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labOrderId,
        results: [
          { testCode: 'CBC-001', testName: 'CBC', value: '12.5', unit: 'g/dL', isNormal: true },
        ],
      });
    expect(createResultRes.status).toBe(201);
    const resultId = createResultRes.body.data._id;

    // Doctor verifies result
    const res = await request(app)
      .patch(`/api/v1/lab/results/${resultId}/verify`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ notes: 'Looks normal' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('final');
    expect(res.body.data.verifiedBy).toBeTruthy();
  });
});
