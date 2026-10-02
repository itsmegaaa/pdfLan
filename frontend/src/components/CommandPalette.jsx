import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { TOOLS, CATEGORIES } from '../constants/tools';
import { ToolIconBadge } from "./ToolIcon";

const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

/**
 * Command palette global (Ctrl/Cmd+K): loncat ke tool apa aja dari mana aja.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Kunci scroll body saat palette terbuka
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = TOOLS.filter((t) => !t.maintenance);
    if (!q) return list.slice(0, 8);
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        catLabel(t.category).toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  const go = (tool) => {
    setOpen(false);
    setQuery('');
    setSel(0);
    navigate(tool.route);
  };

  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[sel]) {
      go(results[sel]);
    }
  };

  const onQuery = (e) => {
    setQuery(e.target.value);
    setSel(0);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pilih tool"
        className="w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-listbox"
            aria-activedescendant={results.length ? `cmd-opt-${sel}` : undefined}
            value={query}
            onChange={onQuery}
            placeholder="Ketik nama tool… (Esc untuk tutup)"
            className="flex-1 bg-transparent text-text-main placeholder-text-muted text-sm focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 bg-bg border border-border rounded text-[10px] text-text-muted">Esc</kbd>
        </div>
        <ul id="cmd-listbox" role="listbox" aria-label="Hasil pencarian tool" className="max-h-80 overflow-y-auto py-2">
          {results.map((t, i) => (
            <li key={t.id}>
              <button
                id={`cmd-opt-${i}`}
                role="option"
                aria-selected={i === sel}
                onClick={() => go(t)}
                onMouseEnter={() => setSel(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === sel ? 'bg-surface-hover' : ''
                }`}
              >
                <ToolIconBadge tool={t} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-text-main truncate">{t.name}</span>
                  <span className="block text-xs text-text-muted truncate">{catLabel(t.category)}</span>
                </span>
                {i === sel && <CornerDownLeft className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-text-muted">
              Tidak ada tool yang cocok.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
