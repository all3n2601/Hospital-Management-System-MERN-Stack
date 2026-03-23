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

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Set required env vars
  process.env.JWT_SECRET = 'test-secret-key-for-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jwt';
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const validUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'SecurePass1!',
};

// Helper: register + get tokens
async function registerAndGetTokens(overrides: Partial<typeof validUser> = {}) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ ...validUser, ...overrides });
  return res;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns 201 with accessToken and user object', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user).toMatchObject({
      email: validUser.email,
      firstName: validUser.firstName,
      lastName: validUser.lastName,
      role: 'patient',
    });
    expect(res.body.data.user.password).toBeUndefined();
    // refreshToken should be set as a cookie
    expect(res.headers['set-cookie']).toBeDefined();
    const cookies: string[] = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : [res.headers['set-cookie']];
    expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
  });

  it('returns 409 for duplicate email', async () => {
    await registerAndGetTokens();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 400 for invalid password (no uppercase)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, password: 'nouppercase1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await registerAndGetTokens();
  });

  it('returns 200 with accessToken and sets refreshToken cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    const cookies: string[] = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : [res.headers['set-cookie']];
    expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'WrongPass1!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('locks account after 5 failed attempts and 6th attempt returns 401 with locked message', async () => {
    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'WrongPass1!' });
    }

    // 6th attempt — should be locked
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/locked/i);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns new accessToken with valid cookie and revokes old refresh token', async () => {
    // Register to get a refresh token cookie
    const registerRes = await registerAndGetTokens();
    const cookies: string[] = Array.isArray(registerRes.headers['set-cookie'])
      ? registerRes.headers['set-cookie']
      : [registerRes.headers['set-cookie']];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();

    // Use the refresh token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie!);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    // New refresh token cookie should be set
    const newCookies: string[] = Array.isArray(refreshRes.headers['set-cookie'])
      ? refreshRes.headers['set-cookie']
      : [refreshRes.headers['set-cookie']];
    expect(newCookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);

    // Old token should be revoked — using it again should fail
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie!);

    expect(reuseRes.status).toBe(401);
  });

  it('reuse attack: using already-used token returns 401 and revokes entire family', async () => {
    const registerRes = await registerAndGetTokens();
    const cookies: string[] = Array.isArray(registerRes.headers['set-cookie'])
      ? registerRes.headers['set-cookie']
      : [registerRes.headers['set-cookie']];
    const originalCookie = cookies.find((c: string) => c.startsWith('refreshToken='))!;

    // Use the token once (rotates it)
    const firstRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalCookie);
    expect(firstRefresh.status).toBe(200);

    // Get the new token from first rotation
    const newCookies: string[] = Array.isArray(firstRefresh.headers['set-cookie'])
      ? firstRefresh.headers['set-cookie']
      : [firstRefresh.headers['set-cookie']];
    const newCookie = newCookies.find((c: string) => c.startsWith('refreshToken='))!;

    // Attacker replays the OLD token — should detect reuse, revoke entire family
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalCookie);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.message).toMatch(/reuse/i);

    // The new token (from the valid rotation) should also be revoked now
    const newTokenRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', newCookie);

    expect(newTokenRes.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes refresh token and clears cookie', async () => {
    const registerRes = await registerAndGetTokens();
    const cookies: string[] = Array.isArray(registerRes.headers['set-cookie'])
      ? registerRes.headers['set-cookie']
      : [registerRes.headers['set-cookie']];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='))!;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.data.message).toBe('Logged out successfully');

    // After logout, refresh token should not work
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns user info with valid Bearer token', async () => {
    const registerRes = await registerAndGetTokens();
    const { accessToken } = registerRes.body.data;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user).toBeDefined();
    expect(meRes.body.data.user._id).toBeDefined();
    expect(meRes.body.data.user.role).toBe('patient');
  });

  it('returns 401 without token', async () => {
    const meRes = await request(app).get('/api/v1/auth/me');

    expect(meRes.status).toBe(401);
    expect(meRes.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/forgot-password', () => {
  it('returns same 200 message for registered and non-existent emails (anti-enumeration)', async () => {
    // Register a user first
    await registerAndGetTokens();

    // Attempt with registered email
    const resRegistered = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: validUser.email });

    // Attempt with non-existent email
    const resUnknown = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    // Both should return 200 with identical message
    expect(resRegistered.status).toBe(200);
    expect(resUnknown.status).toBe(200);
    expect(resRegistered.body.success).toBe(true);
    expect(resUnknown.body.success).toBe(true);
    expect(resRegistered.body.data.message).toBe(resUnknown.body.data.message);
    expect(resRegistered.body.data.message).toMatch(/reset link/i);
  });
});

describe('POST /api/v1/auth/logout-all', () => {
  it('returns 200 and subsequent refresh with a pre-logout cookie fails', async () => {
    // Register to get tokens
    const registerRes = await registerAndGetTokens();
    const { accessToken } = registerRes.body.data;
    const cookies: string[] = Array.isArray(registerRes.headers['set-cookie'])
      ? registerRes.headers['set-cookie']
      : [registerRes.headers['set-cookie']];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='))!;

    // Logout from all devices using the access token
    const logoutAllRes = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logoutAllRes.status).toBe(200);
    expect(logoutAllRes.body.success).toBe(true);
    expect(logoutAllRes.body.data.message).toMatch(/all devices/i);

    // The pre-logout refresh token cookie should no longer work
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(401);
  });
});
