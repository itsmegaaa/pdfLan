import { CheckCircle, Download, AlertCircle, ChevronLeft, ArrowLeft, ChevronRight, Search, Eye, Trash2, Copy, Check, Loader2, XCircle, FileArchive } from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import DropZone from './DropZone';
import { ToolIconBadge } from './ToolIcon';
import FileThumb from './FileThumb';
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
 * @param {boolean} [props.hideAction] - sembunyikan tombol aksi bawaan (untuk halaman custom)
 * @param {React.ReactNode} [props.options] - extra UI between file list and action button
 * @param {boolean} [props.showFileList] - whether to show the default file list (default true)
 * @param {boolean} [props.hideDropZone] - whether to hide the dropzone (default false)
 * @param {function} [props.onFilesAdded] - dipanggil dengan file baru (drop / smart drop), buat halaman custom
 * @param {boolean} [props.batch] - true = mode batch, pakai onProcessFile per file
 * @param {function} [props.onProcessFile] - async (file, { setProgress }) => { url, blob, filename }, buat mode batch
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
  onFilesAdded,
  hideAction = false,
  batch = false,
  onProcessFile,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { files, isProcessing, progress, statusMessage, statusDetail, result, error, setFiles, removeFile, reset, consumePendingFiles,
    batch: batchState, startBatch, updateBatchItem, finishBatch, cancelBatch, clearBatch, cancelProcess } = useToolStore();
  const batchCancelled = useRef(false);

  const [showAllChains, setShowAllChains] = useState(false);
  const [chainCategory, setChainCategory] = useState('all');
  const [chainSearch, setChainSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // File titipan dari smart drop di Home → masukkan seperti habis drop
  useEffect(() => {
    const pending = consumePendingFiles();
    if (pending.length) {
      const list = multiple ? pending : pending.slice(0, 1);
      setFiles(list);
      onFilesAdded?.(list);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc = batalkan proses (single maupun batch)
  useEffect(() => {
    const h = (e) => {
      if (e.key !== 'Escape') return;
      if (batchState?.isRunning) {
        batchCancelled.current = true;
        cancelBatch();
      } else if (isProcessing) {
        cancelProcess();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isProcessing, batchState, cancelProcess, cancelBatch]);

  // Proteksi: file yang mis-drop di luar DropZone tidak membuat browser navigasi pergi
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  const handleProcess = async () => {
    if (!files.length) return;
    if (batch && onProcessFile) {
      await runBatch();
      return;
    }
    await onProcess(files);
  };

  const runBatch = async () => {
    batchCancelled.current = false;
    startBatch(files);
    const items = useToolStore.getState().batch.items;
    for (const item of items) {
      if (batchCancelled.current) break;
      updateBatchItem(item.id, { status: 'processing', progress: 0 });
      try {
        const r = await onProcessFile(item.file, {
          setProgress: (p) => updateBatchItem(item.id, { progress: p }),
        });
        updateBatchItem(item.id, {
          status: 'done', progress: 100,
          resultUrl: r.url, blob: r.blob, filename: r.filename,
          originalBytes: item.file.size, compressedBytes: r.compressedBytes,
        });
      } catch (e) {
        updateBatchItem(item.id, { status: 'error', error: e?.message || 'Gagal memproses' });
      }
    }
    finishBatch();
  };

  const downloadZip = async () => {
    const done = batchState.items.filter((i) => i.status === 'done');
    if (!done.length) return;
    const zip = new JSZip();
    for (const it of done) {
      try {
        let blob = it.blob;
        if (!blob && it.resultUrl) blob = await (await fetch(it.resultUrl)).blob();
        if (blob) zip.file(it.filename || `hasil-${it.id}.pdf`, blob);
      } catch { /* skip file yang gagal diambil */ }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, 'hasil-batch.zip');
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

  const getDownloadLabel = () => {
    if (isPdfResult) return 'Unduh PDF';
    const ext = (result?.filename?.split('.').pop() || '').toLowerCase();
    if (['jpg', 'jpeg'].includes(ext)) return 'Unduh JPG';
    if (ext === 'png') return 'Unduh PNG';
    if (ext === 'webp') return 'Unduh WebP';
    if (['doc', 'docx'].includes(ext)) return 'Unduh Word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Unduh Excel';
    if (['ppt', 'pptx'].includes(ext)) return 'Unduh PowerPoint';
    if (ext) return `Unduh ${ext.toUpperCase()}`;
    return 'Unduh File';
  };

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
    } catch {
      gooeyToast.error('Gagal melanjutkan', { description: 'Gagal memuat hasil untuk alat berikutnya' });
    }
  };

  // ── Batch screen ─────────────────────────────────────────────
  if (batchState) {
    const doneCount = batchState.items.filter((i) => i.status === 'done').length;
    const errCount = batchState.items.filter((i) => i.status === 'error').length;
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main mb-6 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Kembali ke Semua Tools
        </Link>
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-text-main mb-1 tracking-tight">{title} — Batch</h1>
          <p className="text-xs text-text-muted">
            {batchState.isRunning
              ? 'Sedang memproses antrian… (Esc untuk batalkan)'
              : `${doneCount} berhasil${errCount ? `, ${errCount} gagal` : ''} dari ${batchState.items.length} file`}
          </p>
        </div>

        <ul className="space-y-2 mb-6">
          {batchState.items.map((it) => (
            <li key={it.id} className="bg-bg border border-border rounded-md px-3 py-2.5">
              <div className="flex items-center gap-3">
                <FileThumb file={it.file} className="w-10 h-12" />
                {it.status === 'processing' && <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />}
                {it.status === 'queued' && <div className="w-4 h-4 rounded-full border-2 border-border-hover flex-shrink-0" />}
                {it.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                {it.status === 'error' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-main truncate">{it.file.name}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {formatFileSize(it.file.size)}
                    {it.status === 'error' && <span className="text-red-400"> · {it.error}</span>}
                    {it.status === 'done' && it.compressedBytes > 0 && it.originalBytes > 0 && (
                      <span className="text-green-400"> · {formatFileSize(it.originalBytes)} → {formatFileSize(it.compressedBytes)}</span>
                    )}
                  </p>
                </div>
                {it.status === 'done' && (it.resultUrl || it.blob) && (
                  <button
                    onClick={() => {
                      if (it.blob) downloadBlob(it.blob, it.filename);
                      else {
                        const a = document.createElement('a');
                        a.href = it.resultUrl;
                        a.download = it.filename || 'hasil.pdf';
                        a.click();
                      }
                    }}
                    className="text-xs font-semibold text-primary hover:text-text-main border border-border hover:border-border-hover rounded-md px-3 py-1.5 transition-colors flex-shrink-0"
                  >
                    Unduh
                  </button>
                )}
              </div>
              {(it.status === 'processing' || it.status === 'queued') && it.progress > 0 && (
                <ProgressBar progress={it.progress} />
              )}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-2">
          {batchState.isRunning ? (
            <button
              onClick={() => { batchCancelled.current = true; cancelBatch(); }}
              className="flex-1 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-main text-xs font-semibold rounded-md transition-colors"
            >
              Batalkan Batch
            </button>
          ) : (
            <>
              {doneCount > 0 && (
                <button
                  onClick={downloadZip}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <FileArchive className="w-4 h-4" />
                  Unduh Semua (.zip)
                </button>
              )}
              <button
                onClick={() => { clearBatch(); reset(); }}
                className="flex-1 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-main text-xs font-semibold rounded-md transition-colors"
              >
                Batch Baru
              </button>
            </>
          )}
        </div>
      </div>
    );
  }


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
            aria-label="Kembali — proses dokumen baru"
            className="w-[52px] h-[52px] rounded-full bg-surface border border-border text-text-muted hover:text-text-main hover:border-border-hover hover:bg-surface-hover flex items-center justify-center transition-colors shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 px-10 h-[52px] bg-primary hover:bg-primary-hover text-text-main font-bold text-lg rounded-md transition-all shadow-md active:scale-[0.98]"
          >
            <Download className="w-6 h-6" />
            <span>{getDownloadLabel()}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              title="Pratinjau"
              aria-label="Pratinjau hasil"
              className="w-[52px] h-[52px] rounded-full bg-surface border border-border text-text-muted hover:text-text-main hover:border-border-hover hover:bg-surface-hover flex items-center justify-center transition-colors shadow-sm"
            >
              <Eye className="w-6 h-6" />
            </button>
            <button
              onClick={handleCopy}
              title="Salin Tautan / Nama"
              aria-label="Salin nama file"
              className="w-[52px] h-[52px] rounded-full bg-surface border border-border text-text-muted hover:text-text-main hover:border-border-hover hover:bg-surface-hover flex items-center justify-center transition-colors shadow-sm"
            >
              {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6" />}
            </button>
            <button
              onClick={reset}
              title="Hapus"
              aria-label="Hapus hasil dan mulai ulang"
              className="w-[52px] h-[52px] rounded-full bg-surface border border-border text-text-muted hover:text-red-400 hover:border-red-900/50 hover:bg-red-900/20 flex items-center justify-center transition-colors shadow-sm"
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
              Lanjutkan ke...
            </h3>

            {/* 3 Columns Grid of Tool Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {topQuickTools.map((t) => {
                return (
                  <button
                    key={t.id}
                    onClick={() => handleChainTool(t.route)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-surface-hover transition-colors group text-left border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-1">
                      <ToolIconBadge tool={t} size="lg" />
                      <span className="text-[13px] font-bold text-text-main/90 group-hover:text-text-main transition-colors truncate">
                        {t.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-main shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>

            {/* See more link at bottom right */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAllChains(!showAllChains)}
                className="text-[13px] font-bold text-text-muted hover:text-text-main underline underline-offset-4 decoration-2 decoration-border hover:decoration-white transition-all"
              >
                {showAllChains ? 'Sembunyikan' : 'Lihat semua'}
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
                      placeholder="Cari tool..."
                      value={chainSearch}
                      onChange={(e) => setChainSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'organize', label: 'Organize' },
                      { id: 'optimize', label: 'Optimasi' },
                      { id: 'convert', label: 'Konversi' },
                      { id: 'edit', label: 'Edit' },
                      { id: 'security', label: 'Keamanan' },
                      { id: 'image', label: 'Gambar' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setChainCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          chainCategory === cat.id
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-surface text-text-muted hover:bg-surface-hover hover:text-text-main'
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
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-hover border border-transparent hover:border-border transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-1">
                        <ToolIconBadge tool={t} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-[13px] text-text-main/90 truncate group-hover:text-text-main">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-text-muted truncate mt-0.5">{t.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-text-main shrink-0" />
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
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-text-main font-semibold text-base">{statusMessage || 'Sedang memproses…'}</p>
            <p className="text-xs text-text-muted mt-1">{statusDetail || 'Harap tunggu, dokumen sedang diproses secara lokal'}</p>
          </div>
          <ProgressBar progress={progress} label={statusMessage || 'Memproses…'} />
          <button
            onClick={cancelProcess}
            className="mt-6 w-full py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-main text-xs font-semibold rounded-md transition-colors"
          >
            Batalkan (Esc)
          </button>
        </div>
      </div>
    );
  }

  // ── Error screen ──
  if (error && !isProcessing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main mb-6 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Kembali ke Semua Tools
        </Link>
        <div className="bg-surface border border-red-500/30 rounded-lg p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-text-main mb-2">Gagal memproses</h1>
          <p className="text-sm text-text-muted mb-6 break-words">
            {typeof error === 'string' ? error : 'Terjadi kesalahan sistem'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md transition-colors"
            >
              Coba lagi
            </button>
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-main text-xs font-semibold rounded-md transition-colors"
            >
              Pilih file lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€ Upload screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main mb-6 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Kembali ke Semua Tools
      </Link>

      {/* Header */}
      <div className="mb-10 md:mb-12 text-center">
        <h1 className="text-3xl md:text-[42px] leading-tight font-semibold text-text-main tracking-tight">{title}</h1>
        {description && <p className="text-base md:text-lg text-text-muted mt-4 max-w-2xl mx-auto">{description}</p>}
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
          multiple={multiple || batch}
          files={files}
          hideList={!showFileList}
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
      {files.length > 0 && !hideAction && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleProcess}
            className="w-full sm:w-auto sm:min-w-[320px] h-14 px-10 bg-primary hover:bg-primary-hover
              text-white font-semibold text-base rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
          >
            {batch ? `${actionLabel} (${files.length} file)` : actionLabel}
          </button>
        </div>
      )}

    </div>
  );
}

