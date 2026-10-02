import { useEffect, useState } from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import PdfThumbnail from './PdfThumbnail';

function extOf(name) {
  return '.' + (String(name).split('.').pop() || '').toLowerCase();
}

const SHEET_EXTS = ['.xls', '.xlsx', '.csv', '.ods'];

/**
 * Thumbnail kecil untuk satu file di daftar file.
 * - PDF → render halaman pertama via PdfThumbnail (gagal → ikon)
 * - Gambar → <img> dari object URL
 * - Spreadsheet → ikon khusus, sisanya ikon dokumen
 */
export default function FileThumb({ file, className = 'w-10 h-12' }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const type = file?.type || '';
  const ext = extOf(file?.name);
  const isPdf = type === 'application/pdf' || ext === '.pdf';
  const isImage = type.startsWith('image/');
  const isSheet = SHEET_EXTS.includes(ext);

  /* eslint-disable react-hooks/set-state-in-effect -- sinkronisasi dengan external system (object URL) */
  useEffect(() => {
    if (!isImage || !file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  useEffect(() => {
    setPdfFailed(false);
    setImgFailed(false);
  }, [file]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div
      className={`${className} rounded overflow-hidden bg-surface border border-border flex-shrink-0 flex items-center justify-center`}
    >
      {isPdf && !pdfFailed ? (
        <PdfThumbnail
          file={file}
          pageNumber={1}
          scale={0.25}
          className="w-full h-full [&_canvas]:w-full [&_canvas]:h-full [&_canvas]:object-cover [&_canvas]:rounded-none"
          onError={() => setPdfFailed(true)}
        />
      ) : isImage && imgUrl && !imgFailed ? (
        <img src={imgUrl} alt={file.name} className="w-full h-full object-cover" loading="lazy" onError={() => setImgFailed(true)} />
      ) : isSheet ? (
        <FileSpreadsheet className="w-4 h-4 text-green-400" />
      ) : (
        <FileText className="w-4 h-4 text-primary" />
      )}
    </div>
  );
}
