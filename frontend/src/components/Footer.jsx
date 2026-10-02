import { FileText, Shield, Trash2, Zap, ArrowUp, BookOpen, ExternalLink, Lock } from 'lucide-react';
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
    <footer className="bg-[#0c0e15] border-t border-[#232738] mt-20 text-[#8b90b0] relative">
      
      {/* ── Top Highlight Feature Pillars ────────────────────────────── */}
      <div className="border-b border-[#232738] bg-[#10121a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Feature 1 */}
            <div className="flex items-start gap-3 p-3.5 rounded-md bg-[#141724] border border-[#232738]">
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white mb-0.5">100% Offline & Private</h4>
                <p className="text-[11px] text-[#8288a6] leading-relaxed">
                  Dokumen diproses di komputer lokal / LAN. Tidak ada data yang diunggah ke cloud publik.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3 p-3.5 rounded-md bg-[#141724] border border-[#232738]">
              <div className="w-8 h-8 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white mb-0.5">Auto-Cleanup Otomatis</h4>
                <p className="text-[11px] text-[#8288a6] leading-relaxed">
                  Semua file sementara otomatis dihapus seketika setelah unduhan selesai agar hemat disk.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3 p-3.5 rounded-md bg-[#141724] border border-[#232738]">
              <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white mb-0.5">Native Engine Berkecepatan Tinggi</h4>
                <p className="text-[11px] text-[#8288a6] leading-relaxed">
                  Ditenagai LibreOffice, Ghostscript, QPDF, Poppler, dan OpenCV tanpa batasan kuota.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">

          {/* Col 1 & 2: Brand Information */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#e2001a] rounded-md flex items-center justify-center text-white">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                PDF<span className="text-[#e2001a]">Vault</span>
              </span>
            </Link>

            <p className="text-xs text-[#8288a6] leading-relaxed pr-4">
              Aplikasi pemroses dokumen PDF serbaguna untuk kebutuhan kantor dan pribadi. Dirancang mandiri (*self-hosted*), bebas kuota, dan menjaga kerahasiaan dokumen tanpa koneksi internet luar.
            </p>

            {/* Server Status */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#141724] border border-[#232738] text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-white font-medium">Local Host Ready</span>
              <span className="text-[#596082]">•</span>
              <span className="text-[#8b90b0]">v1.0.8</span>
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
                  <Link to={tool.route} className="hover:text-white transition-colors">
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
                  <Link to={tool.route} className="hover:text-white transition-colors">
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
                  <Link to={tool.route} className="hover:text-white transition-colors">
                    {tool.name}
                  </Link>
                </li>
              ))}
              {imageTools.map((tool) => (
                <li key={tool.id}>
                  <Link to={tool.route} className="hover:text-white transition-colors text-purple-300 hover:text-purple-200">
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
                <Link to="/changelog" className="hover:text-white transition-colors">
                  Changelog & Updates
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/itsmegaaa/pdfLan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1 transition-colors"
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
                  className="hover:text-white flex items-center gap-1 transition-colors"
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
                  className="hover:text-white flex items-center gap-1 transition-colors"
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
                  className="hover:text-white flex items-center gap-1 transition-colors"
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
      <div className="border-t border-[#232738] bg-[#090a10] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          <div className="flex items-center gap-3">
            <span>© 2026 PDFVault. Open Source.</span>
            <span className="text-[#3b4162]">•</span>
            <span className="text-[#687094]">Licensed under Apache-2.0</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141724] border border-[#232738] text-[#8b90b0] hover:text-white hover:border-[#383e58] transition-colors"
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

