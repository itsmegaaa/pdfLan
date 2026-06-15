import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiOcr } from '../../utils/api';

export default function OcrPdf() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const [lang, setLang] = useState('auto');

  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(20);
      const res = await apiOcr(files[0], lang);
      setProgress(90);
      const { fileId, filename } = res.data;
      const finalFilename = filename || files[0].name;
      setResult({ url: `${import.meta.env.VITE_API_BASE_URL}/download/${fileId}?filename=${encodeURIComponent(finalFilename)}`, filename: finalFilename });
    } catch (err) {
      setError(err.message || 'Gagal menjalankan OCR. Pastikan Tesseract terinstall.');
    }
  };

  return (
    <ToolLayout
      title="OCR PDF"
      description="Buat PDF yang dapat dicari teksnya menggunakan Tesseract OCR."
      accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Jalankan OCR"
      options={
        <div>
          <label className="block text-sm text-[#8b90b0] mb-2">Bahasa Dokumen</label>
          <div className="flex gap-2">
            {[{ v: 'auto', label: 'Auto Detect' }, { v: 'ind', label: 'Indonesia' }, { v: 'eng', label: 'English' }].map(({ v, label }) => (
              <button key={v} onClick={() => setLang(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                  ${lang === v ? 'bg-[#e2001a] text-white' : 'bg-[#22263a] text-[#8b90b0] hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
