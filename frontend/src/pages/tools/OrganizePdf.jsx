import { useState, useRef } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDocument, degrees } from 'pdf-lib';
import { GripVertical, Trash2, RotateCw, Plus } from 'lucide-react';
import useToolStore from '../../store/useToolStore';
import PdfThumbnail from '../../components/PdfThumbnail';
import DropZone from '../../components/DropZone';
import ToolLayout from '../../components/ToolLayout';

function SortablePage({ page, onDelete, onRotate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative group bg-surface border border-border rounded-xl overflow-hidden">
      <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-black/40 rounded p-1">
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      <div className="p-2">
        <PdfThumbnail file={page.file} pageNumber={page.originalIndex + 1} scale={0.3} />
      </div>
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs text-text-muted">Hal. {page.originalIndex + 1}</span>
        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button onClick={() => onRotate(page.id)} aria-label="Putar halaman" className="p-1 text-text-muted hover:text-white">
            <RotateCw className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(page.id)} aria-label="Hapus halaman" className="p-1 text-text-muted hover:text-red-400">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizePdf() {
  const { startProcess, setProgress, setResult, setError, reset, isProcessing, progress, result } = useToolStore();
  const [pages, setPages] = useState([]);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const loadPages = async (f) => {
    const bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const count = doc.getPageCount();
    setPageCount(count);
    setFile(f);
    setPages(
      Array.from({ length: count }, (_, i) => ({ id: `page-${i}`, originalIndex: i, rotation: 0, file: f }))
    );
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
    if (!file || !pages.length) return;
    try {
      startProcess();
      setProgress(20);
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      let i = 0;
      for (const pg of pages) {
        const [copied] = await out.copyPages(src, [pg.originalIndex]);
        if (pg.rotation) copied.setRotation(degrees((copied.getRotation().angle + pg.rotation) % 360));
        out.addPage(copied);
        setProgress(20 + (i / pages.length) * 70);
        i++;
      }
      setProgress(95);
      const blob = new Blob([await out.save()], { type: 'application/pdf' });
      setResult({ blob, filename: file ? file.name : "organized.pdf" });
    } catch (err) {
      setError(err.message || 'Gagal mengorganisir PDF');
    }
  };

  if (result) { return <ToolLayout title="Organize PDF" description="File siap diunduh." showFileList={false} hideDropZone={true} />; }

  return (
    <ToolLayout title="Organize PDF" description="Urutkan, hapus, atau putar halaman PDF. Drag untuk mengubah urutan." showFileList={false} hideDropZone={true} onFilesAdded={(f) => loadPages(f[0])}>
      {/* Pages Workspace */}
      {pages.length > 0 && (
        <div
          className={`space-y-4 mb-8 rounded-2xl transition-all ${isDragActive ? 'ring-2 ring-primary bg-primary/5 p-4' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); if (e.dataTransfer.files?.length) loadPages(e.dataTransfer.files[0]); }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted"><strong className="text-text-main">{pages.length}</strong> halaman ({file?.name})</p>
            <div className="flex gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 bg-surface-hover text-text-muted hover:text-text-main rounded-md text-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Ganti File
              </button>
              <button
                onClick={() => { setPages([]); setFile(null); reset(); }}
                className="px-3 py-1.5 bg-surface-hover text-text-muted hover:text-text-main rounded-md text-xs transition-colors"
              >
                Bersihkan
              </button>
              <button
                onClick={handleProcess}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md text-sm transition-colors shadow-md shadow-red-900/20"
              >
                Simpan PDF
              </button>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {pages.map((page) => (
                  <SortablePage key={page.id} page={page} onDelete={handleDelete} onRotate={handleRotate} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Upload awal */}
      {pages.length === 0 && (
        <DropZone onFiles={(f) => loadPages(f[0])} accept={{ 'application/pdf': ['.pdf'] }} multiple={false} />
      )}
      {/* Ganti file: hidden input */}
      <input
        type="file" ref={inputRef} className="hidden" accept=".pdf"
        onChange={(e) => { if (e.target.files?.length) loadPages(e.target.files[0]); e.target.value = null; }}
      />
    </ToolLayout>
  );
}





