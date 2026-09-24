import type { MangaSummary } from "@/lib/anilist";

/** Maps an AniList result onto what MangaCard expects. */
export function cardProps(manga: MangaSummary) {
  return {
    anilistId: manga.id,
    title: manga.title.english || manga.title.romaji,
    image: manga.coverImage?.large ?? null,
    score: typeof manga.averageScore === "number" ? manga.averageScore / 10 : null,
    volumesCount: manga.volumes,
  };
}
