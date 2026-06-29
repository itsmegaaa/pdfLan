import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Crop, Wand2, RotateCw, Zap, Download, Image as ImageIcon, Check } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../components/DropZone';
import useToolStore from '../../store/useToolStore';
import { downloadBlob } from '../../utils/fileHelpers';
import { detectCorners, perspectiveTransform, applyCanvasEffects } from '../../utils/scannerMath';
import { toast } from 'sonner';
import JSZip from 'jszip';

const CORNER_COLORS = ['#e05555','#5cb870','#4a9ede','#daa04e'];
const GRAB_RADIUS = 18;

const ToolLayout = ({ title, description, children }) => (
  <div className="max-w-7xl mx-auto px-4 py-10">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#8b90b0] hover:text-white mb-6 transition-colors">
      <ChevronLeft className="w-4 h-4" /> Semua Tools
    </Link>
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-[#8b90b0]">{description}</p>
    </div>
    {children}
  </div>
);

export default function ScanToPdf() {
  const { isProcessing, startProcess, setProgress, setError, reset } = useToolStore();
  const [pendingFiles, setPendingFiles] = useState([]);
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

  const currentFile = pendingFiles[0];

  useEffect(() => {
    if (!currentFile) return;
    const url = URL.createObjectURL(currentFile);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      initCanvas(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [currentFile]);

  const handleFileUpload = (uploadedFiles) => {
    const validFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
    setPendingFiles(validFiles);
    setScannedPages([]);
    setEditorState({
      corners: [], displayScale: 1, processed: false,
      brightness: 0, contrast: 0, bwMode: false, grayMode: false, threshold: 128,
      enhanceMode: true, rotation: 0
    });
    setProgress(0);
    setError(null);
  };

  const handleAppendFiles = (uploadedFiles) => {
    const validFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
    // Tambahkan file ke antrean yang sudah ada
    setPendingFiles(prev => [...prev, ...validFiles]);
    setEditorState({
      corners: [], displayScale: 1, processed: false,
      brightness: 0, contrast: 0, bwMode: false, grayMode: false, threshold: 128,
      enhanceMode: true, rotation: 0
    });
    setProgress(0);
    setError(null);
  };

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
    const imgAspect = wc.height / wc.width;
    const dispW = wrapW;
    const dispH = Math.round(wrapW * imgAspect);
    
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
      setMagnifierPos({ x: pos[0], y: pos[1] });
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
    setMagnifierPos({ x: pos[0], y: pos[1] });
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
    // Simpan gambar dengan background putih
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
    setPendingFiles(prev => prev.slice(1));
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
        downloadBlob(blob, filename);
        toast.success(`${filename} berhasil diunduh!`);
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
      }
      setScannedPages([]);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat file ekspor');
    } finally {
      useToolStore.setState({ isProcessing: false });
    }
  };

  if (!currentFile && scannedPages.length === 0) {
    return (
      <ToolLayout title="Scan to PDF" description="Perbaiki foto dokumen miring jadi PDF rapi multi-halaman.">
        <div className="max-w-2xl mx-auto">
          <DropZone onFileSelect={(f) => handleFileUpload([f])} onFiles={handleFileUpload} accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }} multiple={true} />
        </div>
      </ToolLayout>
    );
  }

  if (!currentFile && scannedPages.length > 0) {
    return (
      <ToolLayout title="Scan to PDF" description={`${scannedPages.length} halaman siap diekspor.`}>
        <div className="max-w-4xl mx-auto mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {scannedPages.map((page, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden border-2 border-[#2d3150] shadow-lg aspect-[3/4] bg-[#0f1117] flex items-center justify-center">
                <img src={page.dataUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                <div className="absolute top-2 left-2 bg-[#e2001a] text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">Hal {idx + 1}</div>
              </div>
            ))}
            <div 
              className="relative rounded-xl border-2 border-dashed border-[#2d3150] hover:border-[#e2001a] bg-[#1a1c29] flex flex-col items-center justify-center cursor-pointer aspect-[3/4]"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                input.onchange = e => handleAppendFiles(Array.from(e.target.files));
                input.click();
              }}
            >
              <span className="text-4xl text-[#2d3150]">+</span>
              <span className="text-sm text-[#8b90b0]">Tambah Halaman</span>
            </div>
          </div>
          <div className="bg-[#1a1c29] rounded-2xl p-6 border border-[#2d3150]">
            <h3 className="text-lg font-semibold text-white mb-4">Export Dokumen</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="bg-[#22263a] text-white rounded-xl px-4 py-3 border border-[#2d3150]">
                <option value="pdf">Format PDF (Gabung 1 File)</option>
                <option value="jpeg">Format JPEG (Pisah File)</option>
              </select>
              
              {exportFormat === 'jpeg' && (
                  <select value={jpegQuality} onChange={e => setJpegQuality(parseFloat(e.target.value))} className="bg-[#22263a] text-white text-sm rounded-xl px-4 py-3 border border-[#2d3150] outline-none">
                    <option value={0.92}>Kualitas Tinggi (92%)</option>
                    <option value={0.80}>Kualitas Sedang (80%)</option>
                    <option value={0.60}>Kualitas Rendah (60%)</option>
                  </select>
              )}

              <button onClick={handleExport} className="flex-1 py-3 bg-[#e2001a] hover:bg-[#b8001a] transition-colors text-white rounded-xl font-semibold">Export {scannedPages.length} Halaman</button>
            </div>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="Scan to PDF" description={`Edit Halaman ${scannedPages.length + 1} dari ${scannedPages.length + pendingFiles.length}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="flex flex-wrap items-center gap-3 mb-6 bg-[#1a1d27] p-4 rounded-2xl border border-[#2d3150]">
          <button onClick={() => { setPendingFiles([]); setScannedPages([]); reset(); }} className="px-4 py-2 bg-[#22263a] hover:bg-[#2d3150] text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Batal
          </button>
          <button onClick={() => handleAutoDetect(workCanvasRef.current)} className="px-4 py-2 bg-[#22263a] hover:bg-[#2d3150] text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Auto Deteksi
          </button>
          <button onClick={handleProcessImage} className="px-6 py-2 bg-[#e2001a] hover:bg-[#b8001a] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ml-auto shadow-lg shadow-red-900/20">
            <Zap className="w-4 h-4" /> Proses Gambar
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2d3150] rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 w-full text-[#8b90b0] text-sm">
              <ImageIcon className="w-4 h-4" /> <span>Gambar Asli</span>
            </div>
            <div ref={wrapRef} className="w-full relative overflow-hidden rounded-xl border border-[#2d3150] touch-none bg-[#0f1117]">
              <canvas
                ref={sourceCanvasRef}
                className="w-full block"
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
                  className="absolute pointer-events-none rounded-full overflow-hidden border-2 border-[#e2001a] shadow-[0_0_20px_rgba(0,0,0,0.8)] bg-[#0f1117]"
                  style={{
                    width: 100, height: 100,
                    left: magnifierPos.x > wrapRef.current?.clientWidth / 2 ? magnifierPos.x - 120 : magnifierPos.x + 20,
                    top: magnifierPos.y - 120 > 0 ? magnifierPos.y - 120 : magnifierPos.y + 20,
                    zIndex: 50
                  }}
                >
                  <canvas ref={magnifierCanvasRef} width={100} height={100} className="w-full h-full block" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1a1d27] border border-[#2d3150] rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 w-full text-[#8b90b0] text-sm">
              <Check className="w-4 h-4" /> <span>Hasil Scan</span>
            </div>
            
            <div className="w-full relative rounded-xl border border-[#2d3150] flex flex-col items-center justify-center bg-[#0f1117] overflow-hidden min-h-[300px]">
              {!editorState.processed && (
                <div className="flex flex-col items-center justify-center text-[#4a5070] gap-3 p-8 text-center">
                  <Crop className="w-10 h-10" />
                  <p className="text-sm">Atur sudut lalu klik <strong>Proses Gambar</strong></p>
                </div>
              )}
              <canvas ref={resultCanvasRef} className="max-w-full max-h-[60vh] object-contain" style={{ display: editorState.processed ? 'block' : 'none' }} />
            </div>

            {editorState.processed && (
              <div className="w-full mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer p-3 rounded-xl border border-[#2d3150] bg-[#1a1c29] hover:bg-[#22263a] transition-colors">
                    <input type="checkbox" checked={editorState.bwMode} onChange={e => setEditorState(s => ({ ...s, bwMode: e.target.checked, grayMode: false }))} className="accent-[#e2001a] w-4 h-4 rounded" />
                    Black & White
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer p-3 rounded-xl border border-[#2d3150] bg-[#1a1c29] hover:bg-[#22263a] transition-colors">
                    <input type="checkbox" checked={editorState.grayMode} onChange={e => setEditorState(s => ({ ...s, grayMode: e.target.checked, bwMode: false }))} className="accent-[#e2001a] w-4 h-4 rounded" />
                    Grayscale
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer p-3 rounded-xl border border-[#2d3150] bg-[#1a1c29] hover:bg-[#22263a] transition-colors col-span-2">
                    <input type="checkbox" checked={editorState.enhanceMode} onChange={e => setEditorState(s => ({ ...s, enhanceMode: e.target.checked }))} className="accent-[#e2001a] w-4 h-4 rounded" />
                    Auto Enhance (Sharpening)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#8b90b0] flex justify-between">Kecerahan <span>{editorState.brightness}</span></label>
                    <input type="range" min="-100" max="100" value={editorState.brightness} onChange={e => setEditorState(s => ({ ...s, brightness: parseInt(e.target.value) }))} className="w-full accent-[#e2001a]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b90b0] flex justify-between">Kontras <span>{editorState.contrast}</span></label>
                    <input type="range" min="-100" max="100" value={editorState.contrast} onChange={e => setEditorState(s => ({ ...s, contrast: parseInt(e.target.value) }))} className="w-full accent-[#e2001a]" />
                  </div>
                </div>
                
                {editorState.bwMode && (
                  <div>
                    <label className="text-xs text-[#8b90b0] flex justify-between">Ambang Batas B&W <span>{editorState.threshold}</span></label>
                    <input type="range" min="0" max="255" value={editorState.threshold} onChange={e => setEditorState(s => ({ ...s, threshold: parseInt(e.target.value) }))} className="w-full accent-[#e2001a]" />
                  </div>
                )}

                <div className="flex gap-2 mt-6 pt-4 border-t border-[#2d3150]">
                  <button onClick={rotateManual} className="px-4 py-3 bg-[#2d3150] hover:bg-[#3f4469] text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center shadow-md">
                    <RotateCw className="w-5 h-5" />
                  </button>
                  <button onClick={handleSavePage} className="flex-1 py-3 bg-[#e2001a] hover:bg-[#b8001a] text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">
                    {pendingFiles.length > 1 ? 'Simpan & Lanjut' : 'Simpan Halaman'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
