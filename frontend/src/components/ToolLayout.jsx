import { CheckCircle, Download, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import DropZone from './DropZone';
import ProgressBar from './ProgressBar';
import useToolStore from '../store/useToolStore';
import { downloadBlob } from '../utils/fileHelpers';

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
 */
export default function ToolLayout({
  title,
  description,
  accept,
  multiple = false,
  onProcess,
  actionLabel = 'Proses',
  options,
  showFileList = true,
  children,
}) {
  const { files, isProcessing, progress, statusMessage, statusDetail, result, error, setFiles, removeFile, reset } = useToolStore();

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

  // ── Result screen ────────────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-once">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Selesai! 🎉</h2>
        <p className="text-sm text-[#8b90b0] mb-6">File Anda telah berhasil diproses dan siap diunduh.</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#e2001a] hover:bg-[#b8001a] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/30"
          >
            <Download className="w-4 h-4" />
            Unduh {result.filename || 'File'}
          </button>
          <button
            onClick={reset}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#22263a] hover:bg-[#2d3150] text-white font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Proses Ulang / Bersihkan
          </button>
        </div>

        {/* Next file quick dropzone */}
        <div className="mt-8 pt-6 border-t border-[#2d3150]/60 text-left">
          <p className="text-xs font-semibold text-[#8b90b0] uppercase tracking-wider mb-3 text-center">
            Atau Drop / Masukkan File PDF Berikutnya:
          </p>
          <DropZone
            onFiles={(newFiles) => {
              newFiles.forEach(f => {
                if (!f.id) f.id = Math.random().toString(36).substring(2, 9);
              });
              setFiles(multiple ? newFiles : newFiles);
            }}
            accept={accept}
            multiple={multiple}
            files={[]}
            onRemove={removeFile}
          />
        </div>
      </div>
    );
  }

  // ── Processing screen ────────────────────────────────────────────
  if (isProcessing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 border-4 border-[#e2001a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">{statusMessage || 'Sedang memproses…'}</p>
            <p className="text-sm text-[#8b90b0] mt-1">{statusDetail || 'Harap tunggu sebentar, dokumen sedang diolah'}</p>
          </div>
          <ProgressBar progress={progress} label={statusMessage || 'Memproses…'} />
        </div>
      </div>
    );
  }

  // ── Upload screen ────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#8b90b0] hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Semua Tools
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-[#8b90b0]">{description}</p>
      </div>

      {/* DropZone */}
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

      {/* Custom children (e.g., custom file lists) */}
      {children}

      {/* Options slot */}
      {files.length > 0 && options && (
        <div className="mt-6 p-5 bg-[#1a1d27] border border-[#2d3150] rounded-2xl">
          {options}
        </div>
      )}



      {/* Action button */}
      {files.length > 0 && (
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="mt-6 w-full py-3.5 bg-[#e2001a] hover:bg-[#b8001a] disabled:opacity-50 disabled:cursor-not-allowed
            text-white font-semibold text-base rounded-xl transition-colors shadow-lg shadow-red-900/30"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
