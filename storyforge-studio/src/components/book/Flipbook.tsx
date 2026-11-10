"use client";

import { forwardRef, useEffect, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { AGE_GROUPS } from "@/config/ageGroups";
import { getAnimationStyle } from "@/config/animationStyles";
import type { Book } from "@/types/book";

/**
 * Interactive flipbook (react-pageflip). Layout:
 *   [cover] [illus 1 | text 1] [illus 2 | text 2] ... [back cover]
 * so each story page is a two-page spread. Loaded with ssr:false.
 */

const Page = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; hard?: boolean }>(
  ({ children, className = "", hard }, ref) => (
    <div ref={ref} data-density={hard ? "hard" : "soft"} className={`storybook-page overflow-hidden ${className}`}>
      {children}
    </div>
  ),
);
Page.displayName = "Page";

/** Flipbook page index of a story page's illustration. */
export const illustrationIndex = (pageNumber: number) => 1 + (pageNumber - 1) * 2;
/** Story page shown for a given flipbook index (0 = front cover). */
export const storyPageForIndex = (index: number, pageCount: number) =>
  index <= 0 ? 0 : Math.min(pageCount, Math.floor((index - 1) / 2) + 1);

export interface FlipbookProps {
  book: Book;
  targetPage: number;
  onPageChange: (pageNumber: number) => void;
}

interface PageFlipApi {
  pageFlip(): { flip(index: number): void; getCurrentPageIndex(): number; turnToPage(i: number): void } | undefined;
}

export default function Flipbook({ book, targetPage, onPageChange }: FlipbookProps) {
  const ref = useRef<PageFlipApi>(null);
  const style = getAnimationStyle(book.config.styleId);
  const age = AGE_GROUPS[book.config.ageGroup];
  const textSize = age.id === "toddler" ? "text-2xl leading-relaxed" : age.id === "early-reader" ? "text-xl leading-relaxed" : "text-base leading-7";
  const cover = book.pages[0]?.illustration.image?.url ?? book.reference.image?.url;

  // Only follow external navigation (strip/arrows), so the book opens on its cover.
  const lastTarget = useRef(targetPage);
  useEffect(() => {
    if (lastTarget.current === targetPage) return;
    lastTarget.current = targetPage;
    const api = ref.current?.pageFlip();
    if (!api) return;
    const current = storyPageForIndex(api.getCurrentPageIndex(), book.pages.length);
    if (current === targetPage) return;
    // flip() animates a single spread; larger jumps (page strip clicks) use turnToPage.
    if (Math.abs(current - targetPage) === 1) api.flip(illustrationIndex(targetPage));
    else api.turnToPage(illustrationIndex(targetPage));
  }, [targetPage, book.pages.length]);

  return (
    <HTMLFlipBook
      ref={ref}
      className="mx-auto"
      style={{}}
      width={460}
      height={560}
      size="stretch"
      minWidth={260}
      maxWidth={640}
      minHeight={320}
      maxHeight={780}
      startPage={0}
      drawShadow
      flippingTime={700}
      usePortrait
      startZIndex={0}
      autoSize
      maxShadowOpacity={0.4}
      showCover
      mobileScrollSupport
      clickEventForward
      useMouseEvents
      swipeDistance={30}
      showPageCorners
      disableFlipByClick={false}
      onFlip={(e: { data: number }) => onPageChange(Math.max(1, storyPageForIndex(e.data, book.pages.length)))}
    >
      <Page hard className="!bg-stone-800 text-stone-50">
        <div className="flex h-full flex-col">
          {cover && <img src={cover} alt="" className="h-3/5 w-full object-cover" />}
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center" style={{ fontFamily: style.typography.fontFamily }}>
            <h2 className="text-3xl font-semibold leading-tight">{book.title}</h2>
            <p className="text-sm opacity-80">{book.logline}</p>
          </div>
        </div>
      </Page>
      {book.pages.flatMap((p) => [
        <Page key={`img-${p.pageNumber}`}>
          {p.illustration.image ? (
            <img src={p.illustration.image.url} alt={`Illustration for page ${p.pageNumber}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              {p.illustration.status === "rendering" ? "Painting…" : "Illustration pending"}
            </div>
          )}
        </Page>,
        <Page key={`txt-${p.pageNumber}`}>
          <div className="flex h-full flex-col p-8 text-stone-800 sm:p-10" style={{ fontFamily: style.typography.fontFamily }}>
            <div className="flex flex-1 items-center">
              <p className={`${textSize} whitespace-pre-line first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-semibold first-letter:leading-none first-letter:text-[var(--color-primary)]`}>
                {p.storyText}
              </p>
            </div>
            <div className="text-center text-xs tracking-widest text-stone-500">{p.pageNumber}</div>
          </div>
        </Page>,
      ])}
      <Page hard className="!bg-stone-800 text-stone-50">
        <div className="flex h-full items-center justify-center font-serif text-3xl" style={{ fontFamily: style.typography.fontFamily }}>
          The End
        </div>
      </Page>
    </HTMLFlipBook>
  );
}
