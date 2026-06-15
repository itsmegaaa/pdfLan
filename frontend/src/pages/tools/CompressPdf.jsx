import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { useState } from 'react';
import { apiCompress } from '../../utils/api';
import { formatFileSize } from '../../utils/fileHelpers';

export default function CompressPdf() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const files = useToolStore((s) => s.files);
  const [level, setLevel] = useState('medium');

  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(20);
      const res = await apiCompress(files[0], level);
      setProgress(90);
      const { fileId, filename } = res.data;
      setResult({ url: `${import.meta.env.VITE_API_BASE_URL}/download/${fileId}?filename=${encodeURIComponent(filename)}`, filename });
    } catch (err) {
      setError(err.message || 'Gagal mengompresi PDF. Pastikan backend berjalan.');
    }
  };

  const LEVELS = [
    { v: 'low', label: 'Rendah', desc: 'Kualitas tinggi, ukuran sedikit berkurang' },
    { v: 'medium', label: 'Sedang', desc: 'Keseimbangan kualitas & ukuran' },
    { v: 'high', label: 'Tinggi', desc: 'Ukuran paling kecil, kualitas berkurang' },
  ];

  return (
    <ToolLayout
      title="Compress PDF"
      description="Kurangi ukuran file PDF menggunakan Ghostscript. Butuh backend berjalan."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Compress PDF"
      options={
        <div className="space-y-2">
          <label className="block text-sm text-[#8b90b0] mb-2">Level Kompresi</label>
          {LEVELS.map(({ v, label, desc }) => (
            <label key={v} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
              ${level === v ? 'border-[#e2001a]/50 bg-[#e2001a]/5' : 'border-[#2d3150] hover:border-[#e2001a]/30'}`}>
              <input type="radio" name="level" value={v} checked={level === v} onChange={() => setLevel(v)} className="mt-0.5 accent-[#e2001a]" />
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-[#8b90b0]">{desc}</p>
              </div>
            </label>
          ))}
          {files[0] && <p className="text-xs text-[#4a5070] mt-2">Ukuran asli: {formatFileSize(files[0].size)}</p>}
        </div>
      }
    />
  );
}
