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

// Mock PDF and email services
jest.mock('../../../services/pdfService', () => ({
  generateDocumentPdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
}));

jest.mock('../../../services/emailService', () => ({
  sendDocumentEmail: jest.fn().mockResolvedValue(undefined),
}));

import { app } from '../../../app';
import { User } from '../../../models/User';
import { Patient } from '../../../models/Patient';
import { Doctor } from '../../../models/Doctor';
import { generateDocumentPdf } from '../../../services/pdfService';
import { sendDocumentEmail } from '../../../services/emailService';

let mongoServer: MongoMemoryServer;

let adminToken = '';
let doctorToken = '';
let doctorToken2 = '';
let patientToken = '';
let patientToken2 = '';
let nurseToken = '';

let patientProfileId = '';
let patientProfileId2 = '';
let doctorProfileId = '';
let doctorProfileId2 = '';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = 'test-secret-key-for-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jwt';
  process.env.NODE_ENV = 'test';

  // Admin
  await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'AdminPass1!',
    role: 'admin',
  });

  // Doctor 1
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

  // Doctor 2
  const doctorUser2 = await User.create({
    firstName: 'Doctor',
    lastName: 'Jones',
    email: 'doctor2@test.com',
    password: 'DoctorPass2!',
    role: 'doctor',
  });
  const doctorProfile2 = await Doctor.create({
    userId: doctorUser2._id,
    specialization: 'Cardiology',
  });
  doctorProfileId2 = doctorProfile2._id.toString();

  // Nurse
  await User.create({
    firstName: 'Nurse',
    lastName: 'Brown',
    email: 'nurse@test.com',
    password: 'NursePass1!',
    role: 'nurse',
  });

  // Patient 1
  const patUser = await User.create({
    firstName: 'Jane',
    lastName: 'Patient',
    email: 'patient@test.com',
    password: 'PatPass1!',
    role: 'patient',
  });
  const patientProfile = await Patient.create({ userId: patUser._id });
  patientProfileId = patientProfile._id.toString();

  // Patient 2
  const patUser2 = await User.create({
    firstName: 'Other',
    lastName: 'Patient',
    email: 'other.patient@test.com',
    password: 'OtherPass1!',
    role: 'patient',
  });
  const patientProfile2 = await Patient.create({ userId: patUser2._id });
  patientProfileId2 = patientProfile2._id.toString();

  // Login all
  const adminLoginRes = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'AdminPass1!' });
  adminToken = adminLoginRes.body?.data?.accessToken ?? '';

  const doctorLoginRes = await request(app).post('/api/v1/auth/login').send({ email: 'doctor@test.com', password: 'DoctorPass1!' });
  doctorToken = doctorLoginRes.body?.data?.accessToken ?? '';

  const doctorLoginRes2 = await request(app).post('/api/v1/auth/login').send({ email: 'doctor2@test.com', password: 'DoctorPass2!' });
  doctorToken2 = doctorLoginRes2.body?.data?.accessToken ?? '';

  const nurseLoginRes = await request(app).post('/api/v1/auth/login').send({ email: 'nurse@test.com', password: 'NursePass1!' });
  nurseToken = nurseLoginRes.body?.data?.accessToken ?? '';

  const patLoginRes = await request(app).post('/api/v1/auth/login').send({ email: 'patient@test.com', password: 'PatPass1!' });
  patientToken = patLoginRes.body?.data?.accessToken ?? '';

  const patLoginRes2 = await request(app).post('/api/v1/auth/login').send({ email: 'other.patient@test.com', password: 'OtherPass1!' });
  patientToken2 = patLoginRes2.body?.data?.accessToken ?? '';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  if (collections['documents']) {
    await collections['documents'].deleteMany({});
  }
  // Reset mock call counts between tests
  (generateDocumentPdf as jest.Mock).mockClear();
  (sendDocumentEmail as jest.Mock).mockClear();
});

// Helper
const createDraftDocument = async (token: string, patientId: string, doctorId: string) => {
  return request(app)
    .post('/api/v1/documents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      type: 'medical_certificate',
      patientId,
      issuedBy: doctorId,
      notes: 'Patient is unwell',
    });
};

