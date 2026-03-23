import request from 'supertest';
import mongoose, { Types } from 'mongoose';
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

jest.mock('../../../socket', () => ({
  emitToUser: jest.fn(),
  emitToRole: jest.fn(),
}));

import { app } from '../../../app';
import { User } from '../../../models/User';
import { Patient } from '../../../models/Patient';
import { Doctor } from '../../../models/Doctor';
import { Appointment } from '../../../models/Appointment';
import { Invoice } from '../../../models/Invoice';
import { LabOrder } from '../../../models/LabOrder';
import { Prescription } from '../../../models/Prescription';
import { Drug } from '../../../models/Drug';

let mongoServer: MongoMemoryServer;

let adminToken = '';
let doctorToken = '';

let patientProfileId = '';
let doctorProfileId = '';
let doctorUserId: Types.ObjectId;
let adminUserId: Types.ObjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = 'test-secret-key-for-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jwt';
  process.env.NODE_ENV = 'test';

  // Create admin user
  const adminUser = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@analytics.test',
    password: 'AdminPass1!',
    role: 'admin',
  });
  adminUserId = adminUser._id as Types.ObjectId;

  // Create doctor user + profile
  const doctorUser = await User.create({
    firstName: 'Doctor',
    lastName: 'Smith',
    email: 'doctor@analytics.test',
    password: 'DoctorPass1!',
    role: 'doctor',
  });
  doctorUserId = doctorUser._id as Types.ObjectId;

  const doctorProfile = await Doctor.create({
    userId: doctorUserId,
    specialization: 'General Medicine',
  });
  doctorProfileId = doctorProfile._id.toString();

  // Create patient user + profile
  const patUser = await User.create({
    firstName: 'Jane',
    lastName: 'Patient',
    email: 'patient@analytics.test',
    password: 'PatPass1!',
    role: 'patient',
  });
  const patientProfile = await Patient.create({ userId: patUser._id });
  patientProfileId = patientProfile._id.toString();

  // Login
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@analytics.test', password: 'AdminPass1!' });
  adminToken = adminLoginRes.body?.data?.accessToken ?? '';

  const doctorLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'doctor@analytics.test', password: 'DoctorPass1!' });
  doctorToken = doctorLoginRes.body?.data?.accessToken ?? '';

  // Seed data
  const now = new Date();

  // 3 appointments — created sequentially to avoid countDocuments race in pre-save hook
  await new Appointment({
    patient: patientProfileId,
    doctor: doctorProfileId,
    date: now,
    timeSlot: '09:00',
    type: 'consultation',
    status: 'confirmed',
    createdBy: adminUserId,
  }).save();
  await new Appointment({
    patient: patientProfileId,
    doctor: doctorProfileId,
    date: new Date(now.getTime() + 60 * 60 * 1000),
    timeSlot: '10:00',
    type: 'consultation',
    status: 'completed',
    createdBy: adminUserId,
  }).save();
  await new Appointment({
    patient: patientProfileId,
    doctor: doctorProfileId,
    date: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    timeSlot: '11:00',
    type: 'follow-up',
    status: 'scheduled',
    createdBy: adminUserId,
  }).save();

  // 2 invoices — created sequentially to avoid countDocuments race in pre-save hook
  await new Invoice({
    patient: patientProfileId,
    lineItems: [{ description: 'Consultation', quantity: 1, unitPrice: 100 }],
    status: 'issued',
    issuedDate: now,
    issuedBy: adminUserId,
  }).save();
  await new Invoice({
    patient: patientProfileId,
    lineItems: [{ description: 'Lab test', quantity: 1, unitPrice: 200 }],
    status: 'issued',
    issuedDate: now,
    issuedBy: adminUserId,
    payments: [
      { amount: 200, method: 'cash', paidAt: now, recordedBy: adminUserId },
    ],
  }).save();

  // 2 lab orders — created sequentially to avoid countDocuments race in pre-save hook
  await new LabOrder({
    patient: patientProfileId,
    doctor: doctorProfileId,
    tests: [{ name: 'CBC', code: 'CBC-001' }],
    priority: 'routine',
    status: 'completed',
  }).save();
  await new LabOrder({
    patient: patientProfileId,
    doctor: doctorProfileId,
    tests: [{ name: 'CMP', code: 'CMP-001' }],
    priority: 'urgent',
    status: 'pending',
  }).save();

  // seed a drug and 2 prescriptions
  const drug = await Drug.create({
    name: 'Amoxicillin',
    code: 'AMX-500',
    category: 'antibiotic',
    unit: 'tablet',
    stockQuantity: 100,
    reorderLevel: 10,
  });

  // 2 prescriptions — created sequentially to avoid countDocuments race in pre-save hook
  await new Prescription({
    patientId: patientProfileId,
    doctorId: doctorProfileId,
    lineItems: [
      {
        drugId: drug._id,
        drugName: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'twice daily',
        duration: '7 days',
        quantity: 14,
      },
    ],
    status: 'dispensed',
  }).save();
  await new Prescription({
    patientId: patientProfileId,
    doctorId: doctorProfileId,
    lineItems: [
      {
        drugId: drug._id,
        drugName: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'once daily',
        duration: '5 days',
        quantity: 5,
      },
    ],
    status: 'active',
  }).save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ---------------------------------------------------------------------------
