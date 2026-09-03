const {
  isPrivateIp,
  isBlockedHostname,
  validateUrlSafe,
  isSafeSubrequest
} = require('../utils/ssrfGuard');

describe('SSRF & LFI Security Guard Unit Tests', () => {
  describe('isPrivateIp', () => {
    test('should identify loopback IPv4 addresses as private', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('127.0.0.2')).toBe(true);
      expect(isPrivateIp('127.255.255.254')).toBe(true);
    });

    test('should identify RFC 1918 private IPv4 networks', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('10.255.255.255')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.254')).toBe(true);
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('192.168.0.254')).toBe(true);
    });

    test('should identify link-local and cloud metadata addresses', () => {
      expect(isPrivateIp('169.254.169.254')).toBe(true);
      expect(isPrivateIp('169.254.1.1')).toBe(true);
    });

    test('should identify IPv6 private and loopback addresses', () => {
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('::')).toBe(true);
      expect(isPrivateIp('fe80::1')).toBe(true);
      expect(isPrivateIp('fc00::1')).toBe(true);
      expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
      expect(isPrivateIp('::ffff:192.168.1.1')).toBe(true);
    });

    test('should recognize public IPv4 addresses as non-private', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
      expect(isPrivateIp('93.184.216.34')).toBe(false);
    });
  });

  describe('isBlockedHostname', () => {
    test('should block known local and internal hostnames', () => {
      expect(isBlockedHostname('localhost')).toBe(true);
      expect(isBlockedHostname('app.localhost')).toBe(true);
      expect(isBlockedHostname('server.local')).toBe(true);
      expect(isBlockedHostname('db.internal')).toBe(true);
      expect(isBlockedHostname('broadcasthost')).toBe(true);
    });

    test('should allow public domain names', () => {
      expect(isBlockedHostname('example.com')).toBe(false);
      expect(isBlockedHostname('google.com')).toBe(false);
    });
  });

  describe('validateUrlSafe', () => {
    test('should reject invalid or non-http protocols (LFI protection)', async () => {
      await expect(validateUrlSafe('file:///C:/Windows/win.ini')).rejects.toThrow(/tidak diizinkan/);
      await expect(validateUrlSafe('file:///etc/passwd')).rejects.toThrow(/tidak diizinkan/);
      await expect(validateUrlSafe('javascript:alert(1)')).rejects.toThrow(/tidak diizinkan/);
      await expect(validateUrlSafe('data:text/html,<h1>test</h1>')).rejects.toThrow(/tidak diizinkan/);
      await expect(validateUrlSafe('gopher://127.0.0.1:6379')).rejects.toThrow(/tidak diizinkan/);
    });

    test('should reject localhost and loopback targets (SSRF protection)', async () => {
      await expect(validateUrlSafe('http://localhost:3000')).rejects.toThrow(/diblokir/);
      await expect(validateUrlSafe('http://127.0.0.1:3000')).rejects.toThrow(/diblokir/);
      await expect(validateUrlSafe('http://0.0.0.0:3000')).rejects.toThrow(/diblokir/);
    });

    test('should reject internal LAN and metadata IP targets', async () => {
      await expect(validateUrlSafe('http://192.168.1.1')).rejects.toThrow(/diblokir/);
      await expect(validateUrlSafe('http://10.0.0.1')).rejects.toThrow(/diblokir/);
      await expect(validateUrlSafe('http://169.254.169.254')).rejects.toThrow(/diblokir/);
    });

    test('should allow valid public URLs', async () => {
      const parsed = await validateUrlSafe('https://example.com');
      expect(parsed.hostname).toBe('example.com');
      expect(parsed.protocol).toBe('https:');
    });
  });

  describe('isSafeSubrequest', () => {
    test('should allow inline data and blob assets', () => {
      expect(isSafeSubrequest('data:image/png;base64,abc...')).toBe(true);
      expect(isSafeSubrequest('blob:http://example.com/uuid')).toBe(true);
    });

    test('should block local files or private network subrequests', () => {
      expect(isSafeSubrequest('file:///C:/Windows/win.ini')).toBe(false);
      expect(isSafeSubrequest('http://127.0.0.1:8080/token')).toBe(false);
      expect(isSafeSubrequest('http://localhost:3000/api')).toBe(false);
      expect(isSafeSubrequest('http://192.168.1.1/admin')).toBe(false);
    });
  });
});
