/**
 * Minimal line-art emotion avatars.
 * Unified style: thin strokes, rounded caps, gentle curves.
 * Palette: low-saturation, warm undertone.
 */

import { getEmotionColor } from "@/lib/emotion-colors";

type EmotionAvatarProps = {
  emotion: string | null | undefined;
  size?: number;
  plain?: boolean; // no background circle
};

const STROKE = "#8B8A96";
const STROKE_WIDTH = 1.6;
const CAP = "round";
const JOIN = "round";

/** Color dot classes for plain inline mode */
const DOT_COLORS: Record<string, { bg: string; darkBg: string }> = {
  happy:      { bg: "bg-emerald-400/80",     darkBg: "dark:bg-emerald-500/70" },
  excited:    { bg: "bg-amber-400/80",       darkBg: "dark:bg-amber-500/70" },
  grateful:   { bg: "bg-teal-400/80",        darkBg: "dark:bg-teal-500/70" },
  hopeful:    { bg: "bg-sky-400/80",         darkBg: "dark:bg-sky-500/70" },
  peaceful:   { bg: "bg-cyan-400/80",        darkBg: "dark:bg-cyan-500/70" },
  content:    { bg: "bg-green-400/80",       darkBg: "dark:bg-green-500/70" },
  motivated:  { bg: "bg-lime-400/80",        darkBg: "dark:bg-lime-500/70" },
  proud:      { bg: "bg-yellow-400/80",      darkBg: "dark:bg-yellow-500/70" },
  calm:       { bg: "bg-blue-400/80",        darkBg: "dark:bg-blue-500/70" },
  reflective: { bg: "bg-indigo-400/80",      darkBg: "dark:bg-indigo-500/70" },
  nostalgic:  { bg: "bg-fuchsia-400/80",     darkBg: "dark:bg-fuchsia-500/70" },
  confused:   { bg: "bg-purple-400/80",      darkBg: "dark:bg-purple-500/70" },
  anxious:    { bg: "bg-orange-400/80",      darkBg: "dark:bg-orange-500/70" },
  sad:        { bg: "bg-violet-400/80",      darkBg: "dark:bg-violet-500/70" },
  tired:      { bg: "bg-zinc-400/70",        darkBg: "dark:bg-zinc-500/60" },
  angry:      { bg: "bg-red-400/80",         darkBg: "dark:bg-red-500/70" },
  frustrated: { bg: "bg-rose-400/80",        darkBg: "dark:bg-rose-500/70" },
  stressed:   { bg: "bg-red-400/80",         darkBg: "dark:bg-red-500/70" },
  lonely:     { bg: "bg-stone-400/70",       darkBg: "dark:bg-stone-500/60" },
  overwhelmed:{ bg: "bg-pink-400/80",        darkBg: "dark:bg-pink-500/70" },
};
const DEFAULT_DOT = { bg: "bg-zinc-400/60", darkBg: "dark:bg-zinc-500/50" };

export default function EmotionAvatar({
  emotion,
  size = 48,
  plain = false,
}: EmotionAvatarProps) {
  const key = (emotion ?? "").toLowerCase();
  const emotionColor = emotion ? getEmotionColor(emotion) : null;
  const Avatar = AVATARS[key] ?? AVATARS.default;

  const svgSize = size * 0.58;

  if (plain) {
    const dot = key ? (DOT_COLORS[key] ?? DEFAULT_DOT) : DEFAULT_DOT;
    return (
      <span className={`inline-block w-3 h-3 rounded-full shrink-0 ${dot.bg} ${dot.darkBg}`} />
    );
  }

  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        backgroundColor: emotionColor ? `${emotionColor.hex}1A` : "#F1F0F5",
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        color={STROKE}
      >
        <Avatar />
      </svg>
    </div>
  );
}

type AvatarFn = () => React.ReactNode;