// Settings tests
// ---------------------------------------------------------------------------

describe('Settings', () => {
  describe('GET /api/v1/settings', () => {
    it('returns 200 with default settings for admin', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.hospitalName).toBe('string');
      expect(res.body.data.hospitalName).toBe('MediCore HMS');
      expect(res.body.data.timezone).toBe('UTC');
      expect(typeof res.body.data.defaultTaxRate).toBe('number');
    });

    it('returns 403 for non-admin (doctor)', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/settings');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/settings', () => {
    it('updates settings and returns updated doc for admin', async () => {
      const res = await request(app)
        .patch('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hospitalName: 'New Hospital', defaultTaxRate: 10, timezone: 'America/New_York' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hospitalName).toBe('New Hospital');
      expect(res.body.data.defaultTaxRate).toBe(10);
      expect(res.body.data.timezone).toBe('America/New_York');
    });

    it('returns 403 for non-admin (doctor)', async () => {
      const res = await request(app)
        .patch('/api/v1/settings')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ hospitalName: 'Hacker' });

      expect(res.status).toBe(403);
    });

    it('persists updates (GET after PATCH returns updated values)', async () => {
      await request(app)
        .patch('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hospitalName: 'Persisted Name' });

      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hospitalName).toBe('Persisted Name');
    });
  });
});

// ---------------------------------------------------------------------------
// Appointment analytics tests
// ---------------------------------------------------------------------------

describe('Analytics - Appointments', () => {
  it('returns 200 with expected shape for admin', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/appointments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    expect(Array.isArray(data.volumeByPeriod)).toBe(true);
    expect(Array.isArray(data.byStatus)).toBe(true);
    expect(Array.isArray(data.byDoctor)).toBe(true);
  });

  it('volumeByPeriod has correct count and numeric values', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/appointments?period=month')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { volumeByPeriod } = res.body.data;
    expect(volumeByPeriod.length).toBeGreaterThan(0);
    for (const item of volumeByPeriod) {
      expect(typeof item._id).toBe('string');
      expect(typeof item.count).toBe('number');
      expect(isNaN(item.count)).toBe(false);
    }
  });

  it('byStatus groups are correct', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/appointments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { byStatus } = res.body.data;
    const totalCount = byStatus.reduce((sum: number, s: { count: number }) => sum + s.count, 0);
    expect(totalCount).toBe(3); // seeded 3 appointments
  });

  it('accepts period=day and period=week query params', async () => {
    const dayRes = await request(app)
      .get('/api/v1/analytics/appointments?period=day')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(dayRes.status).toBe(200);

    const weekRes = await request(app)
      .get('/api/v1/analytics/appointments?period=week')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(weekRes.status).toBe(200);
  });

  it('returns 403 for non-admin (doctor)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/appointments')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/analytics/appointments');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Revenue analytics tests
