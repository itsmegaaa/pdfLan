import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { redactPdf } from '../../utils/clientPdf';
import PdfPreview from '../../components/PdfPreview';

export default function RedactPdf() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const [areas, setAreas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [previewRect, setPreviewRect] = useState(null);
  const files = useToolStore((s) => s.files);

  const getRelativePos = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    const pos = getRelativePos(e);
    setDrawing(true);
    setStartPos(pos);
    setPreviewRect(null);
  };

  const handleMouseMove = (e) => {
    if (!drawing || !startPos) return;
    const pos = getRelativePos(e);
    setPreviewRect({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    });
  };

  const handleMouseUp = (e) => {
    if (!drawing || !previewRect) return;
    setDrawing(false);
    if (previewRect.w > 5 && previewRect.h > 5) {
      setAreas((prev) => [...prev, { page: currentPage, ...previewRect }]);
    }
    setPreviewRect(null);
    setStartPos(null);
  };

  const handleProcess = async () => {
    if (!files[0]) return;
    try {
      startProcess();
      setProgress(30);
      const bytes = await redactPdf(files[0], areas);
      setProgress(90);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name });
    } catch (err) {
      setError(err.message || 'Gagal meredaksi PDF');
    }
  };

  return (
    <ToolLayout
      title="Redact PDF"
      description="Hitamkan area sensitif di PDF secara permanen. Klik dan drag di atas PDF untuk memilih area."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel={`Redact PDF (${areas.length} area)`}
      options={
        files[0] && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#8b90b0]">Halaman {currentPage} — Klik dan drag untuk memilih area redaksi</p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-[#22263a] text-white rounded-lg text-xs hover:bg-[#2d3150]">← Prev</button>
                <button onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 bg-[#22263a] text-white rounded-lg text-xs hover:bg-[#2d3150]">Next →</button>
              </div>
            </div>

            <div className="relative overflow-auto border border-[#2d3150] rounded-xl cursor-crosshair select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <PdfPreview file={files[0]} pageNumber={currentPage} scale={1.0} />

              {/* Existing redactions for current page */}
              {areas.filter((a) => a.page === currentPage).map((a, i) => (
                <div key={i} className="absolute bg-black pointer-events-none"
                  style={{ left: a.x, top: a.y, width: a.w, height: a.h }} />
              ))}

              {/* Drawing preview */}
              {previewRect && (
                <div className="absolute bg-black/70 border-2 border-[#e2001a] pointer-events-none"
                  style={{ left: previewRect.x, top: previewRect.y, width: previewRect.w, height: previewRect.h }} />
              )}
            </div>

            {areas.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#8b90b0]">{areas.length} area dipilih</p>
                <button onClick={() => setAreas([])} className="text-xs text-red-400 hover:text-red-300">Hapus semua</button>
              </div>
            )}
          </div>
        )
      }
    />
  );
}
