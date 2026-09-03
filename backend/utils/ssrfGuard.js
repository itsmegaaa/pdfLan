const dns = require('dns').promises;
const net = require('net');

/**
 * Konversi IPv4 string ke 32-bit unsigned integer
 */
function ip4ToLong(ip) {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);
}

/**
 * Cek apakah IP integer berada dalam subnet CIDR
 */
function inCidr(ipLong, cidrIp, prefixLen) {
  if (ipLong === null) return false;
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  const cidrLong = ip4ToLong(cidrIp);
  return (ipLong & mask) === (cidrLong & mask);
}

/**
 * Cek apakah IPv4 adalah alamat private/lokal/reserved
 */
function isPrivateIpv4(ip) {
  const ipLong = ip4ToLong(ip);
  if (ipLong === null) return true; // Invalid format dianggap tidak aman

  // Daftar rentang IP private & reserved (RFC 1918, RFC 3927, RFC 5735, dll.)
  const privateRanges = [
    { cidr: '0.0.0.0', prefix: 8 },      // Current network (0.0.0.0/8)
    { cidr: '10.0.0.0', prefix: 8 },     // Private Class A (10.0.0.0/8)
    { cidr: '100.64.0.0', prefix: 10 },  // Carrier-grade NAT (100.64.0.0/10)
    { cidr: '127.0.0.0', prefix: 8 },    // Loopback (127.0.0.0/8)
    { cidr: '169.254.0.0', prefix: 16 }, // Link-Local / Cloud Metadata (169.254.0.0/16)
    { cidr: '172.16.0.0', prefix: 12 },  // Private Class B (172.16.0.0/12)
    { cidr: '192.0.0.0', prefix: 24 },   // IETF Protocol Assignments (192.0.0.0/24)
    { cidr: '192.0.2.0', prefix: 24 },   // TEST-NET-1 (192.0.2.0/24)
    { cidr: '192.88.99.0', prefix: 24 }, // 6to4 Relay Anycast (192.88.99.0/24)
    { cidr: '192.168.0.0', prefix: 16 }, // Private Class C (192.168.0.0/16)
    { cidr: '198.18.0.0', prefix: 15 },  // Network Benchmark (198.18.0.0/15)
    { cidr: '198.51.100.0', prefix: 24 },// TEST-NET-2 (198.51.100.0/24)
    { cidr: '203.0.113.0', prefix: 24 }, // TEST-NET-3 (203.0.113.0/24)
    { cidr: '224.0.0.0', prefix: 4 },    // Multicast (224.0.0.0/4)
    { cidr: '240.0.0.0', prefix: 4 },    // Reserved (240.0.0.0/4)
    { cidr: '255.255.255.255', prefix: 32 } // Broadcast
  ];

  return privateRanges.some(r => inCidr(ipLong, r.cidr, r.prefix));
}

/**
 * Cek apakah IPv6 adalah alamat private/lokal/reserved
 */
function isPrivateIpv6(ip) {
  const normalized = ip.toLowerCase();

  // Loopback & Unspecified
  if (normalized === '::1' || normalized === '::' || normalized === '0:0:0:0:0:0:0:0') {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 atau ::ffff:7f00:1)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(ipv4Part)) {
      return isPrivateIpv4(ipv4Part);
    }
  }

  // Unique Local Address (fc00::/7 -> fc00: to fdff:)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) {
    return true;
  }

  // Link-Local Address (fe80::/10 -> fe80: to febf:)
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Cek apakah IP adalah private/lokal
 */
function isPrivateIp(ip) {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true; // Jika bukan format IP yang valid, anggap berbahaya
}

/**
 * Daftar domain/hostname terlarang
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'broadcasthost',
  'ip6-localhost',
  'ip6-loopback'
]);

function isBlockedHostname(hostname) {
  const host = hostname.toLowerCase().trim();
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  return false;
}

/**
 * Validasi ketat terhadap URL input sebelum diakses oleh Puppeteer
 * @param {string} rawUrl
 * @returns {Promise<URL>} Objek URL yang sudah divalidasi
 */
async function validateUrlSafe(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL wajib diisi dan harus berupa teks.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    throw new Error('Format URL tidak valid. Pastikan menyertakan http:// atau https://');
  }

  // 1. Skema protokol hanya boleh http atau https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Protokol "${parsed.protocol}" tidak diizinkan. Hanya http:// dan https:// yang didukung demi keamanan.`);
  }

  const hostname = parsed.hostname;

  // 2. Cek apakah hostname masuk blacklist domain lokal
  if (isBlockedHostname(hostname)) {
    throw new Error('Akses ke domain lokal atau internal diblokir demi keamanan (SSRF Protection).');
  }

  // 3. Jika hostname adalah IP langsung (Literal IP)
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error(`Akses ke alamat IP lokal/privat (${hostname}) diblokir demi keamanan (SSRF Protection).`);
    }
    return parsed;
  }

  // 4. Resolusi DNS untuk memeriksa apakah domain mengarah ke IP privat
  let addresses = [];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (dnsErr) {
    throw new Error(`Gagal menyelesaikan domain "${hostname}". Pastikan URL aktif dan terhubung ke internet.`);
  }

  if (!addresses || addresses.length === 0) {
    throw new Error(`Domain "${hostname}" tidak mengembalikan alamat IP yang valid.`);
  }

  for (const addr of addresses) {
    if (isPrivateIp(addr.address)) {
      throw new Error(`Domain "${hostname}" mengarah ke alamat IP lokal/privat (${addr.address}). Akses ditolak demi keamanan (SSRF Protection).`);
    }
  }

  return parsed;
}

/**
 * Validasi sub-request Puppeteer
 */
function isSafeSubrequest(reqUrl) {
  try {
    const parsed = new URL(reqUrl);
    // Izinkan data: atau blob: untuk asset gambar inline
    if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') {
      return true;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (isBlockedHostname(parsed.hostname)) {
      return false;
    }
    if (net.isIP(parsed.hostname) && isPrivateIp(parsed.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  isPrivateIp,
  isBlockedHostname,
  validateUrlSafe,
  isSafeSubrequest
};
