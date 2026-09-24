"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal shelf with scroll snapping. Touch and trackpad scroll natively;
 * the arrow buttons cover mouse users and disable themselves at either end.
 * Each direct child becomes one slide (see `.carousel-track` in globals.css).
 */
export function Carousel({ label, children }: { label: string; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () =>
      setEdges({
        atStart: track.scrollLeft <= 4,
        atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
      });

    track.addEventListener("scroll", update, { passive: true });
    // Fires once on observe (initial state) and again whenever the shelf is resized.
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  const arrowClass =
    "hidden sm:flex absolute top-[42%] z-[2] w-9 h-9 items-center justify-center rounded-full bg-accent text-accent-foreground text-xl leading-none shadow-md hover:bg-accent-hover transition-opacity disabled:opacity-0 disabled:pointer-events-none";

  return (
    <div className="shelf-grid relative">
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={edges.atStart}
        aria-label={`${label}: anterior`}
        className={`${arrowClass} left-1.5`}
      >
        ‹
      </button>

      <div ref={trackRef} role="region" aria-label={label} className="carousel-track">
        {children}
      </div>

      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={edges.atEnd}
        aria-label={`${label}: próximo`}
        className={`${arrowClass} right-1.5`}
      >
        ›
      </button>
    </div>
  );
}
