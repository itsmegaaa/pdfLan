import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { mergePdfs } from '../../utils/clientPdf';
import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, FileText } from 'lucide-react';
import { formatFileSize } from '../../utils/fileHelpers';
import PdfPreview from '../../components/PdfPreview';

function SortableFile({ file, id, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 bg-[#1a1d27] border border-[#2d3150] rounded-xl px-4 py-3"
    >
      <button {...attributes} {...listeners} className="text-[#4a5070] hover:text-[#8b90b0] cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-12 h-16 flex-shrink-0 bg-[#22263a] rounded-lg overflow-hidden">
        <PdfPreview file={file} pageNumber={1} scale={0.15} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{file.name}</p>
        <p className="text-xs text-[#8b90b0]">{formatFileSize(file.size)}</p>
      </div>
      <button onClick={() => onRemove(index)} className="text-[#8b90b0] hover:text-red-400 transition-colors p-1">
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
              {files.map((file, i) => (
                <SortableFile
                  key={file.id}
                  file={file}
                  id={file.id}
                  index={i}
                  onRemove={(idx) => removeFile(idx)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </ToolLayout>
  );
}
