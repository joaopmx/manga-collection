import Link from "next/link";
import {
  getHomeMangaAniList,
  STATUS_LABELS,
  type HomeManga,
  type MangaSummary,
} from "@/lib/anilist";
import { translateGenre } from "@/lib/genres";
import { Carousel } from "@/components/Carousel";
import { MangaCard } from "@/components/MangaCard";
import { SectionHeader } from "@/components/home/SectionHeader";
import { cardProps } from "@/components/home/cardProps";

function TopRatedRow({ manga, rank }: { manga: MangaSummary; rank: number }) {
  const { title, image, score } = cardProps(manga);
  const genres = manga.genres.slice(0, 2).map(translateGenre).join(" · ");
  const status = manga.status ? (STATUS_LABELS[manga.status] ?? manga.status) : null;
  const meta = [genres, manga.volumes ? `${manga.volumes} vols.` : status].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        href={`/manga/${manga.id}`}
        className="flex items-center gap-3 rounded-lg border border-card-border bg-card p-2.5 hover:border-accent transition-colors"
      >
        <span className="w-7 shrink-0 text-center font-display text-2xl font-black italic text-accent">
          {rank}
        </span>
        <div className="book-card relative w-11 aspect-[2/3] shrink-0 bg-card">
          <div className="book-cover">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">📖</div>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-medium truncate">{title}</p>
          <p className="text-xs text-muted truncate">{meta}</p>
        </div>
        {score !== null && (
          <span className="shrink-0 text-sm font-semibold tabular-nums text-accent">
            ★ {score.toFixed(1)}
          </span>
        )}
      </Link>
    </li>
  );
}

function PopularSection({ mangas }: { mangas: MangaSummary[] }) {
  return (
    <section className="mt-10">
      <SectionHeader title="Mais populares" subtitle="Os títulos mais adicionados às listas dos leitores" />
      <div className="shelf-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
        {mangas.map((manga, i) => (
          <MangaCard key={manga.id} {...cardProps(manga)} badge={`#${i + 1}`} showQuickAdd />
        ))}
      </div>
    </section>
  );
}

function RecentSection({ mangas }: { mangas: MangaSummary[] }) {
  if (mangas.length === 0) return null;

  return (
    <section className="mt-10">
      <SectionHeader
        title="Recém-adicionados"
        subtitle="Os últimos títulos que chegaram ao catálogo"
      />
      <Carousel label="Recém-adicionados">
        {mangas.map((manga) => (
          <MangaCard key={manga.id} {...cardProps(manga)} showQuickAdd />
        ))}
      </Carousel>
    </section>
  );
}

function TopRatedSection({ mangas }: { mangas: MangaSummary[] }) {
  if (mangas.length === 0) return null;

  return (
    <section className="mt-10">
      <SectionHeader title="Mais bem avaliados" subtitle="Clássicos com as maiores notas do público" />
      <ol className="grid grid-cols-1 gap-3 md:grid-flow-col md:grid-cols-2 md:grid-rows-5">
        {mangas.map((manga, i) => (
          <TopRatedRow key={manga.id} manga={manga} rank={i + 1} />
        ))}
      </ol>
    </section>
  );
}

/** The three AniList-backed sections, fed by a single request. */
export async function Discover() {
  let home: HomeManga;
  try {
    home = await getHomeMangaAniList();
  } catch {
    return (
      <p className="mt-10 text-sm text-red-600">
        Não foi possível carregar os destaques agora. Tente novamente em instantes.
      </p>
    );
  }

  return (
    <>
      <PopularSection mangas={home.popular} />
      <RecentSection mangas={home.recent} />
      <TopRatedSection mangas={home.topRated} />
    </>
  );
}
