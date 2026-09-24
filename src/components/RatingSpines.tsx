"use client";

import { useState } from "react";

/** Rating histogram drawn as a row of book spines — taller spine = more books with that rating. */
export function RatingSpines({ bins }: { bins: number[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...bins, 1);

  const readout = (() => {
    if (active === null) return "Passe o mouse sobre uma lombada";
    const stars = (active + 1) / 2;
    const count = bins[active];
    return `★ ${stars} · ${count} ${count === 1 ? "mangá" : "mangás"}`;
  })();

  return (
    <div onMouseLeave={() => setActive(null)}>
      <p
        className={`text-xs h-4 mb-1 transition-colors ${
          active === null ? "text-muted" : "text-accent font-medium"
        }`}
        aria-live="polite"
      >
        {readout}
      </p>

      <div className="flex items-end gap-1 h-16 px-1 border-b-4 border-shelf-wood-dark">
        {bins.map((count, i) => {
          const stars = (i + 1) / 2;
          const isActive = active === i;
          const dimmed = active !== null && !isActive;

          return (
            <div
              key={i}
              role="img"
              tabIndex={0}
              aria-label={`${stars} ${stars === 1 ? "estrela" : "estrelas"}: ${count} ${count === 1 ? "mangá" : "mangás"}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="flex-1 h-full flex items-end cursor-pointer outline-none"
            >
              <div
                className={`w-full rounded-t-sm transition-all duration-150 ${
                  isActive ? "bg-foreground" : "bg-accent"
                }`}
                style={{
                  height: `${count === 0 ? 6 : 12 + (count / max) * 88}%`,
                  opacity: isActive
                    ? 1
                    : dimmed
                      ? 0.25
                      : count === 0
                        ? 0.2
                        : 0.55 + (count / max) * 0.45,
                  transform: isActive ? "scaleY(1.04)" : undefined,
                  transformOrigin: "bottom",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-muted mt-1 px-1">
        <span>½★</span>
        <span>5★</span>
      </div>
    </div>
  );
}
