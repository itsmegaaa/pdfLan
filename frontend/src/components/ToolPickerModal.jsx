import { useEffect } from 'react';
import { X, FileText, FileImage, File as FileIcon, MousePointerClick } from 'lucide-react';
import { ToolIconBadge } from './ToolIcon';
import { formatFileSize } from '../utils/fileHelpers';
import { toolsForFiles } from '../utils/matchTools';

function chipIcon(file) {
  const type = file.type || '';
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext))
    return FileImage;
  if (type === 'application/pdf' || ext === '.pdf') return FileText;
  return FileIcon;
}

/**
 * Modal "mau diapain file ini?" — muncul setelah drop file di Home.
 * Hanya menampilkan tool yang cocok dengan tipe file.
 */
export default function ToolPickerModal({ files, onPick, onClose }) {
  const matched = toolsForFiles(files || []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!files?.length) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-border rounded-lg p-6 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="flex items-center gap-2 text-base font-bold text-text-main">
              <MousePointerClick className="w-4 h-4 text-primary" />
              Mau diapain file ini?
            </p>
            <p className="text-xs text-text-muted mt-1">
              {files.length} file · pilih tool di bawah, file langsung kebawa
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-md text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {files.map((f, i) => {
            const FIcon = chipIcon(f);
            return (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg border border-border rounded-md text-xs text-text-main max-w-full"
              >
                <FIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate max-w-[180px]">{f.name}</span>
                <span className="text-text-muted flex-shrink-0">{formatFileSize(f.size)}</span>
              </span>
            );
          })}
        </div>

        {/* Tool grid */}
        {matched.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {matched.map((t) => (
              <button
                key={t.id}
                onClick={() => onPick(t)}
                className="group flex flex-col items-start gap-2 p-3 bg-bg border border-border hover:border-border-hover hover:bg-surface-hover rounded-md text-left transition-colors"
              >
                <ToolIconBadge tool={t} size="sm" />
                <span>
                  <span className="block text-xs font-semibold text-text-main">
                    {t.name}
                  </span>
                  <span className="block text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">
                    {t.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-semibold text-text-main mb-1">Tidak ada tool yang cocok</p>
            <p className="text-xs text-text-muted mb-4">
              Tipe file ini belum didukung tool mana pun.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-main text-xs font-semibold rounded-md transition-colors"
            >
              Pilih manual dari daftar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
