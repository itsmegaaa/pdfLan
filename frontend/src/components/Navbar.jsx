import { Link, useLocation } from 'react-router-dom';
import { FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2d3150] bg-[#1a1d27]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#e2001a] rounded-lg flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-700/50 transition-shadow">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              PDF<span className="text-[#e2001a]">Vault</span>
            </span>
          </Link>

          {/* Nav links desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/changelog"
              className="text-sm font-medium text-[#8b90b0] hover:text-white transition-colors"
            >
              Changelog
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#8b90b0] hover:text-white p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#1a1d27] border-t border-[#2d3150] px-4 py-3 space-y-1">
          <Link
            to="/changelog"
            className="block py-2 text-sm font-medium text-[#8b90b0] hover:text-white transition-colors"
            onClick={() => setOpen(false)}
          >
            Changelog
          </Link>
        </div>
      )}
    </nav>
  );
}
