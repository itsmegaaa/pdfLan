import { useState, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { RotateCw, RotateCcw } from 'lucide-react';
import useToolStore from '../../store/useToolStore';
import PdfPreview from '../../components/PdfPreview';
import ToolLayout from '../../components/ToolLayout';

function PageItem({ page, onRotateRight, onRotateLeft }) {
  return (
    <div className="relative group bg-[#1a1d27] border border-[#2d3150] rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 flex-1 flex items-center justify-center bg-white/5 min-h-[200px]">
        <div style={{ transform: `rotate(${page.rotation}deg)`, transition: 'transform 0.3s ease' }}>
          <PdfPreview file={page.file} pageNumber={page.originalIndex + 1} scale={0.3} />
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#2d3150] bg-[#12141e]">
        <span className="text-xs text-[#8b90b0] font-medium">Hal. {page.originalIndex + 1}</span>
        <div className="flex gap-2">
          <button onClick={() => onRotateLeft(page.id)} className="p-1.5 text-[#8b90b0] hover:text-white bg-[#22263a] rounded hover:bg-[#2d3150] transition-colors" title="Putar Kiri">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onRotateRight(page.id)} className="p-1.5 text-[#8b90b0] hover:text-white bg-[#22263a] rounded hover:bg-[#2d3150] transition-colors" title="Putar Kanan">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RotatePdf() {
  const { files, startProcess, setProgress, setResult, setError } = useToolStore();
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (files.length > 0) {
      loadPages(files[0]);
    } else {
      setPages([]);
    }
  }, [files]);

  const loadPages = async (f) => {
    try {
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const count = doc.getPageCount();
      
      const newPages = [];
      for (let i = 0; i < count; i++) {
        const page = doc.getPage(i);
        const rotation = page.getRotation().angle;
        newPages.push({ id: `page-${i}`, originalIndex: i, rotation: rotation, file: f });
      }
      setPages(newPages);
    } catch (err) {
      setError("Gagal membaca file PDF");
    }
  };

  const handleRotateRight = (id) =>
    setPages((p) => p.map((x) => x.id === id ? { ...x, rotation: x.rotation + 90 } : x));
    
  const handleRotateLeft = (id) =>
    setPages((p) => p.map((x) => x.id === id ? { ...x, rotation: x.rotation - 90 } : x));

  const rotateAllRight = () => setPages((p) => p.map((x) => ({ ...x, rotation: x.rotation + 90 })));
  const rotateAllLeft = () => setPages((p) => p.map((x) => ({ ...x, rotation: x.rotation - 90 })));

  const handleProcess = async () => {
    if (!files.length || !pages.length) return;
    try {
      startProcess();
      setProgress(20);
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      
      for (const pg of pages) {
        const page = doc.getPage(pg.originalIndex);
        // Normalize rotation to 0-360 just in case
        let normalizedRotation = pg.rotation % 360;
        if (normalizedRotation < 0) normalizedRotation += 360;
        
        page.setRotation(degrees(normalizedRotation));
        setProgress(20 + ((pg.originalIndex + 1) / pages.length) * 70);
      }
      
      setProgress(95);
      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name });
    } catch (err) {
      setError(err.message || 'Gagal merotasi PDF');
    }
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Putar halaman PDF ke kiri atau kanan sesuai kebutuhan. Bisa putar per halaman atau sekaligus."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Simpan Rotasi"
      showFileList={false}
    >
      {files.length > 0 && pages.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#1a1d27] border border-[#2d3150] rounded-xl gap-4">
            <span className="text-sm font-medium text-white">{pages.length} Halaman</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={rotateAllLeft} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#22263a] hover:bg-[#2d3150] text-[#8b90b0] hover:text-white rounded-lg text-sm transition-colors">
                <RotateCcw className="w-4 h-4" /> Semua Kiri
              </button>
              <button onClick={rotateAllRight} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#22263a] hover:bg-[#2d3150] text-[#8b90b0] hover:text-white rounded-lg text-sm transition-colors">
                <RotateCw className="w-4 h-4" /> Semua Kanan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((page) => (
              <PageItem
                key={page.id}
                page={page}
                onRotateRight={handleRotateRight}
                onRotateLeft={handleRotateLeft}
              />
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
