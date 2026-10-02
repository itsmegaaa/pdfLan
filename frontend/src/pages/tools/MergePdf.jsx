import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { mergePdfs } from '../../utils/clientPdf';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { formatFileSize } from '../../utils/fileHelpers';
import PdfThumbnail from '../../components/PdfThumbnail';

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

  const items = files.map(f => f.id);

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
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="mt-4 space-y-2">
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
      )}
    </ToolLayout>
  );
}

