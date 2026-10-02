import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

/**
 * Overlay fullscreen saat user drag file ke mana aja di halaman.
 * @param {string} [props.subtitle] - teks kecil di bawah judul
 */
export default function GlobalDropOverlay({ onFiles, disabled, subtitle }) {
  const [active, setActive] = useState(false);
  const counter = useRef(0);
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    if (disabled) return;
    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');

    const onDragEnter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      counter.current += 1;
      setActive(true);
    };
    const onDragLeave = (e) => {
      if (!hasFiles(e)) return;
      counter.current -= 1;
      if (counter.current <= 0) {
        counter.current = 0;
        setActive(false);
      }
    };
    const onDragOver = (e) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDrop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      counter.current = 0;
      setActive(false);
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length) onFilesRef.current(files);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [disabled]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6 pointer-events-none">
      <div className="w-full max-w-2xl border-2 border-dashed border-primary rounded-lg bg-primary/5 p-12 sm:p-16 text-center">
        <UploadCloud className="w-10 h-10 text-primary mx-auto mb-4" />
        <p className="text-lg font-bold text-text-main">Lepas file di sini</p>
        <p className="text-xs text-text-muted mt-1">{subtitle || 'File langsung masuk ke tool ini'}</p>
      </div>
    </div>
  );
}