// ---------------------------------------------------------------------------

describe('Analytics - Revenue', () => {
  it('returns 200 with expected shape for admin', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    expect(Array.isArray(data.byMonth)).toBe(true);
    expect(typeof data.outstanding).toBe('number');
    expect(isNaN(data.outstanding)).toBe(false);
    expect(Array.isArray(data.paymentMethods)).toBe(true);
  });

  it('outstanding is a non-negative number', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.outstanding).toBeGreaterThanOrEqual(0);
  });

  it('paymentMethods entries have _id, amount, count', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    for (const pm of res.body.data.paymentMethods) {
      expect(typeof pm._id).toBe('string');
      expect(typeof pm.amount).toBe('number');
      expect(typeof pm.count).toBe('number');
    }
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/revenue')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Lab analytics tests
// ---------------------------------------------------------------------------

describe('Analytics - Lab', () => {
  it('returns 200 with expected shape for admin', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/lab')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    expect(Array.isArray(data.byPriority)).toBe(true);
    expect(Array.isArray(data.byStatus)).toBe(true);
    expect(Array.isArray(data.recentVolume)).toBe(true);
  });

  it('byPriority and byStatus total matches seed data (2 orders)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/lab')
      .set('Authorization', `Bearer ${adminToken}`);

    const { byPriority, byStatus } = res.body.data;
    const priorityTotal = byPriority.reduce((sum: number, s: { count: number }) => sum + s.count, 0);
    const statusTotal = byStatus.reduce((sum: number, s: { count: number }) => sum + s.count, 0);
    expect(priorityTotal).toBe(2);
    expect(statusTotal).toBe(2);
  });

  it('recentVolume entries have _id and numeric count', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/lab')
      .set('Authorization', `Bearer ${adminToken}`);

    for (const item of res.body.data.recentVolume) {
      expect(typeof item._id).toBe('string');
      expect(typeof item.count).toBe('number');
      expect(isNaN(item.count)).toBe(false);
    }
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/lab')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Prescription analytics tests
// ---------------------------------------------------------------------------

describe('Analytics - Prescriptions', () => {
  it('returns 200 with expected shape for admin', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/prescriptions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    expect(Array.isArray(data.byStatus)).toBe(true);
    expect(typeof data.fillRate).toBe('number');
    expect(isNaN(data.fillRate)).toBe(false);
    expect(Array.isArray(data.topDrugs)).toBe(true);
  });

  it('fillRate is between 0 and 1', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/prescriptions')
      .set('Authorization', `Bearer ${adminToken}`);

    const { fillRate } = res.body.data;
    expect(fillRate).toBeGreaterThanOrEqual(0);
    expect(fillRate).toBeLessThanOrEqual(1);
  });

  it('fillRate is 0.5 with 1 dispensed and 1 active', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/prescriptions')
      .set('Authorization', `Bearer ${adminToken}`);

    // seeded: 1 dispensed, 1 active => 1/(1+1) = 0.5
    expect(res.body.data.fillRate).toBeCloseTo(0.5);
  });

  it('topDrugs entries have _id and numeric count', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/prescriptions')
      .set('Authorization', `Bearer ${adminToken}`);

    for (const item of res.body.data.topDrugs) {
      expect(typeof item._id).toBe('string');
      expect(typeof item.count).toBe('number');
    }
  });

  it('Amoxicillin is in topDrugs', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/prescriptions')
      .set('Authorization', `Bearer ${adminToken}`);

    const names = res.body.data.topDrugs.map((d: { _id: string }) => d._id);
    expect(names).toContain('Amoxicillin');
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(403);
  });
});
