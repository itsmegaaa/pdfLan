import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { useState } from 'react';
import { apiCompress } from '../../utils/api';
import { formatFileSize } from '../../utils/fileHelpers';

export default function CompressPdf() {
  const files = useToolStore((s) => s.files);
  const [level, setLevel] = useState('medium');

  const handleProcessFile = async (file, { setProgress }) => {
    const res = await apiCompress(file, level, (e) => {
      if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
    });
    const { fileId, filename } = res.data;
    const downloadUrl = `${import.meta.env.VITE_API_BASE_URL}/download/${fileId}?filename=${encodeURIComponent(filename)}`;

    let compressedBytes = 0;
    try {
      const head = await fetch(downloadUrl, { method: 'HEAD' });
      compressedBytes = Number(head.headers.get('content-length')) || 0;
    } catch { /* abaikan, statistik opsional */ }

    return { url: downloadUrl, filename, compressedBytes };
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
      multiple={true}
      batch={true}
      onProcessFile={handleProcessFile}
      actionLabel="Compress PDF"
      options={
        <div className="space-y-2">
          <label className="block text-xs text-text-muted mb-2">Level Kompresi</label>
          {LEVELS.map(({ v, label, desc }) => (
            <label key={v} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors
              ${level === v ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-border-hover'}`}>
              <input type="radio" name="level" value={v} checked={level === v} onChange={() => setLevel(v)} className="mt-0.5 accent-primary" />
              <div>
                <p className="text-xs font-semibold text-text-main">{label}</p>
                <p className="text-[11px] text-text-muted">{desc}</p>
              </div>
            </label>
          ))}
          {files[0] && <p className="text-[11px] text-text-muted mt-2">Ukuran asli: {formatFileSize(files[0].size)}</p>}
        </div>
      }
    />
  );
}
