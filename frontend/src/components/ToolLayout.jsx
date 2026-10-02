import { CheckCircle, Download, RefreshCw, AlertCircle, ChevronLeft, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Search, Eye, Home as HomeIcon, FileText, Trash2, Copy, Check } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';
import DropZone from './DropZone';
import ProgressBar from './ProgressBar';
import useToolStore from '../store/useToolStore';
import { downloadBlob, formatFileSize } from '../utils/fileHelpers';
import { TOOLS } from '../constants/tools';

/**
 * Shared layout used by ALL tool pages.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {Object} [props.accept] - react-dropzone accept object
 * @param {boolean} [props.multiple]
 * @param {function} props.onProcess - async fn called with files when user clicks action button
 * @param {string} [props.actionLabel] - button label, default 'Proses'
 * @param {React.ReactNode} [props.options] - extra UI between file list and action button
 * @param {boolean} [props.showFileList] - whether to show the default file list (default true)
 * @param {boolean} [props.hideDropZone] - whether to hide the dropzone (default false)
 */
export default function ToolLayout({
  title,
  description,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = false,
  onProcess,
  actionLabel = 'Proses File',
  options = null,
  showFileList = true,
  hideDropZone = false,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { files, isProcessing, progress, statusMessage, statusDetail, result, error, setFiles, removeFile, reset } = useToolStore();

  const [showAllChains, setShowAllChains] = useState(false);
  const [chainCategory, setChainCategory] = useState('all');
  const [chainSearch, setChainSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (!files.length) return;
    await onProcess(files);
  };

  const handleDownload = () => {
    if (!result) return;
    if (result.blob) {
      downloadBlob(result.blob, result.filename);
    } else if (result.url) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename || 'hasil.pdf';
      a.click();
    }
  };

  const handlePreview = () => {
    if (!result) return;
    if (result.blob) {
      const url = URL.createObjectURL(result.blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else if (result.url) {
      window.open(result.url, '_blank');
    }
  };

  const isPdfResult = result?.filename
    ? result.filename.toLowerCase().endsWith('.pdf')
    : true;

  const isImageResult = result?.filename
    ? /\.(jpe?g|png|webp)$/i.test(result.filename)
    : false;

  // Filter tools that can accept this result format
  const compatibleTools = useMemo(() => {
    if (!result) return [];
    return TOOLS.filter((tool) => {
      if (tool.route === location.pathname) return false;
      if (tool.maintenance) return false;

      if (isPdfResult) {
        return tool.accept && tool.accept['application/pdf'];
      }
      if (isImageResult) {
        return (
          tool.accept &&
          (tool.accept['image/*'] ||
            tool.accept['image/jpeg'] ||
            tool.accept['image/png'])
        );
      }
      return false;
    });
  }, [result, isPdfResult, isImageResult, location.pathname]);

  const topPdfRoutes = [
    '/compress-pdf',
    '/sign-pdf',
    '/protect-pdf',
    '/pdf-to-word',
    '/organize-pdf',
    '/watermark-pdf',
  ];

  const topQuickTools = useMemo(() => {
    if (isPdfResult) {
      const found = TOOLS.filter(
        (t) => topPdfRoutes.includes(t.route) && t.route !== location.pathname && !t.maintenance
      );
      return found.slice(0, 6);
    }
    return compatibleTools.slice(0, 4);
  }, [isPdfResult, compatibleTools, location.pathname]);

  const filteredChainTools = useMemo(() => {
    return compatibleTools.filter((t) => {
      const matchCat = chainCategory === 'all' || t.category === chainCategory;
      const matchSearch =
        !chainSearch ||
        t.name.toLowerCase().includes(chainSearch.toLowerCase()) ||
        t.desc.toLowerCase().includes(chainSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [compatibleTools, chainCategory, chainSearch]);

  const handleChainTool = async (route) => {
    try {
      let fileToChain;
      const defaultMime = isImageResult
        ? (result.filename?.endsWith('.png') ? 'image/png' : 'image/jpeg')
        : 'application/pdf';

      if (result?.blob) {
        fileToChain = new File([result.blob], result.filename || (isImageResult ? 'gambar.png' : 'dokumen.pdf'), {
          type: result.blob.type || defaultMime,
        });
      } else if (result?.url) {
        const res = await fetch(result.url);
        const blob = await res.blob();
        fileToChain = new File([blob], result.filename || (isImageResult ? 'gambar.png' : 'dokumen.pdf'), {
          type: blob.type || defaultMime,
        });
      }
      if (fileToChain) {
        fileToChain.id = Math.random().toString(36).substring(2, 9);
        navigate(route, { state: { chainFile: fileToChain } });
      }
    } catch (err) {
      console.error('Failed to chain tool:', err);
    }
  };

  // â”€â”€ Result screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (result) {
    const fileSizeStr = result.blob?.size ? formatFileSize(result.blob.size) : null;

    const handleCopy = () => {
      navigator.clipboard.writeText(result.filename || 'dokumen.pdf');
      setCopied(true);
      if (window._copyTimeout) clearTimeout(window._copyTimeout);
      window._copyTimeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    const getSuccessTitle = () => {
      const lower = (title || '').toLowerCase();
      if (lower.includes('merge')) return 'PDF berhasil digabungkan!';
      if (lower.includes('split')) return 'PDF berhasil dipisahkan!';
      if (lower.includes('compress')) return 'PDF berhasil dikompresi!';
      if (lower.includes('protect')) return 'PDF berhasil dikunci dengan password!';
      if (lower.includes('unlock')) return 'Password PDF berhasil dihapus!';
      if (lower.includes('organize')) return 'Halaman PDF berhasil diatur!';
      if (lower.includes('rotate')) return 'PDF berhasil diputar!';
      if (lower.includes('watermark')) return 'Watermark berhasil ditambahkan!';
      if (lower.includes('page number')) return 'Nomor halaman berhasil ditambahkan!';
      return `${title || 'Dokumen'} telah selesai diproses!`;
    };

    const getIconMapping = (id) => {
      switch (id) {
        case 'compress-pdf': return { Icon: RefreshCw, color: 'bg-emerald-500' };
        case 'split-pdf': return { Icon: CheckCircle, color: 'bg-orange-500' };
        case 'page-numbers': return { Icon: FileText, color: 'bg-purple-500' };
        case 'watermark-pdf': return { Icon: AlertCircle, color: 'bg-rose-600' };
        case 'rotate-pdf': return { Icon: RefreshCw, color: 'bg-indigo-600' };
        case 'protect-pdf': return { Icon: CheckCircle, color: 'bg-blue-500' };
        default: return { Icon: FileText, color: 'bg-slate-500' };
      }
    };

    return (
      <div className="w-full rounded-lg py-12 px-4 sm:px-8 text-center flex flex-col items-center mt-4">
        
        {/* Title */}
        <h1 className="text-3xl sm:text-[32px] font-bold text-text-main mb-8 tracking-tight">
          {getSuccessTitle()}
        </h1>

        {/* â”€â”€ Main Action Row (Back, Big Download Button, Action Cluster) â”€â”€ */}
        <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
          
          <button
            onClick={reset}
            title="Kembali / Proses Dokumen Baru"
            className="w-[52px] h-[52px] rounded-full bg-[#1a1d2d] border border-[#2a2f4c] text-[#a1a5b8] hover:text-text-main hover:border-[#3d4468] hover:bg-surface-hover flex items-center justify-center transition-colors shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 px-10 h-[52px] bg-primary hover:bg-[#cc0017] text-text-main font-bold text-lg rounded-md transition-all shadow-md active:scale-[0.98]"
          >
            <Download className="w-6 h-6" />
            <span>Unduh PDF</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              title="Pratinjau"
              className="w-[52px] h-[52px] rounded-full bg-[#1a1d2d] border border-[#2a2f4c] text-[#a1a5b8] hover:text-text-main hover:border-[#3d4468] hover:bg-surface-hover flex items-center justify-center transition-colors shadow-sm"
            >
              <Eye className="w-6 h-6" />
            </button>
            <button
              onClick={handleCopy}
              title="Salin Tautan / Nama"
              className="w-[52px] h-[52px] rounded-full bg-[#1a1d2d] border border-[#2a2f4c] text-[#a1a5b8] hover:text-text-main hover:border-[#3d4468] hover:bg-surface-hover flex items-center justify-center transition-colors shadow-sm"
            >
              {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6" />}
            </button>
            <button
              onClick={reset}
              title="Hapus"
              className="w-[52px] h-[52px] rounded-full bg-[#1a1d2d] border border-[#2a2f4c] text-[#a1a5b8] hover:text-red-400 hover:border-red-900/50 hover:bg-red-900/20 flex items-center justify-center transition-colors shadow-sm"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>

        </div>

        {fileSizeStr && (
          <p className="text-sm text-text-muted font-medium -mt-4 mb-12">
            Ukuran file: <span className="text-text-main">{fileSizeStr}</span>
          </p>
        )}

        {/* â”€â”€ "Continue to..." Card matching image structure but dark themed â”€â”€ */}
        {compatibleTools.length > 0 && (
          <div className="w-full max-w-[800px] mx-auto bg-surface rounded-md p-6 sm:p-8 text-left shadow-xl border border-border mb-8">
            <h3 className="text-lg font-bold text-text-main mb-6">
              Continue to...
            </h3>

            {/* 3 Columns Grid of Tool Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {topQuickTools.map((t) => {
                const { Icon, color } = getIconMapping(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => handleChainTool(t.route)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-[#1a1d2d] transition-colors group text-left border border-transparent hover:border-[#2a2f4c]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-1">
                      <div className="w-12 h-12 bg-[#1c2033] rounded-md shadow-sm border border-[#2a2f4c] flex items-center justify-center shrink-0 group-hover:border-[#3d4468] transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-text-main ${color} shadow-sm`}>
                          <span className="text-sm">{t.icon}</span>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-text-main/90 group-hover:text-text-main transition-colors truncate">
                        {t.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4a5070] group-hover:text-text-main shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>

            {/* See more link at bottom right */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAllChains(!showAllChains)}
                className="text-[13px] font-bold text-text-muted hover:text-text-main underline underline-offset-4 decoration-2 decoration-[#232738] hover:decoration-white transition-all"
              >
                {showAllChains ? 'Hide' : 'See more'}
              </button>
            </div>

            {/* Expanded Full Tool Directory when "See more" is clicked */}
            {showAllChains && (
              <div className="mt-6 pt-5 border-t border-border animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex items-center gap-3 flex-wrap mb-5">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search tools..."
                      value={chainSearch}
                      onChange={(e) => setChainSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-bg border border-border rounded-lg text-text-main placeholder-[#8b90b0] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'organize', label: 'Organize' },
                      { id: 'optimize', label: 'Optimize' },
                      { id: 'convert', label: 'Convert' },
                      { id: 'edit', label: 'Edit' },
                      { id: 'security', label: 'Security' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setChainCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          chainCategory === cat.id
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-[#1a1d2d] text-text-muted hover:bg-surface-hover hover:text-text-main'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredChainTools.map((t) => (
                    <button
                      key={`chain-${t.id}`}
                      onClick={() => handleChainTool(t.route)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#1a1d2d] border border-transparent hover:border-[#2a2f4c] transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-1">
                        <div className="w-8 h-8 rounded-md bg-[#1c2033] border border-[#2a2f4c] flex items-center justify-center shrink-0">
                          <span className="text-sm">{t.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[13px] text-text-main/90 truncate group-hover:text-text-main">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-text-muted truncate mt-0.5">{t.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#4a5070] group-hover:text-text-main shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    );
  }


  // â”€â”€ Processing screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isProcessing) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-10 h-10 border-2 border-[#e2001a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-text-main font-semibold text-base">{statusMessage || 'Sedang memprosesâ€¦'}</p>
            <p className="text-xs text-text-muted mt-1">{statusDetail || 'Harap tunggu, dokumen sedang diproses secara lokal'}</p>
          </div>
          <ProgressBar progress={progress} label={statusMessage || 'Memprosesâ€¦'} />
        </div>
      </div>
    );
  }

  // â”€â”€ Upload screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main mb-6 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Kembali ke Semua Tools
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-text-main mb-1 tracking-tight">{title}</h1>
        <p className="text-xs text-text-muted">{description}</p>
      </div>

      {/* DropZone */}
      {!hideDropZone && (
        <DropZone
          onFiles={(newFiles) => {
            newFiles.forEach(f => {
              if (!f.id) f.id = Math.random().toString(36).substring(2, 9);
            });
            setFiles(multiple ? [...files, ...newFiles] : newFiles);
          }}
          accept={accept}
          multiple={multiple}
          files={showFileList ? files : []}
          onRemove={removeFile}
        />
      )}

      {/* Custom children (e.g., custom file lists) */}
      {children}

      {/* Options slot */}
      {files.length > 0 && options && (
        <div className="mt-5 p-4 bg-surface border border-border rounded-lg">
          {options}
        </div>
      )}

      {/* Action button */}
      {files.length > 0 && (
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="mt-5 w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed
            text-text-main font-semibold text-xs rounded-md transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

