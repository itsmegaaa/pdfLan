import { useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiRemoveBackground, apiDownloadUrl } from '../../utils/api';

export default function RemoveBackground() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();

  const handleProcess = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    let currentProgress = 0;
    let interval;

    try {
      startProcess();
      
      // Fake progress berjalan dari 0 sampai mentok di 99
      interval = setInterval(() => {
        if (currentProgress < 99) {
          // Tambah 2-7% setiap 400ms agar realistis
          currentProgress += Math.random() * 5 + 2;
          if (currentProgress > 99) currentProgress = 99;
          setProgress(Math.floor(currentProgress));
        }
      }, 400);
      
      const response = await apiRemoveBackground(file);
      
      clearInterval(interval);
      setProgress(99);

      const { fileId, filename } = response.data;
      
      setResult({
        url: apiDownloadUrl(fileId) + `?filename=${encodeURIComponent(filename)}`,
        filename
      });

    } catch (err) {
      clearInterval(interval);
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
