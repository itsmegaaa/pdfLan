import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { addPageNumbers } from '../../utils/clientPdf';

const POSITIONS = [
  { v: 'top-left', label: 'Atas Kiri' },
  { v: 'top-center', label: 'Atas Tengah' },
  { v: 'top-right', label: 'Atas Kanan' },
  { v: 'bottom-left', label: 'Bawah Kiri' },
  { v: 'bottom-center', label: 'Bawah Tengah' },
  { v: 'bottom-right', label: 'Bawah Kanan' },
];

export default function PageNumbers() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const [position, setPosition] = useState('bottom-center');
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(12);

  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(30);
      const bytes = await addPageNumbers(files[0], { position, startAt, fontSize });
      setProgress(90);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name });
    } catch (err) {
      setError(err.message || 'Gagal menambahkan nomor halaman');
    }
  };

  return (
    <ToolLayout
      title="Page Numbers"
      description="Tambahkan nomor halaman ke PDF dengan posisi dan format yang diinginkan."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Tambah Nomor Halaman"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#8b90b0] mb-2">Posisi Nomor</label>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map(({ v, label }) => (
                <button key={v} onClick={() => setPosition(v)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors
                    ${position === v ? 'bg-[#e2001a] text-white' : 'bg-[#22263a] text-[#8b90b0] hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Mulai dari halaman</label>
              <input type="number" min={1} value={startAt}
                onChange={(e) => setStartAt(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-2.5 bg-[#22263a] border border-[#2d3150] rounded-xl text-white focus:outline-none focus:border-[#e2001a]/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Ukuran Font ({fontSize}px)</label>
              <input type="range" min={8} max={24} step={1} value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full mt-2 accent-[#e2001a]" />
            </div>
          </div>
        </div>
      }
    />
  );
}
