// Generic backend tool page factory
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { apiConvert } from '../../utils/api';

function makeConvertPage({ title, desc, accept, endpoint, outputName, actionLabel }) {
  return function ConvertPage() {
    const { startProcess, setUploadProgress, setStatus, setResult, setError } = useToolStore();
    const handleProcess = async (files) => {
      try {
        const file = files[0];
        const totalMb = file?.size ? (file.size / (1024 * 1024)).toFixed(1) : 0;
        startProcess('Menyiapkan file...', `Ukuran dokumen: ${totalMb} MB`);
        
        const res = await apiConvert(endpoint, file, (e) => {
          if (e.total) {
            const percent = Math.round((e.loaded * 100) / e.total);
            const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
            setUploadProgress(percent, percent < 100
              ? `Mengunggah: ${loadedMb} MB / ${totalMb} MB`
              : 'File terunggah! Memproses konversi di server...');
          }
        });

        const { fileId, filename } = res.data;
        const finalFilename = filename || outputName;
        setResult({ url: `${import.meta.env.VITE_API_BASE_URL}/download/${fileId}?filename=${encodeURIComponent(finalFilename)}`, filename: finalFilename });
      } catch (err) {
        setError(err.message || 'Gagal memproses. Pastikan backend & LibreOffice berjalan.');
      }
    };
    return <ToolLayout title={title} description={desc} accept={accept} multiple={false} onProcess={handleProcess} actionLabel={actionLabel} />;
  };
}

export const PdfToWord = makeConvertPage({
  title: 'PDF to Word', desc: 'Ubah PDF menjadi dokumen Word (.docx) yang dapat diedit.',
  accept: { 'application/pdf': ['.pdf'] }, endpoint: 'pdf-to-word', outputName: 'output.docx', actionLabel: 'Convert ke Word',
});
export const PdfToPowerPoint = makeConvertPage({
  title: 'PDF to PowerPoint', desc: 'Ubah PDF menjadi presentasi PowerPoint (.pptx).',
  accept: { 'application/pdf': ['.pdf'] }, endpoint: 'pdf-to-powerpoint', outputName: 'output.pptx', actionLabel: 'Convert ke PowerPoint',
});

export const WordToPdf = makeConvertPage({
  title: 'Word to PDF', desc: 'Ubah dokumen Word (.docx/.doc) menjadi PDF.',
  accept: { 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
  endpoint: 'word-to-pdf', outputName: 'output.pdf', actionLabel: 'Convert ke PDF',
});
export const PowerPointToPdf = makeConvertPage({
  title: 'PowerPoint to PDF', desc: 'Ubah presentasi PowerPoint menjadi PDF.',
  accept: { 'application/vnd.ms-powerpoint': ['.ppt'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
  endpoint: 'ppt-to-pdf', outputName: 'output.pdf', actionLabel: 'Convert ke PDF',
});
export const ExcelToPdf = makeConvertPage({
  title: 'Excel to PDF', desc: 'Ubah spreadsheet Excel menjadi PDF.',
  accept: { 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
  endpoint: 'excel-to-pdf', outputName: 'output.pdf', actionLabel: 'Convert ke PDF',
});
export const PdfToJpg = makeConvertPage({
  title: 'PDF to JPG', desc: 'Ubah setiap halaman PDF menjadi gambar JPG (download sebagai ZIP).',
  accept: { 'application/pdf': ['.pdf'] }, endpoint: 'pdf-to-jpg', outputName: 'pages.zip', actionLabel: 'Convert ke JPG',
});
export const PdfToPdfa = makeConvertPage({
  title: 'PDF to PDF/A', desc: 'Ubah PDF menjadi format arsip PDF/A (ISO 19005).',
  accept: { 'application/pdf': ['.pdf'] }, endpoint: 'pdf-to-pdfa', outputName: 'output.pdf', actionLabel: 'Convert ke PDF/A',
});
