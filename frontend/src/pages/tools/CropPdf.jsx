import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { cropPdf } from '../../utils/clientPdf';

export default function CropPdf() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const [margins, setMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [applyTo, setApplyTo] = useState('all');

  const setMargin = (side, val) =>
    setMargins((prev) => ({ ...prev, [side]: Math.max(0, Number(val)) }));

  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(30);
      const bytes = await cropPdf(files[0], margins, applyTo === 'all' ? 'all' : [0]);
      setProgress(90);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name });
    } catch (err) {
      setError(err.message || 'Gagal memotong PDF');
    }
  };

  return (
    <ToolLayout
      title="Crop PDF"
      description="Potong area pinggir halaman PDF sesuai kebutuhan."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Crop PDF"
      options={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['top', 'right', 'bottom', 'left'].map((side) => (
              <div key={side}>
                <label className="block text-sm text-text-muted mb-1 capitalize">{
                  side === 'top' ? 'Atas' : side === 'right' ? 'Kanan' : side === 'bottom' ? 'Bawah' : 'Kiri'
                } (px)</label>
                <input type="number" min={0} value={margins[side]}
                  onChange={(e) => setMargin(side, e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-white focus:outline-none focus:border-[#e2001a]/50 text-sm" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-2">Terapkan ke</label>
            <div className="flex gap-2">
              {[{ v: 'all', label: 'Semua Halaman' }, { v: 'first', label: 'Halaman 1 Saja' }].map(({ v, label }) => (
                <button key={v} onClick={() => setApplyTo(v)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                    ${applyTo === v ? 'bg-primary text-white' : 'bg-surface-hover text-text-muted hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}

