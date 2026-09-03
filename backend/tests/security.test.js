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

describe('Security & File Validation Tests', () => {
  describe('File Signature (Magic Bytes) Verification', () => {
    test('should reject fake PDF file (text file renamed to .pdf)', async () => {
      const fakePdfBuffer = Buffer.from('This is a plain text file, not a real PDF!');
      const res = await request(app)
        .post('/api/compress')
        .attach('file', fakePdfBuffer, 'fake.pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('File signature tidak valid (bukan PDF asli)');
    });

    test('should reject fake JPG image (text file renamed to .jpg)', async () => {
      const fakeJpgBuffer = Buffer.from('Fake image content');
      const res = await request(app)
        .post('/api/image/remove-background')
        .attach('file', fakeJpgBuffer, 'fake.jpg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('File signature tidak valid (bukan JPG asli)');
    });

    test('should reject unsupported file extension (.exe, .sh, .bat)', async () => {
      const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
      const res = await request(app)
        .post('/api/compress')
        .attach('file', exeBuffer, 'malicious.exe');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/tidak didukung/i);
    });
  });

  describe('Download Security & Path Traversal Prevention', () => {
    test('should return 404 for non-existent fileId', async () => {
      const res = await request(app).get('/api/download/non-existent-uuid-12345.pdf');
      expect(res.status).toBe(404);
      expect(res.text).toContain('File tidak ditemukan atau sudah expired');
    });

    test('should sanitize path traversal attempts in download endpoint', async () => {
      const res = await request(app).get('/api/download/..%2F..%2F..%2FWindows%2Fwin.ini');
      expect(res.status).toBe(404);
      expect(res.text).toContain('File tidak ditemukan atau sudah expired');
    });
  });
});
