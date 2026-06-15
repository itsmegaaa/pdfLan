/**
 * @param {Object} props
 * @param {number} props.progress - 0 to 100
 * @param {string} [props.label]
 */
export default function ProgressBar({ progress = 0, label = 'Memproses…' }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[#8b90b0]">{label}</span>
        <span className="text-sm font-semibold text-white">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-[#22263a] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#e2001a] to-[#ff4d63] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}
