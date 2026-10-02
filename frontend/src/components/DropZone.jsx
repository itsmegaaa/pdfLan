import { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { formatFileSize, validateFiles } from '../utils/fileHelpers';
import FileThumb from './FileThumb';

/**
 * Area upload ala iLovePDF (versi dark): tanpa kotak dashed,
 * tombol CTA merah besar + teks "atau seret file ke sini".
 * Seluruh area adalah drop target; highlight merah saat drag-over.
 * File yang sudah dipilih tampil sebagai kartu thumbnail besar.
 *
 * @param {Object} props
 * @param {function} props.onFiles - callback(File[])
 * @param {Object} [props.accept] - object mapped to extensions string e.g. {'application/pdf': ['.pdf']}
 * @param {boolean} [props.multiple]
 * @param {number} [props.maxSizeMB]
 * @param {File[]} [props.files]
 * @param {function} [props.onRemove] - callback(fileId)
 * @param {'default' | 'compact'} [props.variant='default']
 */
export default function DropZone({
  onFiles,
  accept,
  multiple = false,
  maxSizeMB = 50,
  files = [],
  onRemove,
  variant = 'default',
}) {
  const inputRef = useRef(null);

  const [isDragActive, setIsDragActive] = useState(false);
  const [fileRejections, setFileRejections] = useState([]);

  const acceptAttr = accept ? Object.values(accept).flat().join(',') : '';
  const isCompact = variant === 'compact';

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

  const isError = fileRejections.length > 0;

  let containerClass = 'relative flex flex-col items-center justify-center rounded-3xl text-center cursor-pointer transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ';
  containerClass += isCompact ? 'min-h-[110px] py-5 px-4 ' : 'min-h-[320px] py-14 px-6 ';

  if (isError) {
    containerClass += 'border-2 border-dashed border-red-500/60 bg-red-500/5 ';
  } else if (isDragActive) {
    containerClass += 'border-2 border-dashed border-primary bg-primary/10 scale-[1.01] ';
  } else {
    containerClass += 'border-2 border-dashed border-transparent hover:border-border bg-surface/40 ';
  }

  return (
    <div className="w-full">
      <div
        className={containerClass}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label="Unggah file — tekan Enter untuk memilih file"
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={onInputChange}
          accept={acceptAttr}
          multiple={multiple}
          className="hidden"
        />

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
            {isCompact ? 'Tambah File' : 'Pilih File'}
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

      {files.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, idx) => (
            <li
              key={file.id || file.name}
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
        </ul>
      )}
    </div>
  );
}
