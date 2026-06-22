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
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6 animate-bounce-once">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Selesai! 🎉</h2>
        <p className="text-[#8b90b0] mb-8">File siap diunduh.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-[#e2001a] hover:bg-[#b8001a] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/30">
            <Download className="w-4 h-4" /> Unduh {result.filename || 'File'}
          </button>
          <button onClick={() => { reset(); setUrl(''); }} className="flex items-center gap-2 px-6 py-3 bg-[#22263a] hover:bg-[#2d3150] text-white font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" /> Proses File Lain
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 border-4 border-[#e2001a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Sedang memproses…</p>
          </div>
          <ProgressBar progress={progress} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <a href="/" className="inline-flex items-center gap-1.5 text-sm text-[#8b90b0] hover:text-white mb-6 transition-colors">← Semua Tools</a>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">HTML to PDF</h1>
        <p className="text-[#8b90b0]">Ubah halaman web dari URL menjadi PDF menggunakan Puppeteer.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[#8b90b0] mb-2">URL Halaman Web</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 bg-[#1a1d27] border border-[#2d3150] rounded-xl text-white placeholder-[#4a5070]
              focus:outline-none focus:border-[#e2001a]/50 text-sm" />
        </div>
        <button onClick={handleProcess}
          className="w-full py-3.5 bg-[#e2001a] hover:bg-[#b8001a] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/30">
          Convert ke PDF
        </button>
      </div>
    </div>
  );
}
