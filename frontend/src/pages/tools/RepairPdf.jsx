import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiRepair } from '../../utils/api';

export default function RepairPdf() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const handleProcess = async (files) => {
    try {
      startProcess();
      setProgress(30);
      const res = await apiRepair(files[0]);
      setProgress(90);
      const { fileId, filename } = res.data;
      const finalFilename = filename || files[0].name;
      setResult({ url: `${import.meta.env.VITE_API_BASE_URL}/download/${fileId}?filename=${encodeURIComponent(finalFilename)}`, filename: finalFilename });
    } catch (err) {
      setError(err.message || 'Gagal memperbaiki PDF. Pastikan backend berjalan.');
    }
  };
  return (
    <ToolLayout title="Repair PDF" description="Perbaiki file PDF yang rusak atau corrupt menggunakan qpdf/Ghostscript."
      accept={{ 'application/pdf': ['.pdf'] }} multiple={false} onProcess={handleProcess} actionLabel="Perbaiki PDF" />
  );
}
