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

// Mock socket so emitToRole doesn't crash in tests
jest.mock('../../../socket', () => ({
  emitToUser: jest.fn(),
  emitToRole: jest.fn(),
}));

import { app } from '../../../app';
import { User } from '../../../models/User';
import { Patient } from '../../../models/Patient';
import { Doctor } from '../../../models/Doctor';
import { Drug } from '../../../models/Drug';

// Import the mocked socket module so we can check calls
import { emitToRole } from '../../../socket';

let mongoServer: MongoMemoryServer;

let adminToken = '';
let doctorToken = '';
let nurseToken = '';
let patientToken = '';

let patientProfileId = '';
let secondPatientProfileId = '';
let doctorProfileId = '';

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
    email: 'admin@pharmacy.test',
    password: 'AdminPass1!',
    role: 'admin',
  });

  // Create doctor user + Doctor profile
  const doctorUser = await User.create({
    firstName: 'Doctor',
    lastName: 'Smith',
    email: 'doctor@pharmacy.test',
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
    email: 'nurse@pharmacy.test',
    password: 'NursePass1!',
    role: 'nurse',
  });

  // Create first patient user + Patient profile
  const patUser = await User.create({
    firstName: 'Jane',
    lastName: 'Patient',
    email: 'patient@pharmacy.test',
    password: 'PatPass1!',
    role: 'patient',
  });
  const patientProfile = await Patient.create({ userId: patUser._id });
  patientProfileId = patientProfile._id.toString();

  // Create second patient user + Patient profile
  const secondPatUser = await User.create({
    firstName: 'Other',
    lastName: 'Patient',
    email: 'other.patient@pharmacy.test',
    password: 'OtherPass1!',
    role: 'patient',
  });
  const secondPatientProfile = await Patient.create({ userId: secondPatUser._id });
  secondPatientProfileId = secondPatientProfile._id.toString();

  // Login all users
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@pharmacy.test', password: 'AdminPass1!' });
  adminToken = adminLoginRes.body?.data?.accessToken ?? '';

  const doctorLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'doctor@pharmacy.test', password: 'DoctorPass1!' });
  doctorToken = doctorLoginRes.body?.data?.accessToken ?? '';

  const nurseLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'nurse@pharmacy.test', password: 'NursePass1!' });
  nurseToken = nurseLoginRes.body?.data?.accessToken ?? '';

  const patLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'patient@pharmacy.test', password: 'PatPass1!' });
  patientToken = patLoginRes.body?.data?.accessToken ?? '';

  await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'other.patient@pharmacy.test', password: 'OtherPass1!' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  if (collections['drugs']) {
    await collections['drugs'].deleteMany({});
  }
  if (collections['prescriptions']) {
    await collections['prescriptions'].deleteMany({});
  }
  jest.clearAllMocks();
});

// Helper to create a drug
const createDrug = async (token: string, overrides: Record<string, unknown> = {}) => {
  return request(app)
    .post('/api/v1/pharmacy/drugs')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Amoxicillin',
      code: 'AMX-500',
      category: 'Antibiotic',
      unit: 'tablet',
      stockQuantity: 100,
      reorderLevel: 20,
      ...overrides,
    });
};

// Helper to create a prescription
const createPrescription = async (
  token: string,
  patientId: string,
  doctorId: string,
  drugId: string,
  drugName = 'Amoxicillin',
  overrides: Record<string, unknown> = {}
) => {
  return request(app)
    .post('/api/v1/pharmacy/prescriptions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      patientId,
      doctorId,
      lineItems: [
        {
          drugId,
          drugName,
          dosage: '500mg',
          frequency: 'twice daily',
          duration: '7 days',
          quantity: 14,
        },
      ],
      ...overrides,
    });
};

