import Link from "next/link";

export interface ReadingProgressManga {
  anilistId: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  volumesCount: number | null;
}

export function ReadingProgressRow({
  manga,
  currentVolume,
  isOwner,
}: {
  manga: ReadingProgressManga;
  currentVolume: number | null;
  isOwner: boolean;
}) {
  const title = manga.titleEnglish || manga.title;
  const total = manga.volumesCount;
  const hasTotal = typeof total === "number" && total > 0;
  const percent =
    hasTotal && currentVolume != null
      ? Math.max(0, Math.min(100, Math.round((currentVolume / total) * 100)))
      : null;

  return (
    <Link
      href={`/manga/${manga.anilistId}`}
      className="flex items-center gap-4 rounded-lg border border-card-border bg-card p-3 hover:border-accent transition-colors"
    >
      <div className="book-card relative w-14 aspect-[2/3] shrink-0 bg-card">
        <div className="book-cover">
          {manga.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={manga.coverImage} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-medium truncate">{title}</p>

        {percent !== null ? (
          <>
            <div className="mt-2 h-2 rounded-full bg-background overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-1">
              Volume {currentVolume} de {total} · {percent}%
            </p>
          </>
        ) : currentVolume != null ? (
          <p className="text-xs text-muted mt-1">Volume {currentVolume}</p>
        ) : (
          <p className="text-xs text-muted mt-1">
            {isOwner
              ? "Defina o volume atual na página do mangá para ver seu progresso"
              : "Progresso ainda não informado"}
          </p>
        )}
      </div>
    </Link>
  );
}
