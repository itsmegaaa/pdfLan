import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { splitPdfByRange, splitPdfEveryN } from '../../utils/clientPdf';
import PdfPreview from '../../components/PdfPreview';

export default function SplitPdf() {
  const { files, startProcess, setProgress, setResult, setError } = useToolStore();
  const [mode, setMode] = useState('range'); // 'range' | 'every'
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);
  
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState(new Set());

  // Load PDF to get page count
  useEffect(() => {
    if (files[0]) {
      files[0].arrayBuffer()
        .then(bytes => PDFDocument.load(bytes))
        .then(doc => {
          setPageCount(doc.getPageCount());
        })
        .catch(console.error);
    } else {
      setPageCount(0);
      setRangeInput('');
      setSelectedPages(new Set());
    }
  }, [files]);

  const parseRange = (str) => {
    const pages = new Set();
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) pages.add(i);
        }
      } else {
        const num = Number(part);
        if (num) pages.add(num);
      }
    }
    return pages;
  };

  const formatRange = (pagesSet) => {
    const pages = Array.from(pagesSet).sort((a, b) => a - b);
    if (pages.length === 0) return '';
    const ranges = [];
    let start = pages[0];
    let end = pages[0];
    for (let i = 1; i < pages.length; i++) {
      if (pages[i] === end + 1) {
        end = pages[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = pages[i];
        end = pages[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(', ');
  };

  const togglePage = (pageNum) => {
    if (mode !== 'range') return;
    const newSet = new Set(selectedPages);
    if (newSet.has(pageNum)) {
      newSet.delete(pageNum);
    } else {
      newSet.add(pageNum);
    }
    setSelectedPages(newSet);
    setRangeInput(formatRange(newSet));
  };

  const handleRangeInputChange = (e) => {
    const val = e.target.value;
    setRangeInput(val);
    setSelectedPages(parseRange(val));
  };

  const handleProcess = async () => {
    if (!files.length) return;
    try {
      startProcess();
      setProgress(20);
      const file = files[0];
      let parts;
      if (mode === 'range') {
        parts = await splitPdfByRange(file, rangeInput || '1');
      } else {
        parts = await splitPdfEveryN(file, everyN);
      }
      setProgress(70);

      if (parts.length === 1) {
        const blob = new Blob([parts[0]], { type: 'application/pdf' });
        setResult({ blob, filename: files[0].name });
      } else {
        const zip = new JSZip();
        parts.forEach((bytes, i) => zip.file(`part_${i + 1}.pdf`, bytes));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setProgress(95);
        setResult({ blob: zipBlob, filename: files[0].name.replace(/\.[^/.]+$/, "") + "_split.zip" });
      }
    } catch (err) {
      setError(err.message || 'Gagal memisahkan PDF');
    }
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Pisahkan halaman PDF berdasarkan range atau setiap N halaman."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Pisahkan PDF"
      options={
        <div className="space-y-6">
          <div className="flex gap-3">
            {[{ v: 'range', label: 'Berdasarkan Range' }, { v: 'every', label: 'Setiap N Halaman' }].map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                  ${mode === v ? 'bg-[#e2001a] text-white' : 'bg-[#22263a] text-[#8b90b0] hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'range' ? (
            <div>
              <label className="block text-sm text-[#8b90b0] mb-2">Range halaman (contoh: 1-3, 5, 7-9)</label>
              <input
                type="text"
                value={rangeInput}
                onChange={handleRangeInputChange}
                placeholder="1-3, 5, 7-9"
                className="w-full px-4 py-2.5 bg-[#22263a] border border-[#2d3150] rounded-xl text-white placeholder-[#4a5070]
                  focus:outline-none focus:border-[#e2001a]/50 text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-[#8b90b0] mb-2">Pisahkan setiap {everyN} halaman</label>
              <input
                type="number"
                min={1}
                value={everyN}
                onChange={(e) => setEveryN(Math.max(1, Number(e.target.value)))}
                className="w-32 px-4 py-2.5 bg-[#22263a] border border-[#2d3150] rounded-xl text-white
                  focus:outline-none focus:border-[#e2001a]/50 text-sm"
              />
            </div>
          )}

          {files[0] && pageCount > 0 && (
            <div className="mt-6 pt-4 border-t border-[#2d3150]">
              <p className="text-sm font-medium text-white mb-1">Pratinjau Halaman</p>
              <p className="text-xs text-[#8b90b0] mb-4">
                {mode === 'range' ? 'Klik halaman untuk memilih/menghapus dari range' : `Visualisasi pemisahan setiap ${everyN} halaman`}
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {Array.from({ length: pageCount }).map((_, i) => {
                  const pageNum = i + 1;
                  let isSelected = false;
                  
                  if (mode === 'range') {
                    isSelected = selectedPages.has(pageNum);
                  } else {
                    // Logic to visually distinguish groups of N
                    const groupIndex = Math.floor((pageNum - 1) / everyN);
                    isSelected = groupIndex % 2 === 0;
                  }

                  return (
                    <div
                      key={pageNum}
                      onClick={() => togglePage(pageNum)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all ${mode === 'range' ? 'cursor-pointer hover:border-[#e2001a]/50' : ''}
                        ${isSelected ? 'border-[#e2001a]' : 'border-[#2d3150]'}`}
                    >
                      <div className={`p-1 ${isSelected ? 'bg-[#e2001a]/10' : 'bg-[#22263a]'}`}>
                        <PdfPreview file={files[0]} pageNumber={pageNum} scale={0.2} className="w-full h-auto" />
                      </div>
                      <div className={`absolute bottom-0 left-0 right-0 text-center text-[10px] py-0.5 font-bold
                        ${isSelected ? 'bg-[#e2001a] text-white' : 'bg-black/60 text-[#8b90b0]'}`}>
                        {pageNum}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