describe('Documents Routes', () => {
  it('1. POST /api/v1/documents — doctor creates draft document → 201, documentId matches /^DOC-\\d{4,}$/', async () => {
    const res = await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentId).toMatch(/^DOC-\d{4,}$/);
    expect(res.body.data.status).toBe('draft');
  });

  it('2. POST /api/v1/documents — patient gets 403', async () => {
    const res = await createDraftDocument(patientToken, patientProfileId, doctorProfileId);

    expect(res.status).toBe(403);
  });

  it('3. POST /api/v1/documents — nurse gets 403', async () => {
    const res = await createDraftDocument(nurseToken, patientProfileId, doctorProfileId);

    expect(res.status).toBe(403);
  });

  it('4. POST /api/v1/documents — admin creates draft document → 201', async () => {
    const res = await createDraftDocument(adminToken, patientProfileId, doctorProfileId);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentId).toMatch(/^DOC-\d{4,}$/);
  });

  it('5. GET /api/v1/documents — admin sees all documents', async () => {
    await createDraftDocument(adminToken, patientProfileId, doctorProfileId);
    await createDraftDocument(adminToken, patientProfileId2, doctorProfileId2);

    const res = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('6. GET /api/v1/documents — doctor sees only own issued documents', async () => {
    // Doctor 1 creates a document
    await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);
    // Doctor 2 creates a document (should NOT appear for doctor 1)
    await createDraftDocument(doctorToken2, patientProfileId2, doctorProfileId2);

    const res = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Doctor 1 should only see their own docs
    for (const doc of res.body.data) {
      const issuedById = typeof doc.issuedBy === 'object' ? doc.issuedBy._id : doc.issuedBy;
      expect(issuedById.toString()).toBe(doctorProfileId);
    }
  });

  it('7. GET /api/v1/documents — patient sees only own documents', async () => {
    await createDraftDocument(adminToken, patientProfileId, doctorProfileId);
    await createDraftDocument(adminToken, patientProfileId2, doctorProfileId);

    const res = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    for (const doc of res.body.data) {
      const docPatientId = typeof doc.patientId === 'object' ? doc.patientId._id : doc.patientId;
      expect(docPatientId.toString()).toBe(patientProfileId);
    }
  });

  it('8. GET /api/v1/documents/:id — get document by id → 200', async () => {
    const createRes = await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);
    expect(createRes.status).toBe(201);
    const docId = createRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(docId);
  });

  it('9. POST /api/v1/documents/:id/issue — doctor issues own document → 200, status=issued, pdfUrl set', async () => {
    const createRes = await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);
    expect(createRes.status).toBe(201);
    const docId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('issued');
    expect(res.body.data.issuedAt).toBeTruthy();
    expect(res.body.data.pdfUrl).toMatch(/^documents\/DOC-/);
  });

  it('10. POST /api/v1/documents/:id/issue — verifies PDF generated and email sent', async () => {
    const createRes = await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);
    const docId = createRes.body.data._id;

    await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(generateDocumentPdf).toHaveBeenCalledTimes(1);
    expect(sendDocumentEmail).toHaveBeenCalledTimes(1);
  });

  it('11. POST /api/v1/documents/:id/issue — cannot issue already-issued document → 400', async () => {
    const createRes = await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);
    const docId = createRes.body.data._id;

    // First issue
    await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    // Try to issue again
    const res = await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('12. POST /api/v1/documents/:id/issue — cannot issue voided document → 400', async () => {
    // Create, issue, void, then try to issue again
    const createRes = await createDraftDocument(adminToken, patientProfileId, doctorProfileId);
    const docId = createRes.body.data._id;

    await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    await request(app)
      .post(`/api/v1/documents/${docId}/void`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ voidReason: 'Error' });

    const res = await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('13. POST /api/v1/documents/:id/void — doctor voids own issued document → 200, status=void', async () => {
    const createRes = await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);
    const docId = createRes.body.data._id;

    // Issue first
    await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    // Then void
    const res = await request(app)
      .post(`/api/v1/documents/${docId}/void`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ voidReason: 'Incorrect information' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('void');
    expect(res.body.data.voidReason).toBe('Incorrect information');
    expect(res.body.data.voidedAt).toBeTruthy();
  });

  it('14. POST /api/v1/documents/:id/void — cannot void a draft document → 400', async () => {
    const createRes = await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);
    const docId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/documents/${docId}/void`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ voidReason: 'Trying to void draft' });

    expect(res.status).toBe(400);
  });

  it('15. POST /api/v1/documents/:id/void — requires voidReason → 400', async () => {
    const createRes = await createDraftDocument(doctorToken, patientProfileId, doctorProfileId);
    const docId = createRes.body.data._id;

    await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    const res = await request(app)
      .post(`/api/v1/documents/${docId}/void`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('16. GET /api/v1/documents/:id — patient can only see own documents', async () => {
    // Create doc for patient 2
    const createRes = await createDraftDocument(adminToken, patientProfileId2, doctorProfileId);
    const docId = createRes.body.data._id;

    // Patient 1 tries to access patient 2's document
    const res = await request(app)
      .get(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });

  it('17. POST /api/v1/documents/:id/issue — admin issues document → 200', async () => {
    const createRes = await createDraftDocument(adminToken, patientProfileId, doctorProfileId);
    const docId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('issued');
  });

  it('19. GET /api/v1/documents/:id — Doctor A cannot access Doctor B\'s document → 403', async () => {
    // Doctor 2 creates a document
    const createRes = await createDraftDocument(doctorToken2, patientProfileId2, doctorProfileId2);
    expect(createRes.status).toBe(201);
    const docId = createRes.body.data._id;

    // Doctor 1 tries to access Doctor 2's document
    const res = await request(app)
      .get(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
  });

  it('18. POST /api/v1/documents/:id/void — doctor cannot void another doctor\'s document → 403', async () => {
    // Doctor 2 creates a doc
    const createRes = await createDraftDocument(doctorToken2, patientProfileId2, doctorProfileId2);
    const docId = createRes.body.data._id;

    // Doctor 2 issues it
    await request(app)
      .post(`/api/v1/documents/${docId}/issue`)
      .set('Authorization', `Bearer ${doctorToken2}`)
      .send({});

    // Doctor 1 tries to void it
    const res = await request(app)
      .post(`/api/v1/documents/${docId}/void`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ voidReason: 'Trying to void other doc' });

    expect(res.status).toBe(403);
  });
});
