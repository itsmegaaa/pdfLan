import ToolLayout from '../../components/ToolLayout';
import { useRef, useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDocument } from 'pdf-lib';
import { GripVertical, X, Plus } from 'lucide-react';
import useToolStore from '../../store/useToolStore';
import DropZone from '../../components/DropZone';
import { Link } from 'react-router-dom';
import { formatFileSize, downloadBlob, validateFiles } from '../../utils/fileHelpers';
import ProgressBar from '../../components/ProgressBar';

function SortableImage({ item, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative group bg-surface border border-border rounded-xl overflow-hidden">
      <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-black/40 rounded p-1">
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      <button onClick={() => onRemove(item.id)} aria-label={`Hapus ${item.name}`} className="absolute top-2 right-2 z-10 bg-black/40 rounded p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <X className="w-3 h-3 text-white hover:text-red-400" />
      </button>
      <img src={item.url} alt={item.name} className="w-full aspect-[3/4] object-cover" />
      <p className="text-xs text-text-muted truncate px-2 py-1">{item.name}</p>
    </div>
  );
}

export default function JpgToPdf() {
  const { startProcess, setProgress, setResult, setError, isProcessing, progress, result, reset } = useToolStore();
  const [items, setItems] = useState([]);
  const [orientation, setOrientation] = useState('auto'); // 'auto' | 'portrait' | 'landscape'
  const [margin, setMargin] = useState(0);
  const inputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const addMore = (rawFiles) => {
    const { accepted } = validateFiles(rawFiles, { 'image/*': ['.jpg', '.jpeg', '.png'] }, 50, true);
    if (accepted.length > 0) addImages(accepted);
  };

  const addImages = (files) => {
    const newItems = files.map((f, i) => ({
      id: `${f.name}-${Date.now()}-${i}`,
      file: f,
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldI = items.findIndex((x) => x.id === active.id);
      const newI = items.findIndex((x) => x.id === over.id);
      setItems(arrayMove(items, oldI, newI));
    }
  };

  const removeItem = (id) => {
    setItems((p) => {
      const removed = p.find(x => x.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return p.filter((x) => x.id !== id);
    });
  };

  const handleReset = () => {
    items.forEach(item => URL.revokeObjectURL(item.url));
    reset();
    setItems([]);
  };

  // Cleanup object URLs on unmount
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { return () => itemsRef.current.forEach(item => URL.revokeObjectURL(item.url)); }, []);

  const handleProcess = async () => {
    if (!items.length) return;
    try {
      startProcess();
      const doc = await PDFDocument.create();
      let i = 0;
      for (const item of items) {
        setProgress((i / items.length) * 90);
        const bytes = await item.file.arrayBuffer();
        let img;
        if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg') {
          img = await doc.embedJpg(bytes);
        } else {
          img = await doc.embedPng(bytes);
        }
        const { width, height } = img;
        const m = margin;
        const page = doc.addPage([width + m * 2, height + m * 2]);
        page.drawImage(img, { x: m, y: m, width, height });
        i++;
      }
      setProgress(95);
      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      setResult({ blob, filename: items[0].name.replace(/\.[^/.]+$/, "") + ".pdf" });
    } catch (err) {
      setError(err.message || 'Gagal membuat PDF');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    if (result.blob) downloadBlob(result.blob, result.filename);
  };

  if (result) { return <ToolLayout title="JPG to PDF" description="File siap diunduh." showFileList={false} hideDropZone={true} />; }

  if (isProcessing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Sedang memproses…</p>
          </div>
          <ProgressBar progress={progress} />
        </div>
      </div>
    );
  }

  return (
    <ToolLayout title="JPG to PDF" description="Upload beberapa gambar dan gabungkan menjadi satu PDF. Drag untuk mengubah urutan." showFileList={false} hideDropZone={true} onFilesAdded={addImages}>
      {items.length === 0 && (
        <DropZone onFiles={addImages} accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }} multiple={true} />
      )}

      {items.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Options */}
          <div className="p-5 bg-surface border border-border rounded-md space-y-3">
            <div>
              <label className="block text-sm text-text-muted mb-1">Margin ({margin}px)</label>
              <input type="range" min={0} max={80} step={4} value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full accent-primary" />
            </div>
          </div>

          {/* Grid */}
          <input
            type="file" ref={inputRef} className="hidden" accept=".jpg,.jpeg,.png" multiple
            onChange={(e) => { if (e.target.files?.length) addMore(Array.from(e.target.files)); e.target.value = null; }}
          />
          <div
            className={`rounded-2xl transition-all ${isDragActive ? 'ring-2 ring-primary bg-primary/5 p-3' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); if (e.dataTransfer.files?.length) addMore(Array.from(e.dataTransfer.files)); }}
          >
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((x) => x.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {items.map((item) => (
                  <SortableImage key={item.id} item={item} onRemove={removeItem} />
                ))}
                <button
                  onClick={() => inputRef.current?.click()}
                  aria-label="Tambah gambar"
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1.5 text-text-muted hover:text-primary transition-colors"
                >
                  <Plus className="w-7 h-7" />
                  <span className="text-xs font-medium">Tambah</span>
                </button>
              </div>
            </SortableContext>
          </DndContext>
          </div>

          <button onClick={handleProcess}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md transition-colors shadow-md shadow-red-900/20">
            Buat PDF ({items.length} gambar)
          </button>
        </div>
      )}
    </ToolLayout>
  );
}







