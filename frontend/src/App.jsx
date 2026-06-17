import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'goey-toast';
import { lazy, Suspense, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import useToolStore from './store/useToolStore';

// Pages (lazy loaded)
const Home = lazy(() => import('./pages/Home'));
const MergePdf = lazy(() => import('./pages/tools/MergePdf'));
const SplitPdf = lazy(() => import('./pages/tools/SplitPdf'));
const CompressPdf = lazy(() => import('./pages/tools/CompressPdf'));
const PdfToWord = lazy(() => import('./pages/tools/PdfToWord'));
const PdfToPowerPoint = lazy(() => import('./pages/tools/PdfToPowerPoint'));

const WordToPdf = lazy(() => import('./pages/tools/WordToPdf'));
const PowerPointToPdf = lazy(() => import('./pages/tools/PowerPointToPdf'));
const ExcelToPdf = lazy(() => import('./pages/tools/ExcelToPdf'));
const EditPdf = lazy(() => import('./pages/tools/EditPdf'));
const PdfToJpg = lazy(() => import('./pages/tools/PdfToJpg'));
const JpgToPdf = lazy(() => import('./pages/tools/JpgToPdf'));
const SignPdf = lazy(() => import('./pages/tools/SignPdf'));
const WatermarkPdf = lazy(() => import('./pages/tools/WatermarkPdf'));
const RotatePdf = lazy(() => import('./pages/tools/RotatePdf'));
const HtmlToPdf = lazy(() => import('./pages/tools/HtmlToPdf'));
const UnlockPdf = lazy(() => import('./pages/tools/UnlockPdf'));
const ProtectPdf = lazy(() => import('./pages/tools/ProtectPdf'));
const OrganizePdf = lazy(() => import('./pages/tools/OrganizePdf'));
const PdfToPdfa = lazy(() => import('./pages/tools/PdfToPdfa'));
const RepairPdf = lazy(() => import('./pages/tools/RepairPdf'));
const PageNumbers = lazy(() => import('./pages/tools/PageNumbers'));

const OcrPdf = lazy(() => import('./pages/tools/OcrPdf'));
const ComparePdf = lazy(() => import('./pages/tools/ComparePdf'));
const RedactPdf = lazy(() => import('./pages/tools/RedactPdf'));
const CropPdf = lazy(() => import('./pages/tools/CropPdf'));
const PdfForms = lazy(() => import('./pages/tools/PdfForms'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#e2001a] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function StoreResetter() {
  const location = useLocation();
  const reset = useToolStore((state) => state.reset);

  useEffect(() => {
    reset();
  }, [location.pathname, reset]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreResetter />
      <div className="min-h-screen flex flex-col bg-[#0f1117]">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/merge-pdf" element={<MergePdf />} />
              <Route path="/split-pdf" element={<SplitPdf />} />
              <Route path="/compress-pdf" element={<CompressPdf />} />
              <Route path="/pdf-to-word" element={<PdfToWord />} />
              <Route path="/pdf-to-powerpoint" element={<PdfToPowerPoint />} />

              <Route path="/word-to-pdf" element={<WordToPdf />} />
              <Route path="/powerpoint-to-pdf" element={<PowerPointToPdf />} />
              <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
              <Route path="/edit-pdf" element={<EditPdf />} />
              <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
              <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
              <Route path="/sign-pdf" element={<SignPdf />} />
              <Route path="/watermark-pdf" element={<WatermarkPdf />} />
              <Route path="/rotate-pdf" element={<RotatePdf />} />
              <Route path="/html-to-pdf" element={<HtmlToPdf />} />
              <Route path="/unlock-pdf" element={<UnlockPdf />} />
              <Route path="/protect-pdf" element={<ProtectPdf />} />
              <Route path="/organize-pdf" element={<OrganizePdf />} />
              <Route path="/pdf-to-pdfa" element={<PdfToPdfa />} />
              <Route path="/repair-pdf" element={<RepairPdf />} />
              <Route path="/page-numbers" element={<PageNumbers />} />

              <Route path="/ocr-pdf" element={<OcrPdf />} />
              <Route path="/compare-pdf" element={<ComparePdf />} />
              <Route path="/redact-pdf" element={<RedactPdf />} />
              <Route path="/crop-pdf" element={<CropPdf />} />
              <Route path="/pdf-forms" element={<PdfForms />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Toaster position="bottom-right" />
      </div>
    </BrowserRouter>
  );
}
