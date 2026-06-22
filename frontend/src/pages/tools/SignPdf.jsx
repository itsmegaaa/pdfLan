import { useRef, useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { PDFDocument, rgb } from 'pdf-lib';
import SignaturePad from 'signature_pad';

export default function SignPdf() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const [mode, setMode] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [typedName, setTypedName] = useState('');
  const [uploadedImg, setUploadedImg] = useState(null);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // % from top-left
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      padRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgba(0,0,0,0)',
        penColor: '#ffffff',
      });
    }
    return () => {
      if (padRef.current) {
        padRef.current.off();
      }
    };
  }, [mode]);

  const clearPad = () => padRef.current?.clear();

  const getSignatureBytes = async () => {
    if (mode === 'draw') {
      if (!padRef.current || padRef.current.isEmpty()) throw new Error('Tanda tangan kosong');
      const dataUrl = padRef.current.toDataURL('image/png');
      const res = await fetch(dataUrl);
      return new Uint8Array(await res.arrayBuffer());
    }
    if (mode === 'type') {
      // Render typed name to canvas
      const c = document.createElement('canvas');
      c.width = 400; c.height = 120;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.font = 'italic 48px serif';
      ctx.fillText(typedName, 20, 80);
      const res = await fetch(c.toDataURL('image/png'));
      return new Uint8Array(await res.arrayBuffer());
    }
    if (mode === 'upload' && uploadedImg) {
      const res = await fetch(uploadedImg);
      return new Uint8Array(await res.arrayBuffer());
    }
    throw new Error('Tidak ada tanda tangan');
  };

  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(20);
      const imgBytes = await getSignatureBytes();
      setProgress(50);
      const pdfBytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(pdfBytes);
      const page = doc.getPages()[pageNumber - 1] || doc.getPages()[0];
      const { width, height } = page.getSize();
      const img = await doc.embedPng(imgBytes);
      const sigW = 160, sigH = 60;
      page.drawImage(img, {
        x: (position.x / 100) * width,
        y: height - (position.y / 100) * height - sigH,
        width: sigW,
        height: sigH,
      });
      setProgress(90);
      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name });
    } catch (err) {
      setError(err.message || 'Gagal menandatangani PDF');
    }
  };

  return (
    <ToolLayout
      title="Sign PDF"
      description="Tambahkan tanda tangan digital ke PDF dengan cara menggambar, mengetik, atau upload gambar TTD."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Tempel Tanda Tangan"
      options={
        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-2">
            {[{ v: 'draw', label: '✏️ Gambar' }, { v: 'type', label: '⌨️ Ketik' }, { v: 'upload', label: '📁 Upload' }].map(({ v, label }) => (
              <button key={v} onClick={() => setMode(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                  ${mode === v ? 'bg-[#e2001a] text-white' : 'bg-[#22263a] text-[#8b90b0] hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {mode === 'draw' && (
            <div className="space-y-2">
              <canvas ref={canvasRef} width={500} height={150}
                className="w-full bg-[#22263a] rounded-xl border border-[#2d3150] touch-none cursor-crosshair" />
              <button onClick={clearPad} className="text-xs text-[#8b90b0] hover:text-white">Hapus</button>
            </div>
          )}

          {mode === 'type' && (
            <input type="text" value={typedName} onChange={(e) => setTypedName(e.target.value)}
              placeholder="Ketik nama kamu..."
              className="w-full px-4 py-3 bg-[#22263a] border border-[#2d3150] rounded-xl text-white italic text-xl font-serif focus:outline-none focus:border-[#e2001a]/50" />
          )}

          {mode === 'upload' && (
            <input type="file" accept="image/*"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) setUploadedImg(URL.createObjectURL(f));
              }}
              className="w-full text-sm text-[#8b90b0]" />
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Halaman</label>
              <input type="number" min={1} value={pageNumber}
                onChange={(e) => setPageNumber(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#22263a] border border-[#2d3150] rounded-xl text-white focus:outline-none focus:border-[#e2001a]/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Posisi X ({position.x}%)</label>
              <input type="range" min={0} max={80} value={position.x}
                onChange={(e) => setPosition((p) => ({ ...p, x: Number(e.target.value) }))}
                className="w-full accent-[#e2001a]" />
            </div>
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Posisi Y ({position.y}%)</label>
              <input type="range" min={0} max={80} value={position.y}
                onChange={(e) => setPosition((p) => ({ ...p, y: Number(e.target.value) }))}
                className="w-full accent-[#e2001a]" />
            </div>
          </div>
        </div>
      }
    />
  );
}
