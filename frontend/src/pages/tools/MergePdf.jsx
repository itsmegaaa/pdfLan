import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { mergePdfs } from '../../utils/clientPdf';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus } from 'lucide-react';
import { formatFileSize, validateFiles, withIds } from '../../utils/fileHelpers';
import PdfThumbnail from '../../components/PdfThumbnail';
import { useRef, useState } from 'react';

function SortableFile({ file, id, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-4 bg-surface border border-border rounded-2xl px-5 py-4 hover:border-border-hover transition-colors"
    >
      <button {...attributes} {...listeners} aria-label="Seret untuk mengubah urutan" className="text-text-muted hover:text-text-main cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="w-20 h-28 flex-shrink-0 bg-bg rounded-xl overflow-hidden border border-border">
        <PdfThumbnail file={file} pageNumber={1} scale={0.4} className="w-full h-full [&_canvas]:w-full [&_canvas]:h-full [&_canvas]:object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{file.name}</p>
        <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
      </div>
      <button onClick={() => onRemove(id)} aria-label="Hapus file" className="text-text-muted hover:text-red-400 transition-colors p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function MergePdf() {
  const { files, setFiles, startProcess, setProgress, setResult, setError, removeFile } = useToolStore();
  const inputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const items = files.map(f => f.id);

  const addMore = (rawFiles) => {
    const { accepted } = validateFiles(rawFiles, { 'application/pdf': ['.pdf'] }, 50, true);
    if (accepted.length > 0) setFiles([...files, ...withIds(accepted)]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newFiles = arrayMove(files, oldIndex, newIndex);
      setFiles(newFiles);
    }
  };

  const handleProcess = async () => {
    try {
      startProcess();
      setProgress(30);
      const pdfBytes = await mergePdfs(files);
      setProgress(90);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name });
    } catch (err) {
      setError(err.message || 'Gagal menggabungkan PDF');
    }
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Gabungkan beberapa file PDF menjadi satu. Drag untuk mengubah urutan."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={true}
      onProcess={handleProcess}
      actionLabel="Gabungkan PDF"
      showFileList={false}
    >
      {files.length > 0 && (
        <div
          className={`mt-4 rounded-3xl transition-all ${isDragActive ? 'ring-2 ring-primary bg-primary/5 p-4' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); if (e.dataTransfer.files?.length) addMore(Array.from(e.dataTransfer.files)); }}
        >
          <input
            type="file" ref={inputRef} className="hidden" accept=".pdf" multiple
            onChange={(e) => { if (e.target.files?.length) addMore(Array.from(e.target.files)); e.target.value = null; }}
          />
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {files.map((file) => (
                  <SortableFile
                    key={file.id}
                    file={file}
                    id={file.id}
                    onRemove={(fileId) => removeFile(fileId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-3 w-full py-4 border-2 border-dashed border-border hover:border-primary rounded-2xl text-text-muted hover:text-primary text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah file {isDragActive && <span className="text-primary font-semibold">— lepas di sini</span>}
          </button>
        </div>
      )}
    </ToolLayout>
  );
}

