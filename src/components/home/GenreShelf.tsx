import Link from "next/link";
import { BROWSABLE_GENRES, translateGenre } from "@/lib/genres";

// Each genre is a "book spine" with a colored edge, cycling through the theme's tones.
const SPINE_EDGES = [
  "border-l-accent",
  "border-l-shelf-wood",
  "border-l-muted",
  "border-l-shelf-wood-dark",
];

export function GenreShelf({ active }: { active?: string | null }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {BROWSABLE_GENRES.map((genre, i) => {
        const isActive = genre === active;
        return (
          <li key={genre}>
            <Link
              href={`/?genre=${encodeURIComponent(genre)}`}
              aria-current={isActive ? "page" : undefined}
              className={`block rounded-sm border border-l-[6px] px-3.5 py-1.5 font-display text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isActive
                  ? "border-accent bg-accent text-accent-foreground"
                  : `border-card-border bg-card hover:border-accent ${SPINE_EDGES[i % SPINE_EDGES.length]}`
              }`}
            >
              {translateGenre(genre)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
