const os = require('os');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const { execFile } = require('child_process');

const METRICS_FILE = path.join(__dirname, '..', 'data', 'metrics.json');
// Use process.cwd() so these paths match index.js and routes.js (resolved from project root)
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || path.join(process.cwd(), 'tmp', 'uploads'));
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || path.join(process.cwd(), 'tmp', 'outputs'));

// ── In-Memory Metrics State with File Persistence ───────────────────
let metricsCache = {
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  toolUsage: {},
  recentActivity: [] // Last 20 operations
};

// Load saved metrics on startup
(async function initMetrics() {
  try {
    const dir = path.dirname(METRICS_FILE);
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true });
    }
    if (fs.existsSync(METRICS_FILE)) {
      const data = await fsp.readFile(METRICS_FILE, 'utf8');
      metricsCache = Object.assign(metricsCache, JSON.parse(data));
    }
  } catch (err) {
    console.warn('[Diagnostics] Failed to load metrics.json, starting with fresh metrics:', err.message);
  }
})();

async function saveMetrics() {
  try {
    const dir = path.dirname(METRICS_FILE);
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true });
    }
    await fsp.writeFile(METRICS_FILE, JSON.stringify(metricsCache, null, 2), 'utf8');
  } catch (err) {
    // Non-fatal if metrics save fails
  }
}

/**
 * Record a tool execution event
 */
function recordMetric(toolId, success = true, durationMs = 0, fileSize = 0) {
  metricsCache.totalRequests += 1;
  if (success) {
    metricsCache.successRequests += 1;
  } else {
    metricsCache.failedRequests += 1;
  }

  metricsCache.toolUsage[toolId] = (metricsCache.toolUsage[toolId] || 0) + 1;

  const activityItem = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    toolId,
    success,
    durationMs: Math.round(durationMs),
    fileSize,
    timestamp: new Date().toISOString()
  };

  metricsCache.recentActivity.unshift(activityItem);
  if (metricsCache.recentActivity.length > 20) {
    metricsCache.recentActivity.pop();
  }

  // Persist asynchronously (debounced/fire-and-forget)
  saveMetrics().catch(() => {});
}

/**
 * Reset all recorded metrics
 */
async function resetMetrics() {
  metricsCache = {
    totalRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    toolUsage: {},
    recentActivity: []
  };
  await saveMetrics();
  return { success: true };
}

/**
 * Helper to execute binary version check with timeout
 */
function checkBinary(executablePath, args = ['--version']) {
  return new Promise((resolve) => {
    if (!executablePath) {
      return resolve({
        available: false,
        path: '(not configured)',
        version: null,
        error: 'Path tidak dikonfigurasi'
      });
    }

    execFile(executablePath, args, { timeout: 3500, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          available: false,
          path: executablePath,
          version: null,
          error: error.message || 'Execution failed'
        });
      } else {
        const raw = (stdout || stderr || '').trim();
        const firstLine = raw.split('\n')[0].trim();
        resolve({
          available: true,
          path: executablePath,
          version: firstLine || 'Available',
          error: null
        });
      }
    });
  });
}

/**
 * Calculate directory file count and byte size
 */
async function getDirStats(dirPath) {
  let fileCount = 0;
  let totalBytes = 0;

  try {
    if (!fs.existsSync(dirPath)) {
      return { fileCount: 0, totalBytes: 0, exists: false };
    }

    const files = await fsp.readdir(dirPath);
    for (const file of files) {
      if (file === '.gitkeep') continue;
      try {
        const fullPath = path.join(dirPath, file);
        const stats = await fsp.stat(fullPath);
        if (stats.isFile()) {
          fileCount += 1;
          totalBytes += stats.size;
        }
      } catch (_) {}
    }
  } catch (err) {
    return { fileCount: 0, totalBytes: 0, error: err.message };
  }

  return { fileCount, totalBytes, exists: true };
}

/**
 * Emergency purge for temporary and output directories
 */
async function purgeTempFiles() {
  let deletedFiles = 0;
  let freedBytes = 0;

  const purgeDir = async (dirPath) => {
    if (!fs.existsSync(dirPath)) return;
    const files = await fsp.readdir(dirPath);
    for (const file of files) {
      if (file === '.gitkeep') continue;
      const fullPath = path.join(dirPath, file);
      try {
        const stats = await fsp.stat(fullPath);
        if (stats.isFile()) {
          freedBytes += stats.size;
          await fsp.unlink(fullPath);
          deletedFiles += 1;
        } else if (stats.isDirectory()) {
          await fsp.rm(fullPath, { recursive: true, force: true });
          deletedFiles += 1;
        }
      } catch (err) {
        console.error(`[Diagnostics] Gagal menghapus ${fullPath}:`, err.message);
      }
    }
  };

  await purgeDir(TEMP_DIR);
  await purgeDir(OUTPUT_DIR);

  return {
    success: true,
    deletedFiles,
    freedBytes,
    message: `Pembersihan berhasil. ${deletedFiles} item dihapus (${(freedBytes / (1024 * 1024)).toFixed(2)} MB dibebaskan).`
  };
}

