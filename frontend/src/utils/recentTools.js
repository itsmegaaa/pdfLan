/** Riwayat tool terakhir dipakai, simpan lokal (offline-first). */

const RECENT_KEY = 'pdfvault_recent';
const MAX_RECENT = 6;

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function getRecent() {
  return read();
}

export function pushRecent(toolId) {
  try {
    const cur = read().filter((id) => id !== toolId);
    cur.unshift(toolId);
    localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, MAX_RECENT)));
  } catch { /* storage penuh / private mode */ }
}
