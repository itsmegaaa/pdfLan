import { Link, useLocation } from 'react-router-dom';
import { FileText, Menu, X, ChevronDown, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { TOOLS, CATEGORIES } from '../constants/tools';

function GithubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [isHttps, setIsHttps] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setIsHttps(window.location.protocol === 'https:');
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setToolsOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group tools by category for mega-dropdown
  const organizeTools = TOOLS.filter((t) => t.category === 'organize' || t.category === 'edit');
  const convertTools = TOOLS.filter((t) => t.category === 'convert');
  const securityTools = TOOLS.filter((t) => t.category === 'optimize' || t.category === 'security');
  const imageTools = TOOLS.filter((t) => t.category === 'image');

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2d3150]/80 bg-[#121522]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Left: Brand + Status Badges */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#e2001a] to-[#b30015] rounded-xl flex items-center justify-center shadow-lg shadow-red-950/40 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                PDF<span className="text-[#e2001a]">Vault</span>
              </span>
            </Link>

            {/* Version Pill */}
            <Link
              to="/changelog"
              className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              title="View Release Notes"
            >
              v1.0.8
            </Link>

            {/* LAN / Security Status Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1e2338] text-[#9ba3c7] border border-[#2d3150]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{isHttps ? 'HTTPS Secured' : 'LAN Active'}</span>
            </div>
          </div>

          {/* Center / Right: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">

            {/* All Tools Mega Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  toolsOpen
                    ? 'bg-[#1e2338] text-white'
                    : 'text-[#8b90b0] hover:text-white hover:bg-[#1e2338]/60'
                }`}
                aria-expanded={toolsOpen}
              >
                <span>Tools</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${toolsOpen ? 'rotate-180 text-red-400' : ''}`} />
              </button>

              {/* Mega Dropdown Menu */}
              {toolsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[760px] p-5 bg-[#171a29] border border-[#2d3150] rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="grid grid-cols-4 gap-6">

                    {/* Column 1: Organize & Edit */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
                        <span>📋 Organize & Edit</span>
                      </div>
                      <div className="space-y-1">
                        {organizeTools.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.route}
                            onClick={() => setToolsOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#a5abbf] hover:text-white hover:bg-[#232840] transition-colors group"
                          >
                            <span className="text-sm">{tool.icon}</span>
                            <span className="truncate group-hover:translate-x-0.5 transition-transform">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Convert */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                        <span>🔄 Convert PDF</span>
                      </div>
                      <div className="space-y-1">
                        {convertTools.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.route}
                            onClick={() => setToolsOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#a5abbf] hover:text-white hover:bg-[#232840] transition-colors group"
                          >
                            <span className="text-sm">{tool.icon}</span>
                            <span className="truncate group-hover:translate-x-0.5 transition-transform">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Security & Optimize */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                        <span>🔒 Security & Size</span>
                      </div>
                      <div className="space-y-1">
                        {securityTools.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.route}
                            onClick={() => setToolsOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#a5abbf] hover:text-white hover:bg-[#232840] transition-colors group"
                          >
                            <span className="text-sm">{tool.icon}</span>
                            <span className="truncate group-hover:translate-x-0.5 transition-transform">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: Image Tools & Highlights */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
                          <span>📸 Image & AI</span>
                        </div>
                        <div className="space-y-1">
                          {imageTools.map((tool) => (
                            <Link
                              key={tool.id}
                              to={tool.route}
                              onClick={() => setToolsOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#a5abbf] hover:text-white hover:bg-[#232840] transition-colors group"
                            >
                              <span className="text-sm">{tool.icon}</span>
                              <span className="truncate group-hover:translate-x-0.5 transition-transform">{tool.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Offline Guarantee Promo Box */}
                      <div className="mt-4 p-3 rounded-xl bg-[#1e2338]/80 border border-[#2d3150]/60">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white mb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>100% Offline</span>
                        </div>
                        <p className="text-[10px] text-[#8b90b0] leading-tight">
                          Semua file diproses di memori browser & LAN server.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Changelog Link */}
            <Link
              to="/changelog"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#8b90b0] hover:text-white hover:bg-[#1e2338]/60 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Changelog</span>
            </Link>

            {/* GitHub Repo */}
            <a
              href="https://github.com/itsmegaaa/pdfLan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#8b90b0] hover:text-white hover:bg-[#1e2338]/60 transition-colors"
              title="GitHub Repository"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>

          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/changelog"
              className="p-2 text-[#8b90b0] hover:text-white"
              title="Changelog"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </Link>
            <button
              className="text-[#8b90b0] hover:text-white p-2 rounded-lg hover:bg-[#1e2338]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#151824] border-t border-[#2d3150] px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto">

          {/* Mobile Status */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e2338] border border-[#2d3150]">
            <span className="text-xs text-[#8b90b0]">Mode Server:</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {isHttps ? 'HTTPS Secured' : 'Local LAN Active'}
            </span>
          </div>

          {/* Mobile Tool Categories */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#8b90b0] uppercase tracking-wider px-1">Daftar Alat Populer</div>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.slice(0, 10).map((tool) => (
                <Link
                  key={tool.id}
                  to={tool.route}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1d2d] border border-[#2d3150]/60 text-xs font-medium text-white hover:border-red-500/40"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{tool.icon}</span>
                  <span className="truncate">{tool.name}</span>
                </Link>
              ))}
            </div>
            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <span>Lihat Semua {TOOLS.length} Alat PDF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Quick Links */}
          <div className="pt-2 border-t border-[#2d3150] space-y-2">
            <Link
              to="/changelog"
              className="flex items-center gap-2 py-2 text-sm font-medium text-[#8b90b0] hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Changelog & Update</span>
            </Link>
            <a
              href="https://github.com/itsmegaaa/pdfLan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2 text-sm font-medium text-[#8b90b0] hover:text-white"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub Repository</span>
            </a>
          </div>

        </div>
      )}
    </nav>
  );
}

