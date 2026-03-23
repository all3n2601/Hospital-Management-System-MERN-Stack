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

// Import the mocked socket module so we can check calls
import { emitToRole } from '../../../socket';

let mongoServer: MongoMemoryServer;

let adminToken = '';
let nurseToken = '';
let patientToken = '';
let adminUserId = '';

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
    email: 'admin@inventory.test',
    password: 'AdminPass1!',
    role: 'admin',
  });
  adminUserId = adminUser._id.toString();

  // Create nurse user
  await User.create({
    firstName: 'Nurse',
    lastName: 'Jones',
    email: 'nurse@inventory.test',
    password: 'NursePass1!',
    role: 'nurse',
  });

  // Create patient user
  await User.create({
    firstName: 'Jane',
    lastName: 'Patient',
    email: 'patient@inventory.test',
    password: 'PatPass1!',
    role: 'patient',
  });

  // Login all users
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@inventory.test', password: 'AdminPass1!' });
  adminToken = adminLoginRes.body?.data?.accessToken ?? '';

  const nurseLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'nurse@inventory.test', password: 'NursePass1!' });
  nurseToken = nurseLoginRes.body?.data?.accessToken ?? '';

  const patLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'patient@inventory.test', password: 'PatPass1!' });
  patientToken = patLoginRes.body?.data?.accessToken ?? '';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  if (collections['inventoryitems']) {
    await collections['inventoryitems'].deleteMany({});
  }
  if (collections['stockmovements']) {
    await collections['stockmovements'].deleteMany({});
  }
  jest.clearAllMocks();
});

// Helper to create an inventory item
const createItem = async (token: string, overrides: Record<string, unknown> = {}) => {
  return request(app)
    .post('/api/v1/inventory/items')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Surgical Gloves',
      code: 'SG-100',
      category: 'PPE',
      quantity: 500,
      unit: 'box',
      reorderLevel: 50,
      ...overrides,
    });
};