describe('Pharmacy Routes', () => {
  // -------------------------------------------------------------------------
  // Drug tests
  // -------------------------------------------------------------------------

  it('1. POST /api/v1/pharmacy/drugs — admin creates drug → 201', async () => {
    const res = await createDrug(adminToken);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Amoxicillin');
    expect(res.body.data.code).toBe('AMX-500');
  });

  it('2. POST /api/v1/pharmacy/drugs — non-admin (doctor) gets 403', async () => {
    const res = await createDrug(doctorToken);

    expect(res.status).toBe(403);
  });

  it('3. POST /api/v1/pharmacy/drugs — non-admin (nurse) gets 403', async () => {
    const res = await createDrug(nurseToken);

    expect(res.status).toBe(403);
  });

  it('4. GET /api/v1/pharmacy/drugs — admin can list drugs', async () => {
    await createDrug(adminToken);

    const res = await request(app)
      .get('/api/v1/pharmacy/drugs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('5. GET /api/v1/pharmacy/drugs — doctor can list drugs', async () => {
    await createDrug(adminToken);

    const res = await request(app)
      .get('/api/v1/pharmacy/drugs')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('6. GET /api/v1/pharmacy/drugs — nurse can list drugs', async () => {
    await createDrug(adminToken);

    const res = await request(app)
      .get('/api/v1/pharmacy/drugs')
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('7. GET /api/v1/pharmacy/drugs?search=Amox — search filters results', async () => {
    await createDrug(adminToken, { name: 'Amoxicillin', code: 'AMX-500' });
    await createDrug(adminToken, { name: 'Ibuprofen', code: 'IBU-400' });

    const res = await request(app)
      .get('/api/v1/pharmacy/drugs?search=Amox')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const names = res.body.data.map((d: { name: string }) => d.name);
    expect(names.some((n: string) => n.toLowerCase().includes('amox'))).toBe(true);
  });

  it('8. PATCH /api/v1/pharmacy/drugs/:id — admin updates drug', async () => {
    const createRes = await createDrug(adminToken);
    expect(createRes.status).toBe(201);
    const drugId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/pharmacy/drugs/${drugId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stockQuantity: 200, reorderLevel: 30 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stockQuantity).toBe(200);
    expect(res.body.data.reorderLevel).toBe(30);
  });

  // -------------------------------------------------------------------------
  // Prescription tests
  // -------------------------------------------------------------------------

  it('9. POST /api/v1/pharmacy/prescriptions — doctor creates prescription → 201, prescriptionId matches /^RX-\\d{4,}$/', async () => {
    const drugRes = await createDrug(adminToken);
    expect(drugRes.status).toBe(201);
    const drugId = drugRes.body.data._id;

    const res = await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.prescriptionId).toMatch(/^RX-\d{4,}$/);
    expect(res.body.data.status).toBe('draft');
  });

  it('10. POST /api/v1/pharmacy/prescriptions — patient gets 403', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    const res = await createPrescription(patientToken, patientProfileId, doctorProfileId, drugId);

    expect(res.status).toBe(403);
  });

  it('11. POST /api/v1/pharmacy/prescriptions — nurse gets 403', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    const res = await createPrescription(nurseToken, patientProfileId, doctorProfileId, drugId);

    expect(res.status).toBe(403);
  });

  it('12. GET /api/v1/pharmacy/prescriptions — admin sees all prescriptions', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);
    await createPrescription(doctorToken, secondPatientProfileId, doctorProfileId, drugId);

    const res = await request(app)
      .get('/api/v1/pharmacy/prescriptions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('13. GET /api/v1/pharmacy/prescriptions — patient sees only own prescriptions', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    // Create prescription for patient 1
    await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);
    // Create prescription for patient 2
    await createPrescription(doctorToken, secondPatientProfileId, doctorProfileId, drugId);

    const res = await request(app)
      .get('/api/v1/pharmacy/prescriptions')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // patient should only see their own prescription
    expect(res.body.data.length).toBe(1);
  });

  it('14. GET /api/v1/pharmacy/prescriptions — nurse sees only active prescriptions', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    // Create a draft prescription (not active)
    await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);

    const res = await request(app)
      .get('/api/v1/pharmacy/prescriptions')
      .set('Authorization', `Bearer ${nurseToken}`);

    // Nurse has dispense permission, but listing defaults to active only
    // draft is not active, so result should be empty or not include draft
    expect(res.status).toBe(200);
    expect(res.body.data.every((p: { status: string }) => p.status === 'active')).toBe(true);
  });

  it('15. PATCH /api/v1/pharmacy/prescriptions/:id/activate — doctor activates draft prescription → 200, status=active', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    const createRes = await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);
    expect(createRes.status).toBe(201);
    const prescriptionId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/activate`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('active');
  });

  it('16. PATCH /api/v1/pharmacy/prescriptions/:id/activate — cannot activate already active prescription → 400', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    const createRes = await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);
    const prescriptionId = createRes.body.data._id;

    // First activation
    await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/activate`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    // Second activation attempt
    const res = await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/activate`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('17. PATCH /api/v1/pharmacy/prescriptions/:id/dispense — nurse dispenses active prescription → 200, stock deducted, status=dispensed', async () => {
    const drugRes = await createDrug(adminToken, {
      name: 'TestDrug',
      code: 'TST-001',
      stockQuantity: 100,
      reorderLevel: 5,
    });
    expect(drugRes.status).toBe(201);
    const drugId = drugRes.body.data._id;

    const createRes = await createPrescription(
      doctorToken, patientProfileId, doctorProfileId, drugId, 'TestDrug'
    );
    expect(createRes.status).toBe(201);
    const prescriptionId = createRes.body.data._id;

    // Activate first
    await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/activate`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    // Dispense
    const res = await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/dispense`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('dispensed');
    expect(res.body.data.dispensedBy).toBeTruthy();
    expect(res.body.data.dispensedAt).toBeTruthy();

    // Check stock was deducted
    const drugAfter = await Drug.findById(drugId);
    expect(drugAfter!.stockQuantity).toBe(86); // 100 - 14
  });

  it('18. PATCH /api/v1/pharmacy/prescriptions/:id/dispense — low stock emits socket event when stock <= reorderLevel', async () => {
    const drugRes = await createDrug(adminToken, {
      name: 'LowStockDrug',
      code: 'LST-001',
      stockQuantity: 20,
      reorderLevel: 10,
    });
    expect(drugRes.status).toBe(201);
    const drugId = drugRes.body.data._id;

    // Create prescription with quantity 15 (will drop stock from 20 to 5, below reorderLevel 10)
    const createRes = await request(app)
      .post('/api/v1/pharmacy/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientProfileId,
        doctorId: doctorProfileId,
        lineItems: [
          {
            drugId,
            drugName: 'LowStockDrug',
            dosage: '100mg',
            frequency: 'daily',
            duration: '15 days',
            quantity: 15,
          },
        ],
      });
    expect(createRes.status).toBe(201);
    const prescriptionId = createRes.body.data._id;

    // Activate
    await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/activate`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    // Dispense
    const dispenseRes = await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/dispense`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({});

    expect(dispenseRes.status).toBe(200);

    // Verify low-stock socket event was emitted
    expect(emitToRole).toHaveBeenCalledWith(
      'admin',
      'pharmacy:low-stock',
      expect.objectContaining({
        drugId: drugId,
        drugName: 'LowStockDrug',
        currentStock: 5,
        reorderLevel: 10,
      })
    );
  });

  it('19. PATCH /api/v1/pharmacy/prescriptions/:id/dispense — cannot dispense draft prescription → 400', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    const createRes = await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);
    const prescriptionId = createRes.body.data._id;

    // Try to dispense without activating
    const res = await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/dispense`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('20. PATCH /api/v1/pharmacy/prescriptions/:id/cancel — doctor cancels prescription → 200, status=cancelled', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    const createRes = await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);
    const prescriptionId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/cancel`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('21. PATCH /api/v1/pharmacy/prescriptions/:id/cancel — cannot cancel already cancelled prescription → 400 (terminal state)', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    const createRes = await createPrescription(doctorToken, patientProfileId, doctorProfileId, drugId);
    const prescriptionId = createRes.body.data._id;

    // First cancel
    await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/cancel`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    // Second cancel attempt
    const res = await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/cancel`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('22. PATCH /api/v1/pharmacy/prescriptions/:id/cancel — cannot cancel dispensed prescription → 400 (terminal state)', async () => {
    const drugRes = await createDrug(adminToken, {
      name: 'TerminalDrug',
      code: 'TRM-001',
      stockQuantity: 50,
      reorderLevel: 5,
    });
    const drugId = drugRes.body.data._id;

    const createRes = await createPrescription(
      doctorToken, patientProfileId, doctorProfileId, drugId, 'TerminalDrug'
    );
    const prescriptionId = createRes.body.data._id;

    // Activate
    await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/activate`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    // Dispense
    await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/dispense`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({});

    // Try to cancel dispensed prescription
    const res = await request(app)
      .patch(`/api/v1/pharmacy/prescriptions/${prescriptionId}/cancel`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('23. Patient own-read — patient can only see their own prescription by ID', async () => {
    const drugRes = await createDrug(adminToken);
    const drugId = drugRes.body.data._id;

    // Create prescription for second patient
    const otherRes = await createPrescription(
      doctorToken, secondPatientProfileId, doctorProfileId, drugId
    );
    const otherPrescriptionId = otherRes.body.data._id;

    // First patient tries to access second patient's prescription
    const res = await request(app)
      .get(`/api/v1/pharmacy/prescriptions/${otherPrescriptionId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });

  it('24. GET /api/v1/pharmacy/drugs/:id — get single drug', async () => {
    const createRes = await createDrug(adminToken);
    expect(createRes.status).toBe(201);
    const drugId = createRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/pharmacy/drugs/${drugId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(drugId);
  });
});
