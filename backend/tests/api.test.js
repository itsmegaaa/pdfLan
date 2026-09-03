process.env.NODE_ENV = 'test';

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

describe('API Routing & Error Handling Tests', () => {
  test('should return 404 for unknown API route', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.status).toBe(404);
  });

  test('should reject HTML to PDF request without URL', async () => {
    const res = await request(app)
      .post('/api/convert/html-to-pdf')
      .send({});

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('URL wajib diisi');
  });

  test('should block SSRF loopback attempt via /api/convert/html-to-pdf', async () => {
    const res = await request(app)
      .post('/api/convert/html-to-pdf')
      .send({ url: 'http://127.0.0.1:3000' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/diblokir|SSRF/i);
  });

  test('should block LFI file protocol attempt via /api/convert/html-to-pdf', async () => {
    const res = await request(app)
      .post('/api/convert/html-to-pdf')
      .send({ url: 'file:///C:/Windows/win.ini' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('tidak diizinkan');
  });
});
