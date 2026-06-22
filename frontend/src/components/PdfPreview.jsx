import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const documentCache = new Map();
const MAX_CACHE_SIZE = 5;

/**
 * Renders a single page of a PDF file onto a canvas.
 * @param {Object} props
 * @param {File|ArrayBuffer|string} props.file - File object, ArrayBuffer, or URL
 * @param {number} [props.pageNumber=1]
 * @param {number} [props.scale=1.0]
 * @param {string} [props.className]
 */
export default function PdfPreview({ file, pageNumber = 1, scale = 1.0, className = '' }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;

    async function render() {
      setLoading(true);
      setError(null);
      try {
        let cacheEntry = documentCache.get(file);
        if (!cacheEntry) {
          if (documentCache.size >= MAX_CACHE_SIZE) {
            const firstKey = documentCache.keys().next().value;
            const oldTask = documentCache.get(firstKey);
            documentCache.delete(firstKey);
            oldTask.destroy().catch(() => {});
          }
          let source;
          if (file instanceof File) {
            const buf = await file.arrayBuffer();
            source = { data: buf };
          } else if (file instanceof ArrayBuffer) {
            source = { data: file };
          } else {
            source = { url: file };
          }
          cacheEntry = pdfjsLib.getDocument(source);
          documentCache.set(file, cacheEntry);
        }

        const pdf = await cacheEntry.promise;
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError('Gagal merender PDF');
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [file, pageNumber, scale]);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1d27] rounded-lg">
          <div className="w-6 h-6 border-2 border-[#e2001a] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="p-4 text-sm text-red-400 bg-red-900/10 rounded-lg border border-red-800/30">
          {error}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-lg max-w-full ${loading ? 'invisible' : 'visible'}`}
      />
    </div>
  );
}