describe('Inventory Routes', () => {

  // -------------------------------------------------------------------------
  // Create item
  // -------------------------------------------------------------------------

  it('1. POST /api/v1/inventory/items — admin creates item → 201, itemId matches /^INV-\\d{4,}$/', async () => {
    const res = await createItem(adminToken);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Surgical Gloves');
    expect(res.body.data.code).toBe('SG-100');
    expect(res.body.data.itemId).toMatch(/^INV-\d{4,}$/);
    expect(res.body.data.quantity).toBe(500);
  });

  it('2. POST /api/v1/inventory/items — nurse gets 403', async () => {
    const res = await createItem(nurseToken);

    expect(res.status).toBe(403);
  });

  it('3. POST /api/v1/inventory/items — patient gets 403', async () => {
    const res = await createItem(patientToken);

    expect(res.status).toBe(403);
  });

  // -------------------------------------------------------------------------
  // List items
  // -------------------------------------------------------------------------

  it('4. GET /api/v1/inventory/items — admin can list items', async () => {
    await createItem(adminToken);

    const res = await request(app)
      .get('/api/v1/inventory/items')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('5. GET /api/v1/inventory/items — nurse can read items (read-only access)', async () => {
    await createItem(adminToken);

    const res = await request(app)
      .get('/api/v1/inventory/items')
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('6. GET /api/v1/inventory/items — patient gets 403', async () => {
    const res = await request(app)
      .get('/api/v1/inventory/items')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });

  it('7. GET /api/v1/inventory/items?category=PPE — filter by category', async () => {
    await createItem(adminToken, { category: 'PPE', code: 'SG-100' });
    await createItem(adminToken, { name: 'Saline Solution', code: 'SS-001', category: 'Fluids' });

    const res = await request(app)
      .get('/api/v1/inventory/items?category=PPE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const categories = res.body.data.map((i: { category: string }) => i.category);
    expect(categories.every((c: string) => c.toLowerCase().includes('ppe'))).toBe(true);
  });

  it('8. GET /api/v1/inventory/items?search=Glove — search filters results', async () => {
    await createItem(adminToken, { name: 'Surgical Gloves', code: 'SG-100' });
    await createItem(adminToken, { name: 'Bandages', code: 'BDG-200' });

    const res = await request(app)
      .get('/api/v1/inventory/items?search=Glove')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const names = res.body.data.map((i: { name: string }) => i.name);
    expect(names.some((n: string) => n.toLowerCase().includes('glove'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Get item by ID
  // -------------------------------------------------------------------------

  it('9. GET /api/v1/inventory/items/:id — admin gets item by ID', async () => {
    const createRes = await createItem(adminToken);
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/inventory/items/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(itemId);
  });

  it('10. GET /api/v1/inventory/items/:id — nurse can read item', async () => {
    const createRes = await createItem(adminToken);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/inventory/items/${itemId}`)
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Update item
  // -------------------------------------------------------------------------

  it('11. PATCH /api/v1/inventory/items/:id — admin updates item meta', async () => {
    const createRes = await createItem(adminToken);
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/inventory/items/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reorderLevel: 100, supplier: 'MedSupply Co.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reorderLevel).toBe(100);
    expect(res.body.data.supplier).toBe('MedSupply Co.');
  });

  it('12. PATCH /api/v1/inventory/items/:id — nurse gets 403', async () => {
    const createRes = await createItem(adminToken);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/inventory/items/${itemId}`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ reorderLevel: 100 });

    expect(res.status).toBe(403);
  });

  // -------------------------------------------------------------------------
  // Stock adjustments
  // -------------------------------------------------------------------------

  it('13. POST /api/v1/inventory/items/:id/stock — stock in increases quantity', async () => {
    const createRes = await createItem(adminToken, { quantity: 100 });
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'in', quantity: 50, reason: 'Restocking' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.item.quantity).toBe(150);
    expect(res.body.data.movement.type).toBe('in');
    expect(res.body.data.movement.previousQuantity).toBe(100);
    expect(res.body.data.movement.newQuantity).toBe(150);
  });

  it('14. POST /api/v1/inventory/items/:id/stock — stock out decreases quantity, movement recorded', async () => {
    const createRes = await createItem(adminToken, { quantity: 200 });
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'out', quantity: 75, reason: 'Used in surgery' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.item.quantity).toBe(125);
    expect(res.body.data.movement.type).toBe('out');
    expect(res.body.data.movement.newQuantity).toBe(125);
  });

  it('15. POST /api/v1/inventory/items/:id/stock — stock out rejected if insufficient quantity', async () => {
    const createRes = await createItem(adminToken, { quantity: 10 });
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'out', quantity: 50 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('16. POST /api/v1/inventory/items/:id/stock — waste rejected if insufficient quantity', async () => {
    const createRes = await createItem(adminToken, { quantity: 5 });
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'waste', quantity: 10 });

    expect(res.status).toBe(400);
  });

  it('17. POST /api/v1/inventory/items/:id/stock — adjustment sets absolute quantity', async () => {
    const createRes = await createItem(adminToken, { quantity: 100 });
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'adjustment', quantity: 75, reason: 'Physical count correction' });

    expect(res.status).toBe(200);
    expect(res.body.data.item.quantity).toBe(75);
    expect(res.body.data.movement.type).toBe('adjustment');
    expect(res.body.data.movement.previousQuantity).toBe(100);
    expect(res.body.data.movement.newQuantity).toBe(75);
  });

  it('18. POST /api/v1/inventory/items/:id/stock — low stock emits socket event when quantity <= reorderLevel', async () => {
    const createRes = await createItem(adminToken, {
      name: 'Low Stock Item',
      code: 'LSI-001',
      quantity: 60,
      reorderLevel: 50,
    });
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    // Take out stock to drop below reorder level (60 - 20 = 40, reorderLevel = 50, so alert fires)
    const res = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'out', quantity: 20 });

    expect(res.status).toBe(200);

    expect(emitToRole).toHaveBeenCalledWith(
      'admin',
      'inventory:low-stock',
      expect.objectContaining({
        itemId: expect.any(String),
        itemName: 'Low Stock Item',
        currentQuantity: 40,
        reorderLevel: 50,
      })
    );
  });

  it('19. No socket event emitted when quantity is above reorder level', async () => {
    const createRes = await createItem(adminToken, {
      name: 'Full Stock Item',
      code: 'FSI-001',
      quantity: 200,
      reorderLevel: 50,
    });
    const itemId = createRes.body.data._id;

    await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'out', quantity: 10 });

    expect(emitToRole).not.toHaveBeenCalledWith('admin', 'inventory:low-stock', expect.anything());
  });

  // -------------------------------------------------------------------------
  // Stock movements
  // -------------------------------------------------------------------------

  it('20. GET /api/v1/inventory/items/:id/movements — list movements for an item (newest first)', async () => {
    const createRes = await createItem(adminToken, { quantity: 500 });
    const itemId = createRes.body.data._id;

    // Create two movements
    await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'in', quantity: 100 });

    await request(app)
      .post(`/api/v1/inventory/items/${itemId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'out', quantity: 50 });

    const res = await request(app)
      .get(`/api/v1/inventory/items/${itemId}/movements`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    // Newest first
    const timestamps = res.body.data.map((m: { createdAt: string }) => new Date(m.createdAt).getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
    }
  });

  it('21. GET /api/v1/inventory/movements — list all movements (paginated)', async () => {
    // Create two items with movements
    const res1 = await createItem(adminToken, { name: 'Item A', code: 'IA-001', quantity: 100 });
    const res2 = await createItem(adminToken, { name: 'Item B', code: 'IB-002', quantity: 200 });

    await request(app)
      .post(`/api/v1/inventory/items/${res1.body.data._id}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'in', quantity: 50 });

    await request(app)
      .post(`/api/v1/inventory/items/${res2.body.data._id}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'out', quantity: 30 });

    const res = await request(app)
      .get('/api/v1/inventory/movements')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta).toMatchObject({
      total: expect.any(Number),
      page: 1,
      limit: expect.any(Number),
    });
  });

  it('22. GET /api/v1/inventory/movements — nurse can read movements', async () => {
    const res = await request(app)
      .get('/api/v1/inventory/movements')
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('23. GET /api/v1/inventory/items?lowStock=true — returns only low stock items', async () => {
    // Create item with high stock (well above reorder level)
    await createItem(adminToken, {
      name: 'High Stock Item',
      code: 'HSI-001',
      quantity: 200,
      reorderLevel: 50,
    });

    // Create item at/below reorder level
    await createItem(adminToken, {
      name: 'Critical Item',
      code: 'CIT-001',
      quantity: 10,
      reorderLevel: 50,
    });

    const res = await request(app)
      .get('/api/v1/inventory/items?lowStock=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((i: { name: string }) => i.name);
    expect(names).toContain('Critical Item');
    expect(names).not.toContain('High Stock Item');
  });
});
