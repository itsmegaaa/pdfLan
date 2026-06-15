import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiUnlock } from '../../utils/api';
import { Eye, EyeOff } from 'lucide-react';

export default function UnlockPdf() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(30);
      const res = await apiUnlock(files[0], password);
      setProgress(90);
      const { fileId, filename } = res.data;
      const finalFilename = filename || files[0].name;
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
