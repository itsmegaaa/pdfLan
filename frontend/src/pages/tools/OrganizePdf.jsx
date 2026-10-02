import { useState, useCallback } from 'react';
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
      className="relative group bg-surface border border-border rounded-xl overflow-hidden">
      <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-black/40 rounded p-1">
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      <div className="p-2">
        <PdfThumbnail file={page.file} pageNumber={page.originalIndex + 1} scale={0.3} />
      </div>
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs text-text-muted">Hal. {page.originalIndex + 1}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onRotate(page.id)} className="p-1 text-text-muted hover:text-white">
            <RotateCw className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(page.id)} className="p-1 text-text-muted hover:text-red-400">
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

  const handleDownload = () => {
    if (!result) return;
    if (result.blob) {
      downloadBlob(result.blob, result.filename || (file ? file.name : "organized.pdf"));
    } else if (result.url) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename || (file ? file.name : "organized.pdf");
      a.click();
    }
  };

  if (result) { return <ToolLayout title="Organize PDF" description="File siap diunduh." showFileList={false} hideDropZone={true} />; }

  return (
    <ToolLayout title="Organize PDF" description="Urutkan, hapus, atau putar halaman PDF. Drag untuk mengubah urutan." showFileList={false} hideDropZone={true}>
      {/* Pages Workspace */}
      {pages.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted"><strong className="text-text-main">{pages.length}</strong> halaman ({file?.name})</p>
            <div className="flex gap-2">
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

      {/* DropZone for uploading or replacing PDF */}
      <div className={pages.length > 0 ? "pt-6 border-t border-border" : ""}>
        {pages.length > 0 && (
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Ganti / Drag & Drop File PDF Baru:
          </p>
        )}
        <DropZone onFiles={(f) => loadPages(f[0])} accept={{ 'application/pdf': ['.pdf'] }} multiple={false} variant={pages.length > 0 ? "compact" : "default"} />
      </div>
    </ToolLayout>
  );
}





