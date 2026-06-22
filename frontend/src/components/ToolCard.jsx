import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * @param {{ tool: { id, name, desc, icon, route, category } }} props
 */
export default function ToolCard({ tool }) {
  const isMaintenance = tool.maintenance;

  return (
    <Link
      to={isMaintenance ? "#" : tool.route}
      id={`tool-card-${tool.id}`}
      className={`group relative flex flex-col gap-3 p-5 rounded-2xl bg-[#1a1d27] border border-[#2d3150]
        transition-all duration-200 overflow-hidden
        ${isMaintenance 
          ? "opacity-60 cursor-not-allowed" 
          : "hover:border-[#e2001a]/50 hover:bg-[#1e2235] hover:shadow-xl hover:shadow-red-900/10 cursor-pointer"}`}
      onClick={(e) => isMaintenance && e.preventDefault()}
    >
      {/* Glow on hover */}
      {!isMaintenance && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#e2001a]/0 to-transparent opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl pointer-events-none" />
      )}

      {/* Maintenance Badge */}
      {isMaintenance && (
        <div className="absolute top-4 right-4 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[9px] font-bold uppercase tracking-wider rounded">
          Diperbaiki
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors
        ${isMaintenance ? "bg-[#22263a] grayscale opacity-50" : "bg-[#22263a] group-hover:bg-[#2d3150]"}`}>
        {tool.icon}
      </div>

      {/* Content */}
      <div className="flex-1 mt-1">
        <h3 className={`text-sm font-semibold mb-1 transition-colors pr-16
          ${isMaintenance ? "text-[#8b90b0]" : "text-white group-hover:text-[#e2001a]"}`}>
          {tool.name}
        </h3>
        <p className={`text-xs leading-relaxed line-clamp-2 ${isMaintenance ? "text-[#4a5070]" : "text-[#8b90b0]"}`}>
          {tool.desc}
        </p>
      </div>

      {/* Arrow */}
      {!isMaintenance && (
        <div className="flex justify-end mt-1">
          <ArrowRight className="w-3.5 h-3.5 text-[#4a5070] group-hover:text-[#e2001a] group-hover:translate-x-0.5 transition-all" />
        </div>
      )}
    </Link>
  );
}
