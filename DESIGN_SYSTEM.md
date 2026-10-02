# PDFVault Design System

## 1. Core Identity
PDFVault is a robust, local-first document utility. It is designed to feel like a high-performance desktop application, not a trendy SaaS marketing page. The design must communicate **privacy, speed, and reliability**.

### Anti-Slop Principles Applied:
- **No Bubbly Interfaces:** We use smaller, tighter border radii (4px to 8px) instead of generic pill-shapes or ounded-2xl for structural components to maintain a technical, utilitarian feel.
- **No Decorative Shadows:** We operate in a dark environment where borders define structure. Box-shadows are strictly reserved for modals/popovers or primary action buttons, never for standard cards.
- **Meaningful Color:** The UI is monochromatic (Zinc scale) with **Red** reserved *exclusively* for primary actions and PDF-related branding. We do not sprinkle random neon accents.
- **No "Fade-Up" Animations:** Transitions are instant or very quick (150ms) for opacity and color changes to feel snappy and local.

## 2. Design Tokens

### Colors (CSS Variables)
Defined in index.css and mapped in 	ailwind.config.js.

- --color-bg: #18181b (Zinc 900) - Main application background.
- --color-surface: #27272a (Zinc 800) - Default component background (cards, dropzones).
- --color-surface-hover: #3f3f46 (Zinc 700) - Interactive surface hover state.
- --color-border: #3f3f46 (Zinc 700) - Structural lines and dividers.
- --color-border-hover: #52525b (Zinc 600) - Focus or hover states for inputs/cards.
- --color-primary: #dc2626 (Red 600) - Primary actions (Download, Process). Matches the PDF brand color.
- --color-primary-hover: #b91c1c (Red 700) - Primary action hover.
- --color-text-main: #f4f4f5 (Zinc 100) - Primary readable text.
- --color-text-muted: #a1a1aa (Zinc 400) - Secondary text, descriptions, metadata.

### Typography
- **Font Family:** System UI stack (native feel) + Inter for consistency.
- **Scale:**
  - 	ext-2xl / 	ext-3xl: Page titles (Bold).
  - 	ext-sm: Body text (Regular).
  - 	ext-xs: Metadata (Regular).
- *Anti-Slop Rule:* No ALL-CAPS eyebrow labels. No tracking-widest. Keep it readable and direct.

### Spacing & Radius
- **Spacing:** standard Tailwind scale (4, 8, 12, 16, 24, 32px).
- **Radius:**
  - ounded (4px): Inputs, small buttons.
  - ounded-md (6px): Cards, tool items.
  - ounded-lg (8px): Major layout panels (Result hub).

## 3. Component Guidelines

### Buttons
- **Primary:** g-primary text-white font-semibold rounded-md hover:bg-primary-hover active:scale-[0.98]
- **Ghost/Secondary:** g-surface hover:bg-surface-hover border border-border text-text-main rounded-md

### Tool Cards (Grid)
- g-surface border border-border rounded-md hover:border-border-hover transition-colors
- No drop shadows.
- No hover-lift (-translate-y-1 is banned).

### Result Hub (Tool Chaining)
- A focused panel: g-surface rounded-lg border border-border p-6.
- Chain options: g-bg border border-border rounded hover:bg-surface-hover.

### Drop Zone
The standardized Drop Zone component for uploading files. Must be strictly reused across all tools.

- **Variants:**
  - default: Height 200px (min-h-[200px]). Used as the main target on a page.
  - compact: Height 120px (min-h-[120px]). Used inside forms, modals, or tight layouts.
- **States:**
  - idle: g-surface border-border border-dashed.
  - dragover: g-primary/10 border-primary border-solid text-primary (solid border implies readiness to drop).
  - error: g-red-500/10 border-red-500 border-solid.
- **Styling:**
  - ounded-md.
  - No soft shadows.
  - Single clear icon (e.g. Upload or FileUp).
  - Copy: "Pilih atau seret dokumen ke sini" + "Maksimal [X]MB per file".