const AVATARS: Record<string, AvatarFn> = {
  // ── Positive ──
  happy: () => (
    <>
      <circle cx="10" cy="11" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="11" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M9 17c2 3.5 8 3.5 10 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
  excited: () => (
    <>
      <circle cx="10" cy="10" r="1.5" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="10" r="1.5" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M7 17c2 4 12 4 14 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
  grateful: () => (
    <>
      <circle cx="10" cy="11" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="11" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M9 16.5c2 2.5 8 2.5 10 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <circle cx="22" cy="8" r="0.8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </>
  ),
  hopeful: () => (
    <>
      <circle cx="10" cy="12" r="1.3" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.3" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M9 17c2 3 8 3 10 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <circle cx="14" cy="8" r="0.6" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  peaceful: () => (
    <>
      <path d="M8 11h4" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} />
      <path d="M16 11h4" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} />
      <path d="M10 17c2 2 6 2 8 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
  content: () => (
    <>
      <circle cx="10" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M10 18c1.5 2 6.5 2 8 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
  motivated: () => (
    <>
      <circle cx="10" cy="10" r="1.3" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="10" r="1.3" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M8 17c3 3.5 9 3.5 12 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
  proud: () => (
    <>
      <circle cx="10" cy="12" r="1.3" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.3" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M8 17c3 3 8 3 12 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <path d="M14 7v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap={CAP} />
    </>
  ),

  // ── Neutral ──
  calm: () => (
    <>
      <path d="M8 12h4" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} />
      <path d="M16 12h4" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} />
      <path d="M11 17c1.5 1.8 4.5 1.8 6 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} />
    </>
  ),
  reflective: () => (
    <>
      <circle cx="10" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M10 17c.8 2.5 7.2 2.5 8 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <circle cx="14" cy="8" r="0.5" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  nostalgic: () => (
    <>
      <circle cx="10" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M10 16.5c1 2 6 2 8 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <path d="M17 7l-1 2" stroke="currentColor" strokeWidth="1" strokeLinecap={CAP} />
    </>
  ),
  confused: () => (
    <>
      <circle cx="10" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M12 16.5c2 1.5 4 1.5 4.5-0.5" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <path d="M14 6.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap={CAP} />
    </>
  ),

  // ── Negative ──
  anxious: () => (
    <>
      <circle cx="10" cy="11" r="1.4" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="11" r="1.4" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M11 16c1-1.5 5-1.5 6 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <path d="M14 7.5v2" stroke="currentColor" strokeWidth="1" strokeLinecap={CAP} />
    </>
  ),
  sad: () => (
    <>
      <circle cx="10" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M10 19c2-2.5 6-2.5 8 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
  tired: () => (
    <>
      <path d="M8 12h4" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} />
      <path d="M16 12h4" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} />
      <path d="M10.5 17.5c1.5-2 5.5-2 7 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
  angry: () => (
    <>
      <circle cx="10" cy="11" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="11" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M10 18c1.8-2.5 6.2-2.5 8 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <path d="M8 8l2 2" stroke="currentColor" strokeWidth="1" strokeLinecap={CAP} />
      <path d="M18 8l-2 2" stroke="currentColor" strokeWidth="1" strokeLinecap={CAP} />
    </>
  ),
  frustrated: () => (
    <>
      <circle cx="10" cy="11" r="1.3" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="11" r="1.3" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M11 17c.8-1.5 5.2-1.5 6 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <path d="M14 6.5v1.5" stroke="currentColor" strokeWidth="1" strokeLinecap={CAP} />
    </>
  ),
  stressed: () => (
    <>
      <circle cx="10" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M10.5 17.5c1.5-2 5.5-2 7 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <path d="M12 7l-1 2M16 7l1 2" stroke="currentColor" strokeWidth="1" strokeLinecap={CAP} />
    </>
  ),
  lonely: () => (
    <>
      <circle cx="10" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M11.5 18c1-1.5 4-1.5 5 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
  overwhelmed: () => (
    <>
      <circle cx="10" cy="12" r="1.4" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.4" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M10 18c1.8-2.5 6.2-2.5 8 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
      <path d="M12 6.5l-1 1.5M16 6.5l1 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap={CAP} />
    </>
  ),

  default: () => (
    <>
      <circle cx="10" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="18" cy="12" r="1.2" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <path d="M11 17c1.5 2 4.5 2 6 0" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap={CAP} strokeLinejoin={JOIN} />
    </>
  ),
};
