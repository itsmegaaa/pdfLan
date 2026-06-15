import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import useToolStore from '../../store/useToolStore';
import { PDFDocument } from 'pdf-lib';

export default function PdfForms() {
  const { startProcess, setProgress, setResult, setError } = useToolStore();
  const files = useToolStore((s) => s.files);
  const [fields, setFields] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadFields = async () => {
    if (!files[0]) return;
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const form = doc.getForm();
      const detected = form.getFields().map((f) => ({
        name: f.getName(),
        type: f.constructor.name,
        value: '',
      }));
      setFields(detected);
      setLoaded(true);
    } catch {
      setFields([]);
      setLoaded(true);
    }
  };

  const handleProcess = async () => {
    if (!files[0]) return;
    try {
      startProcess();
      setProgress(30);
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const form = doc.getForm();

      fields.forEach(({ name, type, value }) => {
        try {
          if (type.includes('Text') && value) {
            form.getTextField(name).setText(value);
          } else if (type.includes('CheckBox') && value === 'true') {
            form.getCheckBox(name).check();
          }
        } catch {}
      });

      form.flatten();
      setProgress(90);
      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name });
    } catch (err) {
      setError(err.message || 'Gagal mengisi form');
    }
  };

  return (
    <ToolLayout
      title="PDF Forms"
      description="Deteksi dan isi form fields yang ada di PDF, lalu download PDF yang sudah diisi."
      accept={{ 'application/pdf': ['.pdf'] }}
      multiple={false}
      onProcess={handleProcess}
      actionLabel="Simpan & Flatten Form"
      options={
        files[0] && (
          <div className="space-y-3">
            {!loaded ? (
              <button onClick={loadFields}
                className="px-4 py-2 bg-[#22263a] hover:bg-[#2d3150] text-white rounded-xl text-sm transition-colors">
                🔍 Deteksi Form Fields
              </button>
            ) : fields.length === 0 ? (
              <p className="text-sm text-[#8b90b0]">Tidak ada form fields yang terdeteksi di PDF ini.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#8b90b0]">{fields.length} form fields ditemukan:</p>
                {fields.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-[#4a5070] w-40 truncate">{f.name}</span>
                    <span className="text-xs text-[#4a5070] bg-[#22263a] px-2 py-0.5 rounded">{f.type.replace('PDF', '')}</span>
                    {f.type.includes('CheckBox') ? (
                      <input type="checkbox"
                        onChange={(e) => setFields((p) => p.map((x, j) => j === i ? { ...x, value: String(e.target.checked) } : x))}
                        className="accent-[#e2001a]" />
                    ) : (
                      <input type="text" value={f.value} placeholder="Isi nilai..."
                        onChange={(e) => setFields((p) => p.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                        className="flex-1 px-3 py-1.5 bg-[#22263a] border border-[#2d3150] rounded-lg text-white text-sm focus:outline-none focus:border-[#e2001a]/50" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }
    />
  );
}
