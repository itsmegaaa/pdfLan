process.env.NODE_ENV = 'test';
process.env.ADMIN_PIN = '654321';

jest.mock('../utils/binaries', () => ({
  libreOfficeConvert: jest.fn(),
  ghostscriptCompress: jest.fn(),
  qpdfProtect: jest.fn(),
  qpdfUnlock: jest.fn(),
  ghostscriptPdfA: jest.fn(),
  popplerPdfToJpg: jest.fn(),
}));

const request = require('supertest');
const app = require('../index');

describe('Admin & Monitoring API Tests', () => {
  let adminToken = '';

  test('GET /api/admin/auth/status should report PIN is required', async () => {
    const res = await request(app).get('/api/admin/auth/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pinRequired).toBe(true);
  });

  test('POST /api/admin/auth/verify should reject incorrect PIN', async () => {
    const res = await request(app)
      .post('/api/admin/auth/verify')
      .send({ pin: 'wrong-pin' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('salah');
  });

  test('POST /api/admin/auth/verify should accept correct PIN and return token', async () => {
    const res = await request(app)
      .post('/api/admin/auth/verify')
      .send({ pin: '654321' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    adminToken = res.body.token;
  });

  test('GET /api/admin/stats should block unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/admin/stats should return system telemetry and diagnostics with valid token', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.system).toBeDefined();
    expect(res.body.system.platform).toBeDefined();
    expect(res.body.system.memory).toBeDefined();
    expect(res.body.binaries).toBeDefined();
    expect(res.body.storage).toBeDefined();
    expect(res.body.metrics).toBeDefined();
  });

  test('POST /api/admin/cleanup should purge temporary files on demand', async () => {
    const res = await request(app)
      .post('/api/admin/cleanup')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deletedFiles).toBeDefined();
    expect(res.body.freedBytes).toBeDefined();
  });

  test('POST /api/admin/reset-stats should reset metrics with valid token', async () => {
    const res = await request(app)
      .post('/api/admin/reset-stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
