import Link from "next/link";
import type { ProfileStats } from "@/lib/profileStats";
import { RatingSpines } from "@/components/RatingSpines";
import { translateGenre } from "@/lib/genres";

const STATUS_TILES: { key: keyof ProfileStats["byStatus"]; label: string }[] = [
  { key: "WANT_TO_READ", label: "Quero ler" },
  { key: "READING", label: "Lendo" },
  { key: "READ", label: "Lidos" },
  { key: "DROPPED", label: "Dropados" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-muted mb-2">
      {children}
    </h3>
  );
}

export function ProfileStatsPanel({ stats }: { stats: ProfileStats }) {
  if (stats.total === 0) {
    return (
      <p className="text-sm text-muted">
        A estante ainda está vazia — as estatísticas aparecem conforme os mangás são adicionados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionTitle>Na estante</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_TILES.map((tile) => (
            <div
              key={tile.key}
              className="rounded-md border border-card-border bg-card px-3 py-2"
            >
              <p className="font-display text-2xl font-bold leading-none">
                {stats.byStatus[tile.key]}
              </p>
              <p className="text-xs text-muted mt-1">{tile.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-card-border bg-card px-3 py-2">
          <p className="font-display text-2xl font-bold leading-none text-accent">
            {stats.volumesTraveled}
          </p>
          <p className="text-xs text-muted mt-1">volumes percorridos</p>
        </div>
        <div className="rounded-md border border-card-border bg-card px-3 py-2">
          <p className="font-display text-2xl font-bold leading-none text-accent">
            {stats.averageRating !== null ? `★ ${stats.averageRating.toFixed(1)}` : "—"}
          </p>
          <p className="text-xs text-muted mt-1">nota média</p>
        </div>
      </div>

      {stats.ratedCount > 0 && (
        <div>
          <SectionTitle>Lombadas por nota</SectionTitle>
          <RatingSpines bins={stats.ratingBins} />
        </div>
      )}

      {stats.topGenres.length > 0 && (
        <div>
          <SectionTitle>Gêneros favoritos</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {stats.topGenres.map((genre) => (
              <span
                key={genre.name}
                className="text-xs rounded-full border border-card-border bg-card px-2.5 py-1"
              >
                {translateGenre(genre.name)} <span className="text-muted">· {genre.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.favorite && (
        <div>
          <SectionTitle>Livro de cabeceira</SectionTitle>
          <Link
            href={`/manga/${stats.favorite.anilistId}`}
            className="group flex items-center gap-3 rounded-md border border-card-border bg-card p-2 hover:border-accent transition-colors"
          >
            <div className="book-card relative w-12 aspect-[2/3] shrink-0 bg-card">
              <div className="book-cover">
                {stats.favorite.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stats.favorite.coverImage}
                    alt={stats.favorite.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">📖</div>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-display font-medium text-sm line-clamp-2 group-hover:text-accent">
                {stats.favorite.title}
              </p>
              <p className="text-xs text-accent mt-0.5">★ {stats.favorite.rating}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
