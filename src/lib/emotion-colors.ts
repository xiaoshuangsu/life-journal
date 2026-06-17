/**
 * Unified emotion color palette — single source of truth for the entire app.
 * Uses inline styles (hex values) to avoid Tailwind JIT dynamic class issues.
 */

export type EmotionColor = {
  tailwind: string;
  hex: string;
  label: string;
};

export const EMOTION_COLORS: Record<string, EmotionColor> = {
  happy:      { tailwind: "emerald",  hex: "#34d399", label: "Happy" },
  excited:    { tailwind: "amber",    hex: "#fbbf24", label: "Excited" },
  grateful:   { tailwind: "teal",     hex: "#2dd4bf", label: "Grateful" },
  hopeful:    { tailwind: "sky",      hex: "#38bdf8", label: "Hopeful" },
  peaceful:   { tailwind: "cyan",     hex: "#22d3ee", label: "Peaceful" },
  content:    { tailwind: "green",    hex: "#4ade80", label: "Content" },
  motivated:  { tailwind: "lime",     hex: "#a3e635", label: "Motivated" },
  proud:      { tailwind: "yellow",   hex: "#facc15", label: "Proud" },
  calm:       { tailwind: "blue",     hex: "#60a5fa", label: "Calm" },
  reflective: { tailwind: "indigo",   hex: "#818cf8", label: "Reflective" },
  nostalgic:  { tailwind: "fuchsia",  hex: "#e879f9", label: "Nostalgic" },
  confused:   { tailwind: "purple",   hex: "#a78bfa", label: "Confused" },
  anxious:    { tailwind: "orange",   hex: "#fb923c", label: "Anxious" },
  sad:        { tailwind: "violet",   hex: "#a78bfa", label: "Sad" },
  tired:      { tailwind: "zinc",     hex: "#a1a1aa", label: "Tired" },
  angry:      { tailwind: "red",      hex: "#f87171", label: "Angry" },
  frustrated: { tailwind: "rose",     hex: "#fb7185", label: "Frustrated" },
  stressed:   { tailwind: "red",      hex: "#ef4444", label: "Stressed" },
  lonely:     { tailwind: "stone",    hex: "#a8a29e", label: "Lonely" },
  overwhelmed:{ tailwind: "pink",     hex: "#f472b6", label: "Overwhelmed" },
};

const FALLBACK: EmotionColor = { tailwind: "zinc", hex: "#71717a", label: "Unknown" };

export function getEmotionColor(name: string): EmotionColor {
  return EMOTION_COLORS[name.toLowerCase()] ?? FALLBACK;
}

/** Badge inline style — bg at 20% opacity + text color */
export function badgeStyle(name: string): React.CSSProperties {
  const c = getEmotionColor(name);
  return {
    backgroundColor: `${c.hex}33`,
    color: c.hex,
  };
}

/** Dot inline style — solid color */
export function dotStyle(name: string): React.CSSProperties {
  const c = getEmotionColor(name);
  return { backgroundColor: c.hex };
}

/** Calendar cell inline style — 35% opacity */
export function cellBgStyle(name: string): React.CSSProperties {
  const c = getEmotionColor(name);
  return { backgroundColor: `${c.hex}59` };
}
