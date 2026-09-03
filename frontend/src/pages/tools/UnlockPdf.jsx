import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiUnlock } from '../../utils/api';
import { Eye, EyeOff } from 'lucide-react';

export default function UnlockPdf() {
  const { startProcess, setUploadProgress, setResult, setError } = useToolStore();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const handleProcess = async (files) => {
    try {
      const file = files[0];
      const totalMb = file?.size ? (file.size / (1024 * 1024)).toFixed(1) : 0;
      startProcess('Menyiapkan file...', `Ukuran dokumen: ${totalMb} MB`);

      const res = await apiUnlock(file, password, (e) => {
        if (e.total) {
          const percent = Math.round((e.loaded * 100) / e.total);
          const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
          setUploadProgress(percent, percent < 100
            ? `Mengunggah: ${loadedMb} MB / ${totalMb} MB`
            : 'File terunggah! Membuka enkripsi PDF...');
        }
      });

      const { fileId, filename } = res.data;
      const finalFilename = filename || file.name;
      setResult({ url: `${import.meta.env.VITE_API_BASE_URL}/download/${fileId}?filename=${encodeURIComponent(finalFilename)}`, filename: finalFilename });
    } catch (err) {
      setError(err.message || 'Gagal membuka kunci PDF. Password mungkin salah.');
    }
  };

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Hapus password dan enkripsi dari PDF yang terproteksi."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Buka Kunci PDF"
      options={
        <div>
          <label className="block text-sm text-[#8b90b0] mb-2">Password PDF</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password..."
              className="w-full px-4 py-2.5 pr-10 bg-[#22263a] border border-[#2d3150] rounded-xl text-white focus:outline-none focus:border-[#e2001a]/50 text-sm" />
            <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90b0] hover:text-white">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      }
    />
  );
}
