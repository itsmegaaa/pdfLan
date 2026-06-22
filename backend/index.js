require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const routes = require('./routes');

const app = express();
const PORT = process.env.APP_PORT || process.env.PORT || 3000;
const HOST = process.env.APP_HOST || '0.0.0.0';

// ── Directories setup ──────────────────────────────────────────────
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || './tmp/uploads');
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './tmp/outputs');
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(OUTPUT_DIR);

// ── Middlewares ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// ── API Routes (MUST BE BEFORE STATIC/CATCH-ALL) ───────────────────
app.use('/api', limiter, routes);

// ── Frontend Static Files & SPA Catch-all ──────────────────────────
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback to index.html for SPA routing
// Using /.*/ regex pattern which is safe for all Express versions
app.get(/.*/, (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built yet. Run "npm run build" in frontend directory.');
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
});

// ── Cron Job (Auto Cleanup) ────────────────────────────────────────
const TTL_MINUTES = parseInt(process.env.FILE_TTL_MINUTES || '10', 10);

cron.schedule('*/15 * * * *', async () => {
  console.log('[Cron] Menjalankan pembersihan file...');
  const now = Date.now();
  const maxAgeMs = TTL_MINUTES * 60 * 1000;

  const cleanDir = async (dir) => {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(dir, file);
        try {
          const stats = await fs.stat(filePath);
          if (now - stats.mtimeMs > maxAgeMs) {
            await fs.remove(filePath);
            console.log(`[Cron] Menghapus: ${file}`);
          }
        } catch (fileErr) {
          console.error(`[Cron] Gagal menghapus ${filePath}:`, fileErr.message);
        }
      }
    } catch (err) {
      console.error(`[Cron] Gagal membersihkan direktori ${dir}:`, err);
    }
  };

  await cleanDir(TEMP_DIR);
  await cleanDir(OUTPUT_DIR);
  console.log('[Cron] Pembersihan selesai.');
});

// ── Start Server ───────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server berjalan di http://${HOST}:${PORT}`);
  console.log(`📁 Temp Dir:   ${TEMP_DIR}`);
  console.log(`📁 Output Dir: ${OUTPUT_DIR}`);
});
