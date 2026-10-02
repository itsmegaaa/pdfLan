import { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { formatFileSize, validateFiles } from '../utils/fileHelpers';
import FileThumb from './FileThumb';

/**
 * @param {Object} props
 * @param {function} props.onFiles - callback(File[])
 * @param {Object} [props.accept] - object mapped to extensions string e.g. {'application/pdf': ['.pdf']}
 * @param {boolean} [props.multiple]
 * @param {number} [props.maxSizeMB]
 * @param {File[]} [props.files]
 * @param {function} [props.onRemove] - callback(index)
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

  let containerClass = "relative flex flex-col items-center justify-center border rounded-md p-4 text-center cursor-pointer transition-colors duration-150 ";
  if (variant === 'compact') containerClass += "min-h-[120px] ";
  else containerClass += "min-h-[200px] ";

  let iconClass = "flex items-center justify-center rounded-md border transition-colors ";
  if (variant === 'compact') iconClass += "w-8 h-8 mb-2 ";
  else iconClass += "w-10 h-10 mb-3 ";

  if (isError) {
    containerClass += "border-red-500 border-solid bg-red-500/10 ";
    iconClass += "border-red-500/50 bg-red-500/20 text-red-500 ";
  } else if (isDragActive) {
    containerClass += "border-primary border-solid bg-primary/10 text-primary ";
    iconClass += "border-primary bg-primary/20 text-primary ";
  } else {
    containerClass += "border-border border-dashed bg-surface hover:border-border-hover hover:bg-surface-hover text-text-main ";
    iconClass += "border-border bg-bg text-text-muted ";
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
      >
        <input 
          type="file" 
          ref={inputRef}
          onChange={onInputChange}
          accept={acceptAttr}
          multiple={multiple}
          className="hidden" 
        />

        <div className={iconClass}>
          {isError ? <AlertCircle className={variant === 'compact' ? "w-4 h-4" : "w-5 h-5"} /> : <Upload className={variant === 'compact' ? "w-4 h-4" : "w-5 h-5"} />}
        </div>

        <p className={`font-semibold mb-1 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
          {isDragActive 
            ? 'Lepas file di sini' 
            : isError 
              ? 'File tidak didukung' 
              : 'Pilih atau seret dokumen ke sini'
          }
        </p>
        
        <p className={`text-text-muted ${variant === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
          Maksimal {maxSizeMB}MB per file
          {multiple && ' • Mendukung multi-file'}
        </p>

        {!isDragActive && !isError && variant !== 'compact' && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="mt-4 px-4 py-1.5 bg-bg border border-border hover:border-border-hover text-text-main text-xs font-semibold rounded-md transition-colors"
          >
            Pilih File
          </button>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-3 space-y-1 bg-red-500/10 border border-red-500/20 rounded-md p-3">
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
        <ul className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 bg-bg border border-border rounded-md px-3 py-2.5 hover:border-border-hover transition-colors"
            >
              <FileThumb file={file} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-main truncate">{file.name}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{formatFileSize(file.size)}</p>
              </div>
              {onRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(file.id || idx); }}
                  className="text-text-muted hover:bg-surface hover:text-red-400 rounded-md p-1.5 transition-colors"
                  aria-label="Hapus file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
