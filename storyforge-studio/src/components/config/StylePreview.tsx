import type { AnimationStyle } from "@/config/animationStyles";

/** Tiny CSS-only landscape swatch that hints at each style's palette and line weight. */
export function StylePreview({ style }: { style: AnimationStyle }) {
  const { sky, ground, accent, ink } = style.palette;
  const outline =
    style.id === "saturday-morning" ? 4 : style.id === "vector-folklore" ? 3 : style.id === "golden-age-cel" ? 2 : 1;
  return (
    <div
      className="relative h-24 w-full overflow-hidden rounded-md"
      style={{ background: `linear-gradient(180deg, ${sky[0]}, ${sky[1]})` }}
      aria-hidden
    >
      <div
        className="absolute right-6 top-3 h-8 w-8 rounded-full"
        style={{ background: accent, boxShadow: `0 0 0 ${outline}px ${ink}22` }}
      />
      <div
        className="absolute -bottom-8 -left-6 h-20 w-3/4 rounded-[50%]"
        style={{ background: ground, opacity: 0.75, border: `${outline}px solid ${ink}` }}
      />
      <div
        className="absolute -bottom-10 -right-4 h-20 w-2/3 rounded-[50%]"
        style={{ background: ground, border: `${outline}px solid ${ink}` }}
      />
      {style.id === "stop-motion" && <div className="absolute inset-0 bg-[radial-gradient(transparent_50%,rgba(0,0,0,0.25))]" />}
      {style.id === "saturday-morning" && (
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(#000_1px,transparent_1.2px)] [background-size:6px_6px]" />
      )}
    </div>
  );
}
