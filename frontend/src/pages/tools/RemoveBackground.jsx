import { useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiRemoveBackground, apiDownloadUrl } from '../../utils/api';

export default function RemoveBackground() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();

  const handleProcess = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      startProcess();
      setProgress(10);
      
      const response = await apiRemoveBackground(file);
      setProgress(90);

      const { fileId, filename } = response.data;
      
      setResult({
        url: apiDownloadUrl(fileId) + `?filename=${encodeURIComponent(filename)}`,
        filename
      });

      setProgress(100);
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
