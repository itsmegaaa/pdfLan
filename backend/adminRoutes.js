const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDiagnostics, purgeTempFiles, resetMetrics } = require('./utils/diagnostics');

// Secret for signing admin sessions during server runtime
const SERVER_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function generateToken(pin) {
  return crypto.createHmac('sha256', SERVER_SESSION_SECRET).update(String(pin)).digest('hex');
}

/**
 * Middleware to enforce PIN authentication if ADMIN_PIN is set in environment
 */
function requireAdminAuth(req, res, next) {
  const configuredPin = process.env.ADMIN_PIN;

  // If no PIN is configured, admin dashboard is open by default
  if (!configuredPin) return next();

  // Localhost bypass: requests from the desktop .exe (127.0.0.1 / ::1)
  // are always trusted without a PIN
  const ip = req.ip || req.connection?.remoteAddress || '';
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (isLocalhost) return next();

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.headers['x-admin-token'] || req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi admin tidak ditemukan.' });
  }

  const expectedToken = generateToken(configuredPin);
  if (token !== expectedToken) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Token admin tidak valid atau sudah kedaluwarsa.' });
  }

  next();
}

// ── Check if PIN is required ───────────────────────────────────────
router.get('/auth/status', (req, res) => {
  const pinConfigured = Boolean(process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim() !== '');
  res.json({
    success: true,
    pinRequired: pinConfigured
  });
});

// ── Verify Admin PIN ───────────────────────────────────────────────
router.post('/auth/verify', (req, res) => {
  const configuredPin = process.env.ADMIN_PIN;
  const { pin } = req.body || {};

  // If no PIN is configured, access is automatically granted
  if (!configuredPin) {
    return res.json({
      success: true,
      token: generateToken('open_access'),
      message: 'PIN tidak dikonfigurasi, akses admin diberikan.'
    });
  }

  if (!pin || String(pin).trim() !== String(configuredPin).trim()) {
    return res.status(401).json({
      success: false,
      message: 'PIN admin salah. Silakan coba lagi.'
    });
  }

  const token = generateToken(configuredPin);
  res.json({
    success: true,
    token,
    message: 'Autentikasi admin berhasil.'
  });
});

// ── Get System Diagnostics & Metrics ───────────────────────────────
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const stats = await getDiagnostics();
    res.json(stats);
  } catch (err) {
    console.error('[Admin] Gagal mengambil data diagnostik:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data diagnostik server.' });
  }
});

// ── Purge Temporary Files On Demand ────────────────────────────────
router.post('/cleanup', requireAdminAuth, async (req, res) => {
  try {
    const result = await purgeTempFiles();
    res.json(result);
  } catch (err) {
    console.error('[Admin] Gagal membersihkan file temp:', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan pembersihan file sementara.' });
  }
});

// ── Reset Metrics Counter ──────────────────────────────────────────
router.post('/reset-stats', requireAdminAuth, async (req, res) => {
  try {
    await resetMetrics();
    res.json({ success: true, message: 'Statistik metrik berhasil direset.' });
  } catch (err) {
    console.error('[Admin] Gagal mereset metrik:', err);
    res.status(500).json({ success: false, message: 'Gagal mereset statistik metrik.' });
  }
});

module.exports = router;
