import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
import { formatFileSize } from '../utils/fileHelpers';

/**
 * @param {Object} props
 * @param {function} props.onFiles - callback(File[])
 * @param {Object} [props.accept] - react-dropzone accept object
 * @param {boolean} [props.multiple]
 * @param {number} [props.maxSizeMB]
 * @param {File[]} [props.files]
 * @param {function} [props.onRemove] - callback(index)
 */
export default function DropZone({
  onFiles,
  accept,
  multiple = false,
  maxSizeMB = 50,
  files = [],
  onRemove,
}) {
  const maxSize = maxSizeMB * 1024 * 1024;

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: (accepted) => onFiles(accepted),
    accept,
    multiple,
    maxSize,
  });

  return (
    <div className="w-full">
      {/* Drop area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-[#e2001a] bg-red-900/10 scale-[1.01]'
            : 'border-[#2d3150] bg-[#1a1d27] hover:border-[#e2001a]/60 hover:bg-[#1e2235]'
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            ${isDragActive ? 'bg-[#e2001a]/20' : 'bg-[#22263a]'}
            transition-colors
          `}>
            <Upload className={`w-7 h-7 ${isDragActive ? 'text-[#e2001a]' : 'text-[#8b90b0]'}`} />
          </div>

          <div>
            <p className="text-base font-semibold text-white mb-1">
              {isDragActive ? 'Lepas file di sini…' : 'Klik atau drag file ke sini'}
            </p>
            <p className="text-sm text-[#8b90b0]">
              Ukuran maksimal {maxSizeMB}MB
              {multiple ? ' · Bisa pilih beberapa file' : ''}
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2 bg-[#e2001a] hover:bg-[#b8001a] text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/30"
          >
            Pilih File
          </button>
        </div>
      </div>

      {/* Error messages */}
      {fileRejections.length > 0 && (
        <div className="mt-3 space-y-1">
          {fileRejections.map(({ file, errors }) => (
            <p key={file.name} className="text-sm text-red-400">
              {file.name}: {errors.map((e) => {
                if (e.code === 'file-too-large') return `Ukuran melebihi ${maxSizeMB}MB`;
                if (e.code === 'file-invalid-type') return 'Tipe file tidak didukung';
                return e.message;
              }).join(', ')}
            </p>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 bg-[#1a1d27] border border-[#2d3150] rounded-xl px-4 py-3"
            >
              <div className="w-8 h-8 bg-[#22263a] rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#e2001a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-[#8b90b0]">{formatFileSize(file.size)}</p>
              </div>
              {onRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(file.id || idx); }}
                  className="text-[#8b90b0] hover:text-red-400 transition-colors p-1"
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
