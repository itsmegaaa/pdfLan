/**
 * Render icon tool dari constants/tools.js (komponen Lucide, bukan emoji).
 */
export default function ToolIcon({ tool, className = "w-4 h-4" }) {
  const Icon = tool?.icon;
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}
