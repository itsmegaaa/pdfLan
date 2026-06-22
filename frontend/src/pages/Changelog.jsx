import ReactMarkdown from 'react-markdown';
import changelogRaw from '../../../docs/CHANGELOG.md?raw';
import { Link } from 'react-router-dom';

export default function Changelog() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#8b90b0] hover:text-white mb-6 transition-colors">← Kembali ke Beranda</Link>
      
      <div className="bg-[#1a1d27] border border-[#2d3150] rounded-2xl p-6 md:p-10 shadow-xl shadow-black/20">
        <h1 className="text-3xl font-bold text-white mb-8 border-b border-[#2d3150] pb-4">
          Changelog <span className="text-[#e2001a]">pdfLan</span>
        </h1>
        
        <div className="prose prose-invert prose-red max-w-none 
          prose-headings:font-bold prose-headings:text-white
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#2d3150]/50
          prose-h3:text-lg prose-h3:text-[#e2001a] prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-[#8b90b0] prose-p:leading-relaxed
          prose-ul:text-[#8b90b0] prose-li:my-1
          prose-strong:text-white prose-strong:font-semibold
          prose-a:text-red-400 hover:prose-a:text-red-300 transition-colors">
          <ReactMarkdown>
            {changelogRaw}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
