import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiCompare } from '../../utils/api';
import DropZone from '../../components/DropZone';
import { CheckCircle, Download, RefreshCw } from 'lucide-react';
import ProgressBar from '../../components/ProgressBar';

export default function ComparePdf() {
  const { startProcess, setProgress, setResult, setError, isProcessing, progress, result, reset } = useToolStore();
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);

  const handleProcess = async () => {
    if (!file1 || !file2) { setError('Masukkan kedua PDF'); return; }
    try {
      startProcess();
      setProgress(30);
      const res = await apiCompare(file1, file2);
      setProgress(90);
      const { fileId, filename } = res.data;
      const finalFilename = filename || files[0].name;
      setResult({ url: `${import.meta.env.VITE_API_BASE_URL}/download/${fileId}?filename=${encodeURIComponent(finalFilename)}`, filename: finalFilename });
    } catch (err) {
      setError(err.message || 'Gagal membandingkan PDF. Pastikan backend & Ghostscript/qpdf berjalan.');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename || 'comparison.pdf';
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
          <button onClick={() => { reset(); setFile1(null); setFile2(null); }} className="flex items-center gap-2 px-6 py-3 bg-[#22263a] hover:bg-[#2d3150] text-white font-semibold rounded-xl transition-colors">
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
    <div className="max-w-4xl mx-auto px-4 py-10">
      <a href="/" className="inline-flex items-center gap-1.5 text-sm text-[#8b90b0] hover:text-white mb-6 transition-colors">← Semua Tools</a>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Compare PDF</h1>
        <p className="text-[#8b90b0]">Bandingkan dua versi dokumen PDF secara berdampingan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">PDF Asli</h2>
          <DropZone onFiles={(f) => setFile1(f[0])} accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={file1 ? [file1] : []} onRemove={() => setFile1(null)} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">PDF Revisi</h2>
          <DropZone onFiles={(f) => setFile2(f[0])} accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={file2 ? [file2] : []} onRemove={() => setFile2(null)} />
        </div>
      </div>

      <button onClick={handleProcess} disabled={!file1 || !file2}
        className="w-full py-3.5 bg-[#e2001a] hover:bg-[#b8001a] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg">
        Bandingkan File
      </button>
    </div>
  );
}
