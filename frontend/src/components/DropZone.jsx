import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Plus } from 'lucide-react';
import { formatFileSize, validateFiles } from '../utils/fileHelpers';
import FileThumb from './FileThumb';

/**
 * Area upload ala iLovePDF (versi dark).
 *
 * - Belum ada file → invisible drop area: tombol CTA merah besar +
 *   teks "atau seret file ke sini" (tanpa kotak dashed).
 * - Sudah ada file → CTA hilang total; file tampil sebagai kartu
 *   thumbnail besar + tile "+" untuk nambah file (khusus multi-file).
 * - Seluruh area selalu jadi drop target (highlight merah saat drag-over)
 *   dan bisa diakses keyboard (Enter/Space).
 *
 * @param {Object} props
 * @param {function} props.onFiles - callback(File[])
 * @param {Object} [props.accept]
 * @param {boolean} [props.multiple]
 * @param {number} [props.maxSizeMB]
 * @param {File[]} [props.files]
 * @param {function} [props.onRemove] - callback(fileId)
 * @param {boolean} [props.hideList] - sembunyikan grid file (untuk halaman dengan list custom)
 * @param {'default' | 'compact'} [props.variant='default']
 */
export default function DropZone({
  onFiles,
  accept,
  multiple = false,
  maxSizeMB = 50,
  files = [],
  onRemove,
  hideList = false,
  variant = 'default',
}) {
  const inputRef = useRef(null);

  const [isDragActive, setIsDragActive] = useState(false);
  const [fileRejections, setFileRejections] = useState([]);

  const acceptAttr = accept ? Object.values(accept).flat().join(',') : '';
  const isCompact = variant === 'compact';

  // CTA tampil hanya saat belum ada file — kecuali varian compact
  // (dipakai eksplisit oleh halaman dengan UI custom sebagai bar "tambah file").
  const showCta = files.length === 0 || isCompact;
  const showGrid = files.length > 0 && !hideList;

  const processFiles = (rawFiles) => {
    const { accepted, rejections } = validateFiles(rawFiles, accept, maxSizeMB, multiple);
    setFileRejections(rejections);
    if (accepted.length > 0) onFiles(accepted);
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const onClick = () => {
    inputRef.current?.click();
  };

  const onInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = null;
  };

  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const dropHandlers = {
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    tabIndex: 0,
    role: 'button',
    onKeyDown,
  };

  const isError = fileRejections.length > 0;

  let ctaClass = 'relative flex flex-col items-center justify-center rounded-3xl text-center cursor-pointer transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ';
  ctaClass += isCompact ? 'min-h-[110px] py-5 px-4 ' : 'min-h-[400px] py-16 px-6 ';

  if (isError) {
    ctaClass += 'border-2 border-dashed border-red-500/60 bg-red-500/5 ';
  } else if (isDragActive) {
    ctaClass += 'border-2 border-dashed border-primary bg-primary/10 scale-[1.01] ';
  } else {
    // resting: invisible seperti iLovePDF — hanya tombol + teks di whitespace
    ctaClass += isCompact
      ? 'border-2 border-dashed border-transparent hover:border-border bg-surface/40 '
      : 'border-2 border-dashed border-transparent bg-transparent ';
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={inputRef}
        onChange={onInputChange}
        accept={acceptAttr}
        multiple={multiple}
        className="hidden"
      />

      {showCta && (
        <div
          className={ctaClass}
          onClick={onClick}
          aria-label="Unggah file — tekan Enter untuk memilih file"
          {...dropHandlers}
        >
          {isError ? (
            <AlertCircle className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} text-red-500 mb-3`} />
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={`inline-flex items-center gap-3 bg-primary hover:bg-primary-hover text-white font-semibold transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 ${
                isCompact ? 'h-12 px-8 text-sm rounded-xl' : 'h-16 px-12 text-lg rounded-2xl'
              }`}
            >
              <Upload className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} strokeWidth={2.5} />
              {isCompact ? (multiple ? 'Tambah File' : 'Ganti File') : 'Pilih File'}
            </button>
          )}

          <p className={`text-text-muted ${isCompact ? 'mt-3 text-xs' : 'mt-5 text-base'}`}>
            {isDragActive
              ? <span className="text-primary font-semibold">Lepas file di sini</span>
              : isError
                ? 'File tidak didukung'
                : 'atau seret file ke sini'}
          </p>

          {!isCompact && !isError && (
            <p className="mt-2 text-xs text-text-muted/70">
              Maksimal {maxSizeMB}MB per file
              {multiple && ' • Mendukung multi-file'}
            </p>
          )}
        </div>
      )}

      {showGrid && (
        <div
          {...dropHandlers}
          aria-label="Daftar file — seret file ke sini untuk menambah, atau tekan Enter untuk memilih file"
          className={`rounded-3xl transition-all duration-200 ${isDragActive ? 'ring-2 ring-primary bg-primary/5 p-4' : ''}`}
        >
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <li
                key={file.id || file.name}
                onClick={(e) => e.stopPropagation()}
                className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:border-border-hover hover:shadow-lg hover:shadow-black/30 transition-all"
              >
                <div className="aspect-[3/4] bg-bg">
                  <FileThumb file={file} className="w-full h-full" pdfScale={0.55} iconClassName="w-10 h-10" bare />
                </div>
                {onRemove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(file.id || idx); }}
                    aria-label={`Hapus ${file.name}`}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur-sm transition-colors md:opacity-0 md:group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="p-3 border-t border-border">
                  <p className="text-sm font-medium text-text-main truncate" title={file.name}>{file.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              </li>
            ))}
            {multiple && (
              <li>
                <button
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                  aria-label="Tambah file lagi"
                  className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <Plus className="w-8 h-8" strokeWidth={2} />
                  <span className="text-sm font-medium">Tambah</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mt-4 space-y-1 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          {fileRejections.map(({ file, errors }) => (
            <p key={file.name} className="text-xs font-medium text-red-500">
              <span className="font-bold">{file.name}:</span> {errors.map((e) => {
                if (e.code === 'file-too-large') return `Ukuran melebihi batas ${maxSizeMB}MB`;
                if (e.code === 'file-invalid-type') return 'Format file tidak didukung';
                return 'Gagal memuat file';
              }).join(', ')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
