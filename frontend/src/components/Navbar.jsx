import { Link, useLocation } from 'react-router-dom';
import { FileText, Menu, X, ChevronDown, History, ShieldCheck, Layers, ArrowLeftRight, Lock, Image as ImageIcon } from 'lucide-react';
import { ToolIcon } from './ToolIcon';
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
    <nav className="sticky top-0 z-50 border-b border-border bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Left: Brand + Status Badges */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                PDF<span className="text-primary">Vault</span>
              </span>
            </Link>

            {/* Version Badge */}
            <Link
              to="/changelog"
              className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono text-text-muted bg-surface border border-border hover:text-white hover:border-border-hover"
              title="View Release Notes"
            >
              v1.1.0
            </Link>

            {/* LAN / Security Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-text-muted border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{isHttps ? 'HTTPS Secured' : 'LAN Active'}</span>
            </div>
          </div>

          {/* Center / Right: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">

            {/* All Tools Mega Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  toolsOpen
                    ? 'bg-surface-hover text-white border border-border'
                    : 'text-text-muted hover:text-white hover:bg-surface-hover'
                }`}
                aria-expanded={toolsOpen}
                aria-haspopup="true"
                aria-controls="tools-mega-dropdown"
              >
                <span>Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${toolsOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* Mega Dropdown Menu */}
              {toolsOpen && (
                <div id="tools-mega-dropdown" className="absolute right-0 top-full mt-1.5 w-[min(740px,92vw)] p-4 bg-surface border border-border rounded-lg shadow-xl shadow-black/40 z-50">
                  <div className="grid grid-cols-4 gap-4">

                    {/* Column 1: Organize & Edit */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
                        <Layers className="w-3.5 h-3.5" /><span>Organize & Edit</span>
                      </div>
                      <div className="space-y-1">
                        {organizeTools.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.route}
                            onClick={() => setToolsOpen(false)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-text-muted hover:text-white hover:bg-surface-hover transition-colors"
                          >
                            <ToolIcon tool={tool} colored className="w-3.5 h-3.5" />
                            <span className="truncate">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Convert */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                        <ArrowLeftRight className="w-3.5 h-3.5" /><span>Convert PDF</span>
                      </div>
                      <div className="space-y-1">
                        {convertTools.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.route}
                            onClick={() => setToolsOpen(false)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-text-muted hover:text-white hover:bg-surface-hover transition-colors"
                          >
                            <ToolIcon tool={tool} colored className="w-3.5 h-3.5" />
                            <span className="truncate">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Security & Optimize */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                        <Lock className="w-3.5 h-3.5" /><span>Security & Size</span>
                      </div>
                      <div className="space-y-1">
                        {securityTools.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.route}
                            onClick={() => setToolsOpen(false)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-text-muted hover:text-white hover:bg-surface-hover transition-colors"
                          >
                            <ToolIcon tool={tool} colored className="w-3.5 h-3.5" />
                            <span className="truncate">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: Image Tools & Highlights */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
                          <ImageIcon className="w-3.5 h-3.5" /><span>Image & AI</span>
                        </div>
                        <div className="space-y-1">
                          {imageTools.map((tool) => (
                            <Link
                              key={tool.id}
                              to={tool.route}
                              onClick={() => setToolsOpen(false)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-text-muted hover:text-white hover:bg-surface-hover transition-colors"
                            >
                              <ToolIcon tool={tool} colored className="w-3.5 h-3.5" />
                              <span className="truncate">{tool.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Offline Guarantee Promo Box */}
                      <div className="mt-3 p-2.5 rounded-md bg-surface-hover border border-border">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white mb-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>100% Offline</span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-tight">
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-text-muted hover:text-white hover:bg-surface-hover transition-colors"
            >
              <History className="w-3.5 h-3.5 text-text-muted" />
              <span>Changelog</span>
            </Link>

            {/* GitHub Repo */}
            <a
              href="https://github.com/itsmegaaa/pdfLan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-text-muted hover:text-white hover:bg-surface-hover transition-colors"
              title="GitHub Repository"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-1.5 md:hidden">
            <Link
              to="/changelog"
              className="p-1.5 text-text-muted hover:text-white"
              title="Changelog"
            >
              <History className="w-4 h-4" />
            </Link>
            <button
              className="text-text-muted hover:text-white p-1.5 rounded-md hover:bg-surface-hover"
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
        <div className="md:hidden bg-bg border-t border-border px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto">

          {/* Mobile Status */}
          <div className="flex items-center justify-between p-2.5 rounded-md bg-surface border border-border">
            <span className="text-xs text-text-muted">Mode Server:</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {isHttps ? 'HTTPS Secured' : 'Local LAN Active'}
            </span>
          </div>

          {/* Mobile Tool Categories */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider px-1">Semua Alat</div>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.id}
                  to={tool.route}
                  className="flex items-center gap-2 p-2 rounded-md bg-surface border border-border text-xs font-medium text-text-muted hover:text-white hover:border-border-hover"
                  onClick={() => setMobileOpen(false)}
                >
                  <ToolIcon tool={tool} colored className="w-3.5 h-3.5" />
                  <span className="truncate">{tool.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Quick Links */}
          <div className="pt-2 border-t border-border space-y-1">
            <Link
              to="/changelog"
              className="flex items-center gap-2 py-1.5 text-xs font-medium text-text-muted hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <History className="w-3.5 h-3.5" />
              <span>Changelog & Update</span>
            </Link>
            <a
              href="https://github.com/itsmegaaa/pdfLan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-1.5 text-xs font-medium text-text-muted hover:text-white"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>

        </div>
      )}
    </nav>
  );
}

