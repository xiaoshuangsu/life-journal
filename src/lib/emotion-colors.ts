/**
 * Unified emotion color palette — single source of truth for the entire app.
 *
 * Usage:
 *   badge:  `bg-${color}-500/20 text-${color}-400`  (Journal tags, calendar preview)
 *   dot:    `bg-${color}-400`                        (sidebar mood indicator)
 *   cell:   `bg-${color}-400/30`                     (calendar day cell background)
 */

export type EmotionColor = {
  tailwind: string;   // e.g. "emerald" — used to build Tailwind classes
  hex: string;        // e.g. "#34d399"
  label: string;      // display name
};

export const EMOTION_COLORS: Record<string, EmotionColor> = {
  // ── Positive ──
  happy:      { tailwind: "emerald",  hex: "#34d399", label: "Happy" },
  excited:    { tailwind: "amber",    hex: "#fbbf24", label: "Excited" },
  grateful:   { tailwind: "teal",     hex: "#2dd4bf", label: "Grateful" },
  hopeful:    { tailwind: "sky",      hex: "#38bdf8", label: "Hopeful" },
  peaceful:   { tailwind: "cyan",     hex: "#22d3ee", label: "Peaceful" },
  content:    { tailwind: "green",    hex: "#4ade80", label: "Content" },
  motivated:  { tailwind: "lime",     hex: "#a3e635", label: "Motivated" },
  proud:      { tailwind: "yellow",   hex: "#facc15", label: "Proud" },

  // ── Neutral ──
  calm:       { tailwind: "blue",     hex: "#60a5fa", label: "Calm" },
  reflective: { tailwind: "indigo",   hex: "#818cf8", label: "Reflective" },
  nostalgic:  { tailwind: "fuchsia",  hex: "#e879f9", label: "Nostalgic" },
  confused:   { tailwind: "purple",   hex: "#a78bfa", label: "Confused" },

  // ── Negative ──
  anxious:    { tailwind: "orange",   hex: "#fb923c", label: "Anxious" },
  sad:        { tailwind: "violet",   hex: "#a78bfa", label: "Sad" },
  tired:      { tailwind: "zinc",     hex: "#a1a1aa", label: "Tired" },
  angry:      { tailwind: "red",      hex: "#f87171", label: "Angry" },
  frustrated: { tailwind: "rose",     hex: "#fb7185", label: "Frustrated" },
  stressed:   { tailwind: "red",      hex: "#ef4444", label: "Stressed" },
  lonely:     { tailwind: "stone",    hex: "#a8a29e", label: "Lonely" },
  overwhelmed:{ tailwind: "pink",     hex: "#f472b6", label: "Overwhelmed" },
};

/** Fallback for unknown emotions */
const FALLBACK: EmotionColor = { tailwind: "zinc", hex: "#71717a", label: "Unknown" };

/** Get the color entry for an emotion name (case-insensitive). */
export function getEmotionColor(name: string): EmotionColor {
  return EMOTION_COLORS[name.toLowerCase()] ?? FALLBACK;
}

/** Tailwind badge classes: bg-{color}-500/20 text-{color}-400 */
export function badgeClasses(name: string): string {
  const c = getEmotionColor(name);
  return `bg-${c.tailwind}-500/20 text-${c.tailwind}-400`;
}

/** Calendar cell background opacity */
const CELL_OPACITY = 0.35;

/** Convert hex to rgba for inline style (bypasses Tailwind JIT dynamic class issue) */
export function cellBgStyle(name: string): React.CSSProperties {
  const c = getEmotionColor(name);
  return { backgroundColor: `${c.hex}${Math.round(CELL_OPACITY * 255).toString(16).padStart(2, "0")}` };
}

/** Tailwind dot class: bg-{color}-400 */
export function dotClass(name: string): string {
  const c = getEmotionColor(name);
  return `bg-${c.tailwind}-400`;
}
