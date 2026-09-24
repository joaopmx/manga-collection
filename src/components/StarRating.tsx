"use client";

import { useEffect, useRef, useState } from "react";

const CLICK_DELAY_MS = 220;

const STAR_PATH =
  "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.6l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96z";

export function Star({ fraction, sizeClass }: { fraction: number; sizeClass: string }) {
  return (
    <span className={`relative block ${sizeClass}`}>
      <svg viewBox="0 0 24 24" className={`block ${sizeClass} text-card-border`}>
        <path d={STAR_PATH} fill="currentColor" />
      </svg>
      {/*
        The colored overlay must render at the SAME fixed size as the
        background star and only be cropped by the shrinking width below —
        sizing it to the clipped container's width (e.g. w-full) would
        squash the star icon instead of revealing just its left portion.
      */}
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${fraction * 100}%` }}
      >
        <svg viewBox="0 0 24 24" className={`block ${sizeClass} text-accent`}>
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

export function StarRating({
  value,
  onChange,
  disabled = false,
  size = "md",
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const display = hoverValue ?? value ?? 0;
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-6 h-6";

  const pendingClick = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (pendingClick.current) clearTimeout(pendingClick.current);
  }, []);

  // A single click and a double click both fire onClick first (browsers emit
  // click, click, dblclick in that order), so we delay the single-star commit
  // just long enough for a following dblclick to cancel it — otherwise both
  // requests would race and whichever response lands last would win.
  function handleClick(i: number) {
    if (pendingClick.current) clearTimeout(pendingClick.current);
    pendingClick.current = setTimeout(() => {
      pendingClick.current = null;
      onChange(i);
    }, CLICK_DELAY_MS);
  }

  function handleDoubleClick(i: number) {
    if (pendingClick.current) {
      clearTimeout(pendingClick.current);
      pendingClick.current = null;
    }
    onChange(i - 0.5);
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="inline-flex items-center gap-0.5"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const fraction = Math.max(0, Math.min(1, display - (i - 1)));
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onMouseEnter={() => setHoverValue(i)}
              onClick={() => handleClick(i)}
              onDoubleClick={(e) => {
                e.preventDefault();
                handleDoubleClick(i);
              }}
              title={`${i - 0.5} ou ${i} estrelas (duplo clique para meia estrela)`}
              aria-label={`Avaliar com ${i} estrelas`}
              className={`${sizeClass} shrink-0 disabled:cursor-not-allowed transition-transform hover:scale-110`}
            >
              <Star fraction={fraction} sizeClass={sizeClass} />
            </button>
          );
        })}
      </div>

      {value != null && (
        <>
          <span className="text-sm text-muted tabular-nums">{value}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remover nota"
              className="text-xs text-muted hover:text-red-600"
            >
              ×
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Read-only star row (supports half stars), for showing someone's rating. */
export function StarDisplay({
  value,
  sizeClass = "w-3.5 h-3.5",
}: {
  value: number;
  sizeClass?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Nota ${value} de 5 estrelas`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} fraction={Math.max(0, Math.min(1, value - (i - 1)))} sizeClass={sizeClass} />
      ))}
    </span>
  );
}
