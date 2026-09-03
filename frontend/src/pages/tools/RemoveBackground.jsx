import { useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiRemoveBackground, apiDownloadUrl } from '../../utils/api';

export default function RemoveBackground() {
  const { startProcess, setUploadProgress, setResult, setError } = useToolStore();

  const handleProcess = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const totalMb = file?.size ? (file.size / (1024 * 1024)).toFixed(1) : 0;

    try {
      startProcess('Menyiapkan gambar...', `Ukuran gambar: ${totalMb} MB`);

      const response = await apiRemoveBackground(file, (e) => {
        if (e.total) {
          const percent = Math.round((e.loaded * 100) / e.total);
          const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
          setUploadProgress(percent, percent < 100
            ? `Mengunggah: ${loadedMb} MB / ${totalMb} MB`
            : 'Gambar terunggah! Model AI sedang menghapus background...');
        }
      });

      const { fileId, filename } = response.data;
      setResult({
        url: apiDownloadUrl(fileId) + `?filename=${encodeURIComponent(filename)}`,
        filename
      });
    } catch (err) {
      setError(err.message || 'Gagal menghapus background gambar.');
    }
  };

  return (
    <ToolLayout
      title="Remove Background"
      description="Hapus background gambar dan export sebagai PNG transparan."
      accept={{
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png']
      }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Remove Background"
    />
  );
}
