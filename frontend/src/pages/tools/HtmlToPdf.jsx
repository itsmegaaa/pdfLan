import ToolLayout from '../../components/ToolLayout';
import { useState } from 'react';
import useToolStore from '../../store/useToolStore';
import { CheckCircle, Download, RefreshCw } from 'lucide-react';
import ProgressBar from '../../components/ProgressBar';
import { apiHtmlToPdf, apiDownloadUrl } from '../../utils/api';

export default function HtmlToPdf() {
  const { startProcess, setProgress, setResult, setError, isProcessing, progress, result, reset } = useToolStore();
  const [url, setUrl] = useState('');

  const handleProcess = async () => {
    if (!url.trim()) { setError('Masukkan URL terlebih dahulu'); return; }
    try {
      startProcess();
      setProgress(30);
      const res = await apiHtmlToPdf(url);
      const data = res.data;
      if (!data.success) throw new Error(data.message);
      setProgress(90);
      const finalFilename = data.filename || 'page.pdf';
      setResult({ url: `${apiDownloadUrl(data.fileId)}?filename=${encodeURIComponent(finalFilename)}`, filename: finalFilename });
    } catch (err) {
      setError(err.message || 'Gagal mengkonversi HTML. Pastikan Puppeteer berjalan.');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename || 'page.pdf';
    a.click();
  };

  if (result) {
    return <ToolLayout title="HTML to PDF" description="File siap diunduh." showFileList={false} hideDropZone={true} />;
  }

  return (
    <ToolLayout title="HTML to PDF" description="Ubah halaman web dari URL menjadi PDF menggunakan Puppeteer." showFileList={false} hideDropZone={true}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-2">URL Halaman Web</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 bg-surface border border-border rounded-md text-text-main placeholder-text-muted/50 focus:outline-none focus:border-primary/50 text-sm" />
        </div>
        <button onClick={handleProcess}
          className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md transition-colors shadow-md shadow-red-900/20">
          Convert ke PDF
        </button>
      </div>
    </ToolLayout>
  );
}



