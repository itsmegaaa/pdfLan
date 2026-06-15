import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * @param {{ tool: { id, name, desc, icon, route, category } }} props
 */
export default function ToolCard({ tool }) {
  return (
    <Link
      to={tool.route}
      id={`tool-card-${tool.id}`}
      className="group relative flex flex-col gap-3 p-5 rounded-2xl bg-[#1a1d27] border border-[#2d3150]
        hover:border-[#e2001a]/50 hover:bg-[#1e2235] hover:shadow-xl hover:shadow-red-900/10
        transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e2001a]/0 to-transparent opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl pointer-events-none" />

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-[#22263a] flex items-center justify-center text-2xl
        group-hover:bg-[#2d3150] transition-colors flex-shrink-0">
        {tool.icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#e2001a] transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-[#8b90b0] leading-relaxed line-clamp-2">
          {tool.desc}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex justify-end">
        <ArrowRight className="w-3.5 h-3.5 text-[#4a5070] group-hover:text-[#e2001a] group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
