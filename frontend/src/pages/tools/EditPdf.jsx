import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDocument, degrees } from 'pdf-lib';
import { GripVertical, Trash2, RotateCw, CheckCircle, Download, RefreshCw, Plus } from 'lucide-react';
import useToolStore from '../../store/useToolStore';
import PdfPreview from '../../components/PdfPreview';
import DropZone from '../../components/DropZone';
import ProgressBar from '../../components/ProgressBar';
import { Link } from 'react-router-dom';

function SortablePage({ page, onDelete, onRotate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative group bg-[#1a1d27] border border-[#2d3150] rounded-xl overflow-hidden flex flex-col h-full">
      <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-black/40 rounded p-1">
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      <div className="p-2 flex-1 flex items-center justify-center">
        <PdfPreview file={page.file} pageNumber={page.originalIndex + 1} scale={0.3} />
      </div>
      <div className="flex items-center justify-between px-2 pb-2 mt-auto">
        <div className="flex flex-col truncate pr-2">
          <span className="text-xs text-white truncate w-24" title={page.file.name}>{page.file.name}</span>
          <span className="text-[10px] text-[#8b90b0]">Hal. {page.originalIndex + 1}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onRotate(page.id)} className="p-1 text-[#8b90b0] hover:text-white" title="Putar Halaman">
            <RotateCw className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(page.id)} className="p-1 text-[#8b90b0] hover:text-red-400" title="Hapus Halaman">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditPdf() {
  const { startProcess, setProgress, setResult, setError, reset, isProcessing, progress, result } = useToolStore();
  const [pages, setPages] = useState([]);

  const addFiles = async (files) => {
    let newPages = [];
    for (const f of files) {
      try {
        const bytes = await f.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const count = doc.getPageCount();
        const filePages = Array.from({ length: count }, (_, i) => ({
          id: `page-${f.name}-${i}-${Date.now()}`,
          originalIndex: i,
          rotation: 0,
          file: f,
        }));
        newPages.push(...filePages);
      } catch (err) {
        setError(`Gagal memuat file ${f.name}: PDF mungkin rusak atau terenkripsi.`);
      }
    }
    setPages(p => [...p, ...newPages]);
  };

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldI = pages.findIndex((p) => p.id === active.id);
      const newI = pages.findIndex((p) => p.id === over.id);
      setPages(arrayMove(pages, oldI, newI));
    }
  };

  const handleDelete = (id) => setPages((p) => p.filter((x) => x.id !== id));

  const handleRotate = (id) =>
    setPages((p) => p.map((x) => x.id === id ? { ...x, rotation: (x.rotation + 90) % 360 } : x));

  const handleProcess = async () => {
    if (!pages.length) return;
    try {
      startProcess();
      setProgress(10);
      const out = await PDFDocument.create();
      const loadedDocs = {};
      
      let i = 0;
      for (const pg of pages) {
        // Cache loaded files to avoid parsing the same PDF multiple times
        if (!loadedDocs[pg.file.name]) {
            const bytes = await pg.file.arrayBuffer();
            loadedDocs[pg.file.name] = await PDFDocument.load(bytes);
        }
        const src = loadedDocs[pg.file.name];
        const [copied] = await out.copyPages(src, [pg.originalIndex]);
        if (pg.rotation) copied.setRotation(degrees((copied.getRotation().angle + pg.rotation) % 360));
        out.addPage(copied);
        setProgress(10 + (i / pages.length) * 80);
        i++;
      }
      setProgress(95);
      const blob = new Blob([await out.save()], { type: 'application/pdf' });
      setResult({ blob, filename: "edited_document.pdf" });
    } catch (err) {
      setError(err.message || 'Gagal memproses PDF');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url || URL.createObjectURL(result.blob);
    a.download = result.filename || "edited_document.pdf";
    a.click();
  };

  const handleAddMoreFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) addFiles(files);
  };

  if (result) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6 animate-bounce-once">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Selesai! 🎉</h2>
        <p className="text-[#8b90b0] mb-8">File PDF yang Anda susun siap diunduh.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-[#e2001a] hover:bg-[#b8001a] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/30">
            <Download className="w-4 h-4" /> Unduh PDF
          </button>
          <button onClick={() => { reset(); setPages([]); }} className="flex items-center gap-2 px-6 py-3 bg-[#22263a] hover:bg-[#2d3150] text-white font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" /> Susun PDF Baru
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
            <p className="text-white font-semibold">Sedang merender PDF...</p>
          </div>
          <ProgressBar progress={progress} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#8b90b0] hover:text-white mb-6 transition-colors">← Semua Tools</Link>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Page Builder (Edit PDF)</h1>
        <p className="text-[#8b90b0]">Unggah banyak PDF sekaligus. Hapus, putar, atau geser halaman antar dokumen sesuka Anda.</p>
      </div>

      {!pages.length ? (
        <DropZone onFiles={addFiles} accept={{ 'application/pdf': ['.pdf'] }} multiple={true} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-[#8b90b0]">Total: {pages.length} halaman tergabung</p>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer px-3 py-1.5 bg-[#2d3150] hover:bg-[#3a3f5c] text-white rounded-lg text-xs transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah PDF Lain
                <input type="file" multiple accept="application/pdf" className="hidden" onChange={handleAddMoreFiles} />
              </label>
              <button onClick={() => { setPages([]); reset(); }}
                className="px-3 py-1.5 bg-[#22263a] text-[#8b90b0] hover:text-white rounded-lg text-xs transition-colors">
                Bersihkan Semua
              </button>
              <button onClick={handleProcess}
                className="px-4 py-1.5 bg-[#e2001a] text-white font-semibold rounded-lg text-sm hover:bg-[#b8001a] transition-colors ml-auto sm:ml-0">
                Buat PDF Baru
              </button>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {pages.map((page) => (
                  <SortablePage key={page.id} page={page} onDelete={handleDelete} onRotate={handleRotate} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
