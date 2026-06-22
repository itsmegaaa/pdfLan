import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ToolCard from '../components/ToolCard';
import { TOOLS, CATEGORIES } from '../constants/tools';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('cat') || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  const setActiveCategory = (cat) => {
    setSearchParams(cat === 'all' ? {} : { cat });
  };

  const filtered = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchCat = activeCategory === 'all' || tool.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#1a1d27] to-[#0f1117] border-b border-[#2d3150] overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e2001a]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#e2001a]/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e2001a]/10 border border-[#e2001a]/20 text-[#e2001a] text-xs font-semibold mb-6">
            🚀 100% Gratis · Open Source · Lokal
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
            PDF & Office Tools<br />
            <span className="text-[#e2001a]">dalam Satu Tempat</span>
          </h1>
          <p className="text-lg text-[#8b90b0] max-w-2xl mx-auto mb-8">
            Merge, split, compress, convert, edit PDF, hingga manipulasi gambar — tanpa upload ke cloud.
            Semua diproses langsung di browser atau server lokal kamu.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b90b0]" />
            <input
              type="text"
              placeholder="Cari tool PDF…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#22263a] border border-[#2d3150] rounded-xl text-white placeholder-[#8b90b0]
                focus:outline-none focus:border-[#e2001a]/50 focus:bg-[#1e2235] transition-all text-sm"
            />
          </div>
        </div>
      </section>

      {/* Tools section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category filter tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`filter-tab-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeCategory === cat.id
                  ? 'bg-[#e2001a] text-white shadow-lg shadow-red-900/30'
                  : 'bg-[#1a1d27] border border-[#2d3150] text-[#8b90b0] hover:text-white hover:border-[#e2001a]/40'
                }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-[#4a5070]">{filtered.length} tools</span>
        </div>

        {/* Tools grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-white font-semibold mb-1">Tidak ada tool yang ditemukan</p>
            <p className="text-[#8b90b0] text-sm">Coba kata kunci yang berbeda</p>
          </div>
        )}
      </section>
    </>
  );
}
