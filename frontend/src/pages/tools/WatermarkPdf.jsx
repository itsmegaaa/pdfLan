import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { watermarkPdf } from '../../utils/clientPdf';
import PdfPreview from '../../components/PdfPreview';

const POSITIONS = [
  { v: 'center', label: 'Tengah' },
  { v: 'tile', label: 'Tile' },
  { v: 'top-left', label: 'Pojok Kiri Atas' },
  { v: 'top-right', label: 'Pojok Kanan Atas' },
  { v: 'bottom-left', label: 'Pojok Kiri Bawah' },
  { v: 'bottom-right', label: 'Pojok Kanan Bawah' },
];

export default function WatermarkPdf() {
  const { files, startProcess, setProgress, setResult, setError } = useToolStore();
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState('#cccccc');
  const [rotation, setRotation] = useState(-45);

  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(30);
      const bytes = await watermarkPdf(files[0], { text, opacity, fontSize, color, rotation });
      setProgress(90);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name });
    } catch (err) {
      setError(err.message || 'Gagal menambahkan watermark');
    }
  };

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Tambahkan teks watermark ke semua halaman PDF."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Tambah Watermark"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#8b90b0] mb-1">Teks Watermark</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#22263a] border border-[#2d3150] rounded-xl text-white focus:outline-none focus:border-[#e2001a]/50 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Opacity ({Math.round(opacity * 100)}%)</label>
              <input type="range" min={0.05} max={1} step={0.05} value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-[#e2001a]" />
            </div>
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Font Size ({fontSize}px)</label>
              <input type="range" min={10} max={120} step={5} value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-[#e2001a]" />
            </div>
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Rotasi ({rotation}°)</label>
              <input type="range" min={-90} max={90} step={15} value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-[#e2001a]" />
            </div>
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Warna</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
          </div>
          {/* Preview */}
          <div className="p-6 bg-[#22263a] rounded-xl flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
            <p className="text-xs text-[#4a5070] absolute top-2 left-3 z-10">Preview (Halaman 1)</p>
            {files && files.length > 0 ? (
              <div className="relative inline-block border border-[#2d3150] shadow-2xl mt-4">
                <PdfPreview file={files[0]} pageNumber={1} scale={0.8} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden mix-blend-multiply">
                  <span
                    style={{
                      color, opacity, fontSize: Math.min(fontSize, 120),
                      transform: `rotate(${rotation}deg)`,
                      fontWeight: 'bold', letterSpacing: 2,
                    }}
                  >
                    {text || 'WATERMARK'}
                  </span>
                </div>
              </div>
            ) : (
              <span
                style={{
                  color, opacity, fontSize: Math.min(fontSize * 0.4, 32),
                  transform: `rotate(${rotation}deg)`,
                  fontWeight: 'bold', letterSpacing: 2,
                }}
              >
                {text || 'WATERMARK'}
              </span>
            )}
          </div>
        </div>
      }
    />
  );
}
