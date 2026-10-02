/**
 * @param {Object} props
 * @param {number} props.progress - 0 to 100
 * @param {string} [props.label]
 */
export default function ProgressBar({ progress = 0, label = 'Memproses…' }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-[#8b90b0]">{label}</span>
        <span className="text-xs font-mono font-semibold text-white">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#1c2030] rounded-sm overflow-hidden border border-[#232738]/50">
        <div
          className="h-full bg-[#e2001a] transition-all duration-200 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}
