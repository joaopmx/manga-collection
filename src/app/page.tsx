import { Suspense } from "react";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { MangaCard } from "@/components/MangaCard";
import { Community } from "@/components/home/Community";
import { ContinueReading } from "@/components/home/ContinueReading";
import { Discover } from "@/components/home/Discover";
import { GenreShelf } from "@/components/home/GenreShelf";
import { HeroBanner } from "@/components/home/HeroBanner";
import { SectionHeader } from "@/components/home/SectionHeader";
import { ShelfSkeleton } from "@/components/home/ShelfSkeleton";
import { cardProps } from "@/components/home/cardProps";
import { getMangaByGenreAniList, searchMangaAniList, type MangaSummary } from "@/lib/anilist";
import { BROWSABLE_GENRES, translateGenre } from "@/lib/genres";

async function Results({ q, genre }: { q: string; genre: string | null }) {
  let mangas: MangaSummary[];

  try {
    mangas = genre ? await getMangaByGenreAniList(genre) : await searchMangaAniList(q);
  } catch {
    return (
      <p className="text-sm text-red-600 mt-6">
        Não foi possível buscar mangás agora. Tente novamente em instantes.
      </p>
    );
  }

  if (mangas.length === 0) {
    return <p className="text-sm text-muted mt-6">Nenhum mangá encontrado.</p>;
  }

  return (
    <div className="shelf-grid mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
      {mangas.map((manga) => (
        <MangaCard key={manga.id} {...cardProps(manga)} showQuickAdd />
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string }>;
}) {
  const { q = "", genre = "" } = await searchParams;
  const query = q.trim();
  // Only known genres are accepted; a text search takes precedence over the genre filter.
  const activeGenre = !query && BROWSABLE_GENRES.includes(genre) ? genre : null;

  if (query || activeGenre) {
    return (
      <div>
        <Link href="/" className="text-sm text-accent hover:underline">
          ← Voltar ao início
        </Link>

        <div className="mt-2 mb-4">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {query ? `Resultados para "${query}"` : `Gênero: ${translateGenre(activeGenre!)}`}
          </h1>
          <p className="text-sm text-muted mt-1">
            {query
              ? "Adicione à sua estante e acompanhe sua leitura."
              : "Os títulos mais populares deste gênero."}
          </p>
        </div>

        <SearchBox />

        <div className="mt-4">
          <GenreShelf active={activeGenre} />
        </div>

        <Suspense fallback={<div className="mt-6"><ShelfSkeleton /></div>}>
          <Results q={query} genre={activeGenre} />
        </Suspense>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner />

      <section className="mt-10">
        <SectionHeader title="Explorar por gênero" subtitle="Escolha uma prateleira" />
        <GenreShelf />
      </section>

      <Suspense>
        <ContinueReading />
      </Suspense>

      <Suspense
        fallback={
          <div className="mt-10">
            <ShelfSkeleton />
          </div>
        }
      >
        <Discover />
      </Suspense>

      <Suspense>
        <Community />
      </Suspense>
    </div>
  );
}
