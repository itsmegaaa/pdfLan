import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiProtect } from '../../utils/api';

export default function ProtectPdf() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const [userPass, setUserPass] = useState('');
  const [ownerPass, setOwnerPass] = useState('');
  const [perms, setPerms] = useState({ print: true, copy: false, edit: false });

  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(30);
      const permissions = Object.entries(perms).filter(([, v]) => v).map(([k]) => k);
      const res = await apiProtect(files[0], userPass, ownerPass || userPass, permissions);
      setProgress(90);
      const { fileId, filename } = res.data;
      const finalFilename = filename || files[0].name;
      setResult({ url: `${import.meta.env.VITE_API_BASE_URL}/download/${fileId}?filename=${encodeURIComponent(finalFilename)}`, filename: finalFilename });
    } catch (err) {
      setError(err.message || 'Gagal mengenkripsi PDF. Pastikan backend berjalan.');
    }
  };

  return (
    <ToolLayout
      title="Protect PDF"
      description="Tambahkan password dan enkripsi 256-bit ke PDF menggunakan qpdf."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Proteksi PDF"
      options={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Password User *</label>
              <input type="password" value={userPass} onChange={(e) => setUserPass(e.target.value)}
                placeholder="Password untuk membuka"
                className="w-full px-4 py-2.5 bg-[#22263a] border border-[#2d3150] rounded-xl text-white focus:outline-none focus:border-[#e2001a]/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#8b90b0] mb-1">Password Owner (opsional)</label>
              <input type="password" value={ownerPass} onChange={(e) => setOwnerPass(e.target.value)}
                placeholder="Password pemilik"
                className="w-full px-4 py-2.5 bg-[#22263a] border border-[#2d3150] rounded-xl text-white focus:outline-none focus:border-[#e2001a]/50 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#8b90b0] mb-2">Izinkan pengguna untuk:</label>
            {[{ k: 'print', label: 'Mencetak (Print)' }, { k: 'copy', label: 'Menyalin teks (Copy)' }, { k: 'edit', label: 'Mengedit konten' }].map(({ k, label }) => (
              <label key={k} className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={perms[k]} onChange={(e) => setPerms((p) => ({ ...p, [k]: e.target.checked }))}
                  className="accent-[#e2001a]" />
                <span className="text-sm text-white">{label}</span>
              </label>
            ))}
          </div>
        </div>
      }
    />
  );
}
