import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, LayoutGrid, List, Star, X } from 'lucide-react';
import ToolCard from '../components/ToolCard';
import { TOOLS, CATEGORIES } from '../constants/tools';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('cat') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // â”€â”€ View Mode: 'grid' | 'list' â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('pdfvault_view_mode') || 'grid';
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('pdfvault_view_mode', mode);
  };

  // â”€â”€ Favorites â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pdfvault_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('pdfvault_favorites', JSON.stringify(updated));
  };

  const favoriteTools = useMemo(() => {
    return TOOLS.filter((t) => favorites.includes(t.id));
  }, [favorites]);

  // â”€â”€ Keyboard shortcuts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is already typing in an input or textarea
      const targetTag = e.target.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        if (e.key === 'Escape') {
          setSearchQuery('');
          searchInputRef.current?.blur();
        }
        return;
      }

      // '/' to focus search
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      {/* Header / Search */}
      <section className="bg-[#0e1017] border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 text-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium bg-surface border border-border text-text-muted mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>100% Offline Â· Lokal & Privat Â· Bebas Kuota</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main mb-2 tracking-tight">
            PDF & Office Tools <span className="text-[#e2001a]">Lokal</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto mb-6 leading-relaxed">
            Kelola, konversi, dan edit dokumen kerja dengan aman langsung di browser & server LAN.
          </p>

          {/* Search with keyboard shortcut hint */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari tool (tekan / untuk cari)â€¦"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-16 py-2.5 bg-surface border border-border rounded-md text-text-main placeholder-[#8b90b0]
                focus:outline-none focus:border-[#383e58] focus:bg-[#181c2b] text-xs sm:text-sm"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-main"
                title="Hapus pencarian (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-[#1c2030] border border-border rounded pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>
      </section>

      {/* Tools section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Category filter tabs & View Switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          
          {/* Categories */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                id={`filter-tab-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${activeCategory === cat.id
                    ? 'bg-white text-black font-semibold'
                    : 'bg-surface border border-border text-text-muted hover:text-text-main hover:border-[#383e58]'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right controls: View mode switcher & Tool Count */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-mono text-text-muted">{filtered.length} tools</span>

            {/* Grid / List Switcher */}
            <div className="inline-flex p-0.5 rounded-md bg-surface border border-border">
              <button
                onClick={() => handleSetViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#1c2030] text-text-main'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title="Grid View (â–¦)"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleSetViewMode('list')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#1c2030] text-text-main'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title="Compact List View (â˜°)"
                aria-label="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* â”€â”€ Favorite Section (When no active search and 'all' category) â”€â”€ */}
        {!searchQuery && activeCategory === 'all' && favoriteTools.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <h2 className="text-xs font-semibold text-text-main uppercase tracking-wider">Favorit & Cepat</h2>
            </div>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
              : 'space-y-1.5'
            }>
              {favoriteTools.map((tool) => (
                <ToolCard
                  key={`fav-${tool.id}`}
                  tool={tool}
                  viewMode={viewMode}
                  isFavorite={true}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
            <div className="border-b border-border my-6" />
          </div>
        )}

        {/* â”€â”€ All / Filtered Tools â”€â”€ */}
        {filtered.length > 0 ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
            : 'space-y-1.5'
          }>
            {filtered.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                viewMode={viewMode}
                isFavorite={favorites.includes(tool.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-lg bg-surface/40">
            <Search className="w-8 h-8 mx-auto text-[#4a5070] mb-3" />
            <p className="text-text-main text-sm font-medium mb-1">Tidak ada tool yang cocok</p>
            <p className="text-text-muted text-xs">Coba kata kunci atau kategori yang berbeda</p>
          </div>
        )}
      </section>
    </>
  );
}

