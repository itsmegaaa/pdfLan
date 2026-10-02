import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Crop, Wand2, RotateCw, Zap, Download, Image as ImageIcon, Check } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { downloadBlob } from '../../utils/fileHelpers';
import { detectCorners, perspectiveTransform, applyCanvasEffects } from '../../utils/scannerMath';
import { toast } from 'sonner';

const CORNER_COLORS = ['#e05555','#5cb870','#4a9ede','#daa04e'];
const GRAB_RADIUS = 18;

export default function ScanToPdf() {
  const { files, setFiles, isProcessing, startProcess, setProgress, setError, reset, setResult } = useToolStore();
  const [scannedPages, setScannedPages] = useState([]);
  
  const [editorState, setEditorState] = useState({
    corners: [],
    displayScale: 1,
    processed: false,
    brightness: 0,
    contrast: 0,
    bwMode: false,
    grayMode: false,
    threshold: 128,
    enhanceMode: true,
    rotation: 0
  });

  const [cvLoaded, setCvLoaded] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [jpegQuality, setJpegQuality] = useState(0.92);

  const imgRef = useRef(null);
  const workCanvasRef = useRef(null);
  const transformedCanvasRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const wrapRef = useRef(null);
  const magnifierCanvasRef = useRef(null);
  const draggingCorner = useRef(-1);

  useEffect(() => {
    if (document.getElementById('opencv-js')) {
      setCvLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.id = 'opencv-js';
    script.async = true;
    script.onload = () => {
      if (window.cv && window.cv.Mat) setCvLoaded(true);
      else {
        window.Module = window.Module || {};
        window.Module.onRuntimeInitialized = () => setCvLoaded(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  const currentFile = files[0];

  useEffect(() => {
    if (!currentFile) return;
    const url = URL.createObjectURL(currentFile);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      initCanvas(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [currentFile]);

  const initCanvas = (img) => {
    const maxWork = 2000;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (Math.max(w, h) > maxWork) {
      const s = maxWork / Math.max(w, h);
      w = Math.round(w * s); h = Math.round(h * s);
    }
    
    const wc = document.createElement('canvas');
    wc.width = w; wc.height = h;
    wc.getContext('2d').drawImage(img, 0, 0, w, h);
    workCanvasRef.current = wc;

    const m = Math.round(Math.min(w, h) * 0.03);
    setEditorState(s => ({
      ...s,
      corners: [[m,m],[w-m,m],[w-m,h-m],[m,h-m]],
      processed: false
    }));

    setTimeout(() => handleAutoDetect(wc), 100);
  };

  useEffect(() => {
    if (!workCanvasRef.current || !sourceCanvasRef.current || !wrapRef.current) return;
    const wc = workCanvasRef.current;
    const sc = sourceCanvasRef.current;
    
    const wrapW = wrapRef.current.clientWidth;
    const maxH = window.innerHeight * 0.65; // Max height to fit on screen
    const imgAspect = wc.height / wc.width;
    
    let dispW = wrapW;
    let dispH = Math.round(wrapW * imgAspect);
    
    if (dispH > maxH) {
      dispH = maxH;
      dispW = Math.round(maxH / imgAspect);
    }
    
    sc.width = dispW;
    sc.height = dispH;
    const scale = dispW / wc.width;
    setEditorState(s => ({ ...s, displayScale: scale }));

    const ctx = sc.getContext('2d');
    ctx.drawImage(wc, 0, 0, dispW, dispH);

    const toDisp = (pt) => [pt[0] * scale, pt[1] * scale];
    if (editorState.corners.length !== 4) return;
    const dc = editorState.corners.map(toDisp);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(dispW,0); ctx.lineTo(dispW,dispH); ctx.lineTo(0,dispH); ctx.closePath();
    ctx.moveTo(dc[0][0], dc[0][1]);
    for(let i=1; i<4; i++) ctx.lineTo(dc[i][0], dc[i][1]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill('evenodd');

    ctx.beginPath();
    ctx.moveTo(dc[0][0], dc[0][1]);
    for(let i=1; i<4; i++) ctx.lineTo(dc[i][0], dc[i][1]);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(237,233,224,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    ctx.setLineDash([]);
    for(let i=0; i<4; i++) {
      const [cx, cy] = dc[i];
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = CORNER_COLORS[i];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }, [editorState.corners, workCanvasRef.current]);

  const getEventPos = (e) => {
    const rect = sourceCanvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return [clientX - rect.left, clientY - rect.top];
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const pos = getEventPos(e);
    const scale = editorState.displayScale;
    let grabbed = -1;
    for(let i=0; i<4; i++) {
      const dp = [editorState.corners[i][0] * scale, editorState.corners[i][1] * scale];
      const dist = Math.hypot(pos[0] - dp[0], pos[1] - dp[1]);
      if (dist < GRAB_RADIUS) grabbed = i;
    }
    draggingCorner.current = grabbed;
    if (grabbed >= 0) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setMagnifierPos({ x: clientX, y: clientY });
      updateMagnifier(pos, scale);
    }
  };

  const updateMagnifier = (pos, scale) => {
    if (!workCanvasRef.current || !magnifierCanvasRef.current) return;
    const wc = workCanvasRef.current;
    const ctx = magnifierCanvasRef.current.getContext('2d');
    const magSize = 100;
    
    const origX = pos[0] / scale;
    const origY = pos[1] / scale;
    const zoom = 2.5;
    const sSize = magSize / zoom;
    
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, magSize, magSize);
    
    ctx.drawImage(wc, origX - sSize / 2, origY - sSize / 2, sSize, sSize, 0, 0, magSize, magSize);
    
    ctx.strokeStyle = '#e2001a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(magSize/2 - 10, magSize/2); ctx.lineTo(magSize/2 + 10, magSize/2);
    ctx.moveTo(magSize/2, magSize/2 - 10); ctx.lineTo(magSize/2, magSize/2 + 10);
    ctx.stroke();
  };

  const onPointerMove = (e) => {
    if (draggingCorner.current < 0) return;
    e.preventDefault();
    const pos = getEventPos(e);
    const scale = editorState.displayScale;
    const wc = workCanvasRef.current;
    
    setEditorState(s => {
      const newCorners = [...s.corners];
      newCorners[draggingCorner.current] = [
        Math.max(0, Math.min(wc.width, pos[0] / scale)),
        Math.max(0, Math.min(wc.height, pos[1] / scale))
      ];
      return { ...s, corners: newCorners };
    });
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setMagnifierPos({ x: clientX, y: clientY });
    updateMagnifier(pos, scale);
  };

  const onPointerUp = () => { 
    draggingCorner.current = -1; 
    setMagnifierPos(null);
  };

  const handleAutoDetect = (wc) => {
    if (!cvLoaded) {
      setError('Menunggu OpenCV dimuat... Silakan coba lagi.');
      return;
    }
    startProcess();
    setTimeout(() => {
      try {
        const corners = detectCorners(wc);
        setEditorState(s => ({ ...s, corners }));
        setProgress(100);
        useToolStore.setState({ isProcessing: false });
      } catch (err) {
        setError('Deteksi otomatis gagal');
      }
    }, 100);
  };

  const handleProcessImage = () => {
    if (!workCanvasRef.current) return;
    startProcess();
    setTimeout(() => {
      try {
        transformedCanvasRef.current = perspectiveTransform(workCanvasRef.current, editorState.corners);
        setEditorState(s => ({ ...s, processed: true }));
        updateResultCanvas();
        setProgress(100);
        useToolStore.setState({ isProcessing: false });
      } catch (err) {
        setError('Gagal meluruskan dokumen');
      }
    }, 100);
  };

  const updateResultCanvas = (state = editorState) => {
    if (!transformedCanvasRef.current || !resultCanvasRef.current) return;
    applyCanvasEffects(
      transformedCanvasRef.current,
      resultCanvasRef.current,
      state.brightness, state.contrast, 
      state.bwMode, state.grayMode, state.threshold, 
      state.enhanceMode, state.rotation
    );
  };

  useEffect(() => {
    if (editorState.processed) updateResultCanvas(editorState);
  }, [editorState.brightness, editorState.contrast, editorState.bwMode, editorState.grayMode, editorState.threshold, editorState.enhanceMode, editorState.rotation, editorState.processed]);

  const rotateManual = () => {
    setEditorState(s => ({ ...s, rotation: (s.rotation + 90) % 360 }));
  };

  const handleSavePage = () => {
    if (!resultCanvasRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = resultCanvasRef.current.width;
    canvas.height = resultCanvasRef.current.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(resultCanvasRef.current, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const newPage = { dataUrl, width: canvas.width, height: canvas.height };
    setScannedPages(prev => [...prev, newPage]);
    setFiles(files.slice(1));
    setEditorState({
      corners: [], displayScale: 1, processed: false,
      brightness: 0, contrast: 0, bwMode: false, grayMode: false, threshold: 128,
      enhanceMode: true, rotation: 0
    });
    setProgress(0);
  };

  const handleExport = async () => {
    if (scannedPages.length === 0) return;
    startProcess();
    try {
      if (exportFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        for (const pageData of scannedPages) {
          const imgBytes = await fetch(pageData.dataUrl).then(res => res.arrayBuffer());
          const image = await pdfDoc.embedJpg(imgBytes);
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const filename = `scanned_docs_${Date.now()}.pdf`;
        setResult({ blob, filename }); // This triggers the ToolLayout Result Screen with Chaining!
      } else {
        // JPEG format - export individually
        for (let idx = 0; idx < scannedPages.length; idx++) {
          const page = scannedPages[idx];
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = page.width;
              canvas.height = page.height;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              
              const a = document.createElement('a');
              a.href = canvas.toDataURL('image/jpeg', jpegQuality);
              a.download = `scanned_page_${idx + 1}_${Date.now()}.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              resolve();
            };
            img.src = page.dataUrl;
          });
        }
        toast.success(`${scannedPages.length} halaman JPEG berhasil diunduh!`);
        useToolStore.setState({ isProcessing: false });
      }
      setScannedPages([]);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat file ekspor');
      useToolStore.setState({ isProcessing: false });
    }
  };

  if (!currentFile && scannedPages.length === 0) {
    return (
      <ToolLayout title="Scan to PDF" description="Perbaiki foto dokumen miring jadi PDF rapi multi-halaman." accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }} multiple={true} showFileList={false}>
      </ToolLayout>
    );
  }

  if (!currentFile && scannedPages.length > 0) {
    return (
      <ToolLayout title="Scan to PDF" description={`${scannedPages.length} halaman siap diekspor.`} showFileList={false} hideDropZone={true}>
        <div className="max-w-4xl mx-auto mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {scannedPages.map((page, idx) => (
              <div key={idx} className="relative rounded-md overflow-hidden border-2 border-border shadow-lg aspect-[3/4] bg-bg flex items-center justify-center">
                <img src={page.dataUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                <div className="absolute top-2 left-2 bg-primary text-text-main text-xs font-bold px-2 py-1 rounded-md shadow-md">Hal {idx + 1}</div>
              </div>
            ))}
            <div 
              className="relative rounded-md border-2 border-dashed border-border hover:border-[#e2001a] bg-surface flex flex-col items-center justify-center cursor-pointer aspect-[3/4] transition-colors"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                input.onchange = e => {
                  const newFiles = Array.from(e.target.files);
                  setFiles([...files, ...newFiles]);
                };
                input.click();
              }}
            >
              <span className="text-4xl text-[#2d3150] mb-1">+</span>
              <span className="text-xs sm:text-sm text-text-muted text-center px-2">Klik / Drop Foto Tambahan</span>
            </div>
          </div>
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-text-main mb-4">Export Dokumen</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="bg-surface-hover text-text-main rounded-md px-4 py-3 border border-border">
                <option value="pdf">Format PDF (Gabung 1 File)</option>
                <option value="jpeg">Format JPEG (Pisah File)</option>
              </select>
              
              {exportFormat === 'jpeg' && (
                  <select value={jpegQuality} onChange={e => setJpegQuality(parseFloat(e.target.value))} className="bg-surface-hover text-text-main text-sm rounded-md px-4 py-3 border border-border outline-none">
                    <option value={0.92}>Kualitas Tinggi (92%)</option>
                    <option value={0.80}>Kualitas Sedang (80%)</option>
                    <option value={0.60}>Kualitas Rendah (60%)</option>
                  </select>
              )}

              <button onClick={handleExport} className="flex-1 py-3 bg-primary hover:bg-primary-hover transition-colors text-text-main rounded-md font-semibold">Export {scannedPages.length} Halaman</button>
            </div>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="Scan to PDF" description={`Edit Halaman ${scannedPages.length + 1} dari ${scannedPages.length + files.length}`} showFileList={false} hideDropZone={true}>
      <div className="max-w-[1400px] mx-auto px-4 py-6 mt-[-30px]">
        <header className="flex flex-wrap items-center gap-3 mb-6 bg-surface p-4 rounded-lg border border-border">
          <button onClick={() => { setFiles([]); setScannedPages([]); reset(); }} className="px-4 py-2 bg-surface-hover hover:bg-border-hover text-text-main rounded-md text-sm font-medium transition-colors flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Batal
          </button>
          {!editorState.processed && (
            <>
              <button onClick={() => handleAutoDetect(workCanvasRef.current)} className="px-4 py-2 bg-surface-hover hover:bg-border-hover text-text-main rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> Auto Deteksi
              </button>
              <button onClick={handleProcessImage} className="px-6 py-2 bg-primary hover:bg-primary-hover text-text-main rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ml-auto shadow-md shadow-red-900/20">
                <Zap className="w-4 h-4" /> Proses Gambar
              </button>
            </>
          )}
        </header>

        <div className="w-full">
          {/* CROP MODE */}
          <div className={`bg-surface border border-border rounded-lg p-4 flex-col items-center ${editorState.processed ? 'hidden' : 'flex'}`}>
            <div className="flex items-center justify-between gap-2 mb-3 w-full text-text-muted text-sm">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> <span>Gambar Asli (Sesuaikan Potongan)</span>
              </div>
            </div>
            <div ref={wrapRef} className="w-full relative overflow-hidden rounded-md border border-border touch-none bg-bg flex justify-center items-center min-h-[50vh]">
              <canvas
                ref={sourceCanvasRef}
                className="block shadow-md"
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
              />
              
              {magnifierPos && (
                <div 
                  className="fixed pointer-events-none rounded-full overflow-hidden border-2 border-[#e2001a] shadow-[0_0_20px_rgba(0,0,0,0.8)] bg-bg"
                  style={{
                    width: 100, height: 100,
                    left: magnifierPos.x > (window.innerWidth / 2) ? magnifierPos.x - 120 : magnifierPos.x + 20,
                    top: magnifierPos.y - 120 > 0 ? magnifierPos.y - 120 : magnifierPos.y + 20,
                    zIndex: 9999
                  }}
                >
                  <canvas ref={magnifierCanvasRef} width={100} height={100} className="w-full h-full block" />
                </div>
              )}
            </div>
          </div>

          {/* RESULT & FILTERS MODE */}
          <div className={`bg-surface border border-border rounded-lg p-4 flex-col items-center max-w-4xl mx-auto ${!editorState.processed ? 'hidden' : 'flex'}`}>
            <div className="flex justify-between items-center w-full mb-4 text-text-muted text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" /> <span>Hasil Scan & Filter</span>
              </div>
              <button 
                onClick={() => setEditorState(s => ({ ...s, processed: false }))}
                className="text-primary hover:text-primary-hover flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-primary/30 rounded-md bg-primary/10 transition-colors"
              >
                <Crop className="w-3 h-3" /> Edit Potongan
              </button>
            </div>
            
            <div className="w-full relative rounded-md border border-border flex flex-col items-center justify-center bg-bg overflow-hidden p-6 shadow-inner">
              <canvas ref={resultCanvasRef} className="max-w-full max-h-[70vh] object-contain shadow-lg" />
            </div>

            <div className="w-full mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <label className="flex items-center gap-2 text-sm text-text-main cursor-pointer p-3 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors">
                  <input type="checkbox" checked={editorState.bwMode} onChange={e => setEditorState(s => ({ ...s, bwMode: e.target.checked, grayMode: false }))} className="accent-[#e2001a] w-4 h-4 rounded" />
                  Black & White
                </label>
                <label className="flex items-center gap-2 text-sm text-text-main cursor-pointer p-3 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors">
                  <input type="checkbox" checked={editorState.grayMode} onChange={e => setEditorState(s => ({ ...s, grayMode: e.target.checked, bwMode: false }))} className="accent-[#e2001a] w-4 h-4 rounded" />
                  Grayscale
                </label>
                <label className="flex items-center gap-2 text-sm text-text-main cursor-pointer p-3 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors">
                  <input type="checkbox" checked={editorState.enhanceMode} onChange={e => setEditorState(s => ({ ...s, enhanceMode: e.target.checked }))} className="accent-[#e2001a] w-4 h-4 rounded" />
                  Auto Enhance
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border border-border rounded-md bg-bg/50">
                <div>
                  <label className="text-xs text-text-muted flex justify-between mb-2">Kecerahan <span>{editorState.brightness}</span></label>
                  <input type="range" min="-100" max="100" value={editorState.brightness} onChange={e => setEditorState(s => ({ ...s, brightness: parseInt(e.target.value) }))} className="w-full accent-[#e2001a]" />
                </div>
                <div>
                  <label className="text-xs text-text-muted flex justify-between mb-2">Kontras <span>{editorState.contrast}</span></label>
                  <input type="range" min="-100" max="100" value={editorState.contrast} onChange={e => setEditorState(s => ({ ...s, contrast: parseInt(e.target.value) }))} className="w-full accent-[#e2001a]" />
                </div>
                {editorState.bwMode && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-text-muted flex justify-between mb-2">Ambang Batas B&W (Threshold) <span>{editorState.threshold}</span></label>
                    <input type="range" min="0" max="255" value={editorState.threshold} onChange={e => setEditorState(s => ({ ...s, threshold: parseInt(e.target.value) }))} className="w-full accent-[#e2001a]" />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={rotateManual} className="px-5 py-3 bg-border-hover hover:bg-[#3f4469] text-text-main rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md">
                  <RotateCw className="w-5 h-5" /> Putar Kanan
                </button>
                <button onClick={handleSavePage} className="flex-1 py-3 bg-primary hover:bg-primary-hover text-text-main rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-900/20">
                  <Download className="w-5 h-5" />
                  {files.length > 1 ? 'Simpan & Lanjut ke Foto Berikutnya' : 'Simpan Halaman & Selesai'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}


