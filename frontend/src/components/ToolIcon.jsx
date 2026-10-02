import { CATEGORY_COLORS } from "../constants/tools";

/**
 * Render icon tool dari constants/tools.js (komponen Lucide, bukan emoji).
 * @param {boolean} [props.colored] - pakai warna kategori
 */
export function ToolIcon({ tool, className = "w-4 h-4", colored = false }) {
  const Icon = tool?.icon;
  if (!Icon) return null;
  const c = colored ? CATEGORY_COLORS[tool?.category]?.text || "" : "";
  return <Icon className={`${c} ${className}`.trim()} aria-hidden />;
}

/**
 * Badge ikon berwarna per kategori — biar grid tool kelihatan hidup.
 * @param {"sm"|"md"|"lg"} [props.size]
 */
export function ToolIconBadge({ tool, size = "md", className = "" }) {
  const c = CATEGORY_COLORS[tool?.category] || { text: "text-text-muted", bg: "bg-surface", border: "border-border" };
  const sizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };
  return (
    <span
      className={`flex items-center justify-center rounded-md border flex-shrink-0 ${c.bg} ${c.border} ${sizes[size] || sizes.md} ${className}`}
    >
      <ToolIcon tool={tool} className={`${c.text} w-4 h-4`} />
    </span>
  );
}

export default ToolIcon;