/**
 * Get comprehensive system diagnostics and metrics
 */
async function getDiagnostics() {
  // Resolve binaries path
  const librePath = process.env.LIBREOFFICE_PATH || 'soffice';
  const gsPath = process.env.GHOSTSCRIPT_PATH || (os.platform() === 'win32' ? 'gswin64c' : 'gs');
  const qpdfPath = process.env.QPDF_PATH || 'qpdf';
  const popplerFolder = process.env.POPPLER_PATH || '';
  const popplerExec = popplerFolder ? path.join(popplerFolder, 'pdftoppm') : 'pdftoppm';
  const chromiumPath = process.env.CHROMIUM_PATH || '';

  // Run binary checks in parallel
  // NOTE: Chromium and LibreOffice are checked via file existence only — running them often hangs or opens windows on Windows
  const fileExistsCheck = (binPath, fallbackName) => {
    if (!binPath) {
      return Promise.resolve({ available: true, path: `bundled (${fallbackName})`, version: `Bundled / System ${fallbackName}`, error: null });
    }
    const exists = fs.existsSync(binPath);
    return Promise.resolve({
      available: exists,
      path: binPath,
      version: exists ? 'Detected (path exists)' : null,
      error: exists ? null : 'File tidak ditemukan di path yang dikonfigurasi'
    });
  };

  const [libreRes, gsRes, qpdfRes, popplerRes, chromRes, uploadStats, outputStats] = await Promise.all([
    fileExistsCheck(librePath, 'soffice'),
    checkBinary(gsPath, ['--version']),
    checkBinary(qpdfPath, ['--version']),
    checkBinary(popplerExec, ['-v']),
    fileExistsCheck(chromiumPath, 'puppeteer'),
    getDirStats(TEMP_DIR),
    getDirStats(OUTPUT_DIR)
  ]);

  const mem = process.memoryUsage();
  const totalSystemMem = os.totalmem();
  const freeSystemMem = os.freemem();

  const successRate = metricsCache.totalRequests > 0
    ? parseFloat(((metricsCache.successRequests / metricsCache.totalRequests) * 100).toFixed(1))
    : 100;

  return {
    success: true,
    timestamp: new Date().toISOString(),
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      systemUptimeSeconds: Math.floor(os.uptime()),
      platform: os.platform(),
      osRelease: os.release(),
      arch: os.arch(),
      cpuCount: os.cpus()?.length || 1,
      nodeVersion: process.version,
      memory: {
        rssMb: parseFloat((mem.rss / (1024 * 1024)).toFixed(1)),
        heapUsedMb: parseFloat((mem.heapUsed / (1024 * 1024)).toFixed(1)),
        totalSystemMb: Math.round(totalSystemMem / (1024 * 1024)),
        freeSystemMb: Math.round(freeSystemMem / (1024 * 1024)),
        usagePercent: parseFloat((((totalSystemMem - freeSystemMem) / totalSystemMem) * 100).toFixed(1))
      }
    },
    binaries: {
      libreOffice: libreRes,
      ghostscript: gsRes,
      qpdf: qpdfRes,
      poppler: popplerRes,
      chromium: chromRes
    },
    storage: {
      uploadFilesCount: uploadStats.fileCount,
      uploadSizeBytes: uploadStats.totalBytes,
      outputFilesCount: outputStats.fileCount,
      outputSizeBytes: outputStats.totalBytes,
      totalTempFilesCount: uploadStats.fileCount + outputStats.fileCount,
      totalTempSizeBytes: uploadStats.totalBytes + outputStats.totalBytes,
      ttlMinutes: parseInt(process.env.FILE_TTL_MINUTES || '120', 10)
    },
    metrics: {
      totalRequests: metricsCache.totalRequests,
      successRequests: metricsCache.successRequests,
      failedRequests: metricsCache.failedRequests,
      successRate,
      toolUsage: metricsCache.toolUsage,
      recentActivity: metricsCache.recentActivity
    }
  };
}

module.exports = {
  recordMetric,
  resetMetrics,
  getDiagnostics,
  purgeTempFiles
};
