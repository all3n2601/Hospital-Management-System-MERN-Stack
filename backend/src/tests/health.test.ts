import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// We need to mock the rate limiter and requestLogger so they don't require Redis
jest.mock('../middleware/rateLimiter', () => ({
  rateLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../middleware/requestLogger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  requestLogger: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

import { app } from '../app';
import { AppError } from '../middleware/errorHandler';

describe('GET /api/v1/health', () => {
  it('returns 200 with success true and status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.timestamp).toBeDefined();
  });
});

describe('errorHandler middleware', () => {
  let testApp: express.Express;

  beforeAll(() => {
    // Build a minimal app with a test route that throws AppError
    testApp = express();
    testApp.use(express.json());

    testApp.get('/test-app-error', (_req, _res, next) => {
      next(new AppError(422, 'UNPROCESSABLE', 'Test app error', { field: 'value' }));
    });

    testApp.get('/test-generic-error', (_req, _res, next) => {
      next(new Error('Unexpected boom'));
    });

    // Import errorHandler directly
    const { errorHandler } = require('../middleware/errorHandler');
    testApp.use(errorHandler);
  });

  it('formats AppError into the standard error envelope', async () => {
    const res = await request(testApp).get('/test-app-error');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNPROCESSABLE');
    expect(res.body.error.message).toBe('Test app error');
    expect(res.body.error.details).toEqual({ field: 'value' });
  });

  it('formats generic errors as 500 INTERNAL_ERROR', async () => {
    const res = await request(testApp).get('/test-generic-error');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('CORS', () => {
  it('rejects requests from unlisted origins', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://evil.com');

    // CORS headers should NOT include the disallowed origin
    const allowOrigin = res.headers['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('http://evil.com');
  });

  it('allows requests from the configured allowed origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
