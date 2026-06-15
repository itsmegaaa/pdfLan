import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TOOLS, CATEGORIES } from '../constants/tools';

export default function Footer() {
  const grouped = CATEGORIES.filter((c) => c.id !== 'all').map((cat) => ({
    ...cat,
    tools: TOOLS.filter((t) => t.category === cat.id),
  }));

  return (
    <footer className="bg-[#12141e] border-t border-[#2d3150] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-[#e2001a] rounded-lg flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white">iLovePDF<span className="text-[#e2001a]">Clone</span></span>
            </div>
            <p className="text-sm text-[#8b90b0] leading-relaxed mb-4">
              Tool PDF gratis & open source. Semua proses langsung di browser atau server lokal kamu — tidak ada data yang dikirim ke cloud.
            </p>
            <p className="text-xs text-[#4a5070]">© 2026 iLovePDF Clone. Open Source.</p>
          </div>

          {/* Tool links per category */}
          {grouped.slice(0, 4).map((cat) => (
            <div key={cat.id}>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">{cat.label}</h4>
              <ul className="space-y-2">
                {cat.tools.slice(0, 5).map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={tool.route}
                      className="text-xs text-[#8b90b0] hover:text-white transition-colors"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
