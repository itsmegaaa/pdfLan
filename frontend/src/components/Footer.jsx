import { FileText, Shield, Trash2, Zap, ArrowUp, Heart, Sparkles, BookOpen, ExternalLink, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TOOLS } from '../constants/tools';

function GithubIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const organizeTools = TOOLS.filter((t) => t.category === 'organize' || t.category === 'edit');
  const convertTools = TOOLS.filter((t) => t.category === 'convert');
  const securityTools = TOOLS.filter((t) => t.category === 'optimize' || t.category === 'security');
  const imageTools = TOOLS.filter((t) => t.category === 'image');

  return (
    <footer className="bg-[#0e101a] border-t border-[#23273d] mt-24 text-[#8b90b0] relative overflow-hidden">
      
      {/* ── Top Highlight Feature Pillars ────────────────────────────── */}
      <div className="border-b border-[#23273d]/80 bg-[#131624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Feature 1 */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#181c2e]/60 border border-[#2d3150]/40">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">100% Offline & Private</h4>
                <p className="text-xs text-[#8288a6] leading-relaxed">
                  Dokumen diproses di komputer lokal / LAN. Tidak ada data yang diunggah ke cloud publik.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#181c2e]/60 border border-[#2d3150]/40">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Auto-Cleanup Otomatis</h4>
                <p className="text-xs text-[#8288a6] leading-relaxed">
                  Semua file sementara otomatis dihapus seketika setelah unduhan selesai agar hemat disk.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#181c2e]/60 border border-[#2d3150]/40">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Native Engine Berkecepatan Tinggi</h4>
                <p className="text-xs text-[#8288a6] leading-relaxed">
                  Ditenagai LibreOffice, Ghostscript, QPDF, Poppler, dan OpenCV tanpa batasan kuota.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">

          {/* Col 1 & 2: Brand Information & Donation */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-[#e2001a] to-[#b30015] rounded-xl flex items-center justify-center shadow-lg shadow-red-950/40">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                PDF<span className="text-[#e2001a]">Vault</span>
              </span>
            </Link>

            <p className="text-xs text-[#8288a6] leading-relaxed pr-4">
              Aplikasi pemroses dokumen PDF serbaguna untuk kebutuhan kantor dan pribadi. Dirancang mandiri (*self-hosted*), bebas kuota, dan menjaga kerahasiaan dokumen tanpa koneksi internet luar.
            </p>

            {/* Server Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151826] border border-[#282d46] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-white font-medium">Local Host Ready</span>
              <span className="text-[#596082]">•</span>
              <span className="text-[#8b90b0]">v1.0.8</span>
            </div>

            {/* Support button */}
            <div className="pt-2">
              <a
                href="https://tako.id/itsmega"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950/30 transition-all hover:scale-[1.02]"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Support Developer di Tako.id</span>
              </a>
            </div>
          </div>

          {/* Col 3: Organize & Edit */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              Organize & Edit
            </h4>
            <ul className="space-y-2.5 text-xs">
              {organizeTools.slice(0, 7).map((tool) => (
                <li key={tool.id}>
                  <Link to={tool.route} className="hover:text-white hover:translate-x-0.5 inline-block transition-transform">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Convert PDF */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Convert PDF
            </h4>
            <ul className="space-y-2.5 text-xs">
              {convertTools.slice(0, 7).map((tool) => (
                <li key={tool.id}>
                  <Link to={tool.route} className="hover:text-white hover:translate-x-0.5 inline-block transition-transform">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Security & Image Tools */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Security & AI
            </h4>
            <ul className="space-y-2.5 text-xs">
              {securityTools.map((tool) => (
                <li key={tool.id}>
                  <Link to={tool.route} className="hover:text-white hover:translate-x-0.5 inline-block transition-transform">
                    {tool.name}
                  </Link>
                </li>
              ))}
              {imageTools.map((tool) => (
                <li key={tool.id}>
                  <Link to={tool.route} className="hover:text-white hover:translate-x-0.5 inline-block transition-transform text-purple-300 hover:text-purple-200">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 6: Resources & Docs */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/changelog" className="hover:text-white flex items-center gap-1">
                  <span>Changelog</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/itsmegaaa/pdfLan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/itsmegaaa/pdfLan/blob/main/docs/DOCKER_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1"
                >
                  <span>Docker Guide</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/itsmegaaa/pdfLan/blob/main/docs/LOCAL_LAN_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1"
                >
                  <span>LAN Setup Guide</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/itsmegaaa/pdfLan/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1"
                >
                  <span>Report an Issue</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom Bar ──────────────────────────────────────────────── */}
      <div className="border-t border-[#23273d]/80 bg-[#0a0c14] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          <div className="flex items-center gap-3">
            <span>© 2026 PDFVault. Open Source.</span>
            <span className="text-[#3b4162]">•</span>
            <span className="text-[#687094]">Licensed under Apache-2.0</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c2e] hover:bg-[#252b45] text-white transition-colors"
              title="Kembali ke atas"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
}

