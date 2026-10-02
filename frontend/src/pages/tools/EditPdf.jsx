import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDocument, degrees } from 'pdf-lib';
import { GripVertical, Trash2, RotateCw, CheckCircle, Download, RefreshCw } from 'lucide-react';
import useToolStore from '../../store/useToolStore';
import { downloadBlob } from '../../utils/fileHelpers';
import PdfThumbnail from '../../components/PdfThumbnail';
import DropZone from '../../components/DropZone';
import ProgressBar from '../../components/ProgressBar';
import { Link } from 'react-router-dom';
import ToolLayout from '../../components/ToolLayout';

function SortablePage({ page, onDelete, onRotate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative group bg-surface border border-border rounded-xl overflow-hidden flex flex-col h-full">
      <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-black/40 rounded p-1">
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      <div className="p-2 flex-1 flex items-center justify-center">
        <div style={{ transform: `rotate(${page.rotation || 0}deg)`, transition: 'transform 0.3s ease' }}>
          <PdfThumbnail file={page.file} pageNumber={page.originalIndex + 1} scale={0.3} />
        </div>
      </div>
      <div className="flex items-center justify-between px-2 pb-2 mt-auto">
        <div className="flex flex-col truncate pr-2">
          <span className="text-xs text-white truncate w-24" title={page.file.name}>{page.file.name}</span>
          <span className="text-[10px] text-text-muted">Hal. {page.originalIndex + 1}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onRotate(page.id)} className="p-1 text-text-muted hover:text-white" title="Putar Halaman">
            <RotateCw className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(page.id)} className="p-1 text-text-muted hover:text-red-400" title="Hapus Halaman">
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
    setPages((p) => p.map((x) => x.id === id ? { ...x, rotation: x.rotation + 90 } : x));

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
    if (result.blob) {
      downloadBlob(result.blob, result.filename || "edited_document.pdf");
    } else if (result.url) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename || "edited_document.pdf";
      a.click();
    }
  };

  if (result) { return <ToolLayout title="Page Builder (Edit PDF)" description="File siap diunduh." showFileList={false} hideDropZone={true} />; }

  return (
    <ToolLayout title="Page Builder (Edit PDF)" description="Unggah banyak PDF sekaligus. Hapus, putar, atau geser halaman antar dokumen sesuka Anda." showFileList={false} hideDropZone={true} onFilesAdded={addFiles}>
      {/* Pages Workspace */}
      {pages.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-text-muted">Total: <strong className="text-text-main">{pages.length}</strong> halaman tergabung</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setPages([]); reset(); }}
                className="px-3 py-1.5 bg-surface-hover text-text-muted hover:text-text-main rounded-md text-xs transition-colors"
              >
                Bersihkan Semua
              </button>
              <button
                onClick={handleProcess}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md text-sm transition-colors shadow-md shadow-red-900/20"
              >
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

      {/* DropZone for uploading initial or subsequent PDFs */}
      <div className={pages.length > 0 ? "pt-6 border-t border-border" : ""}>
        {pages.length > 0 && (
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Tambah / Drag & Drop File PDF Lainnya:
          </p>
        )}
        <DropZone onFiles={addFiles} accept={{ 'application/pdf': ['.pdf'] }} multiple={true} variant={pages.length > 0 ? "compact" : "default"} />
      </div>
    </ToolLayout>
  );
}





