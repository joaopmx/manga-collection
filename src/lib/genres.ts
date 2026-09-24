// AniList exposes a fixed set of genres, so a static dictionary is more
// reliable (and instant) than machine-translating them.
const GENRES_PT_BR: Record<string, string> = {
  Action: "Ação",
  Adventure: "Aventura",
  Comedy: "Comédia",
  Drama: "Drama",
  Ecchi: "Ecchi",
  Fantasy: "Fantasia",
  Hentai: "Hentai",
  Horror: "Terror",
  "Mahou Shoujo": "Garota Mágica",
  Mecha: "Mecha",
  Music: "Música",
  Mystery: "Mistério",
  Psychological: "Psicológico",
  Romance: "Romance",
  "Sci-Fi": "Ficção Científica",
  "Slice of Life": "Cotidiano",
  Sports: "Esportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspense",
};

/** Falls back to the original name for any genre AniList adds later. */
export function translateGenre(name: string): string {
  return GENRES_PT_BR[name] ?? name;
}

/** Genres offered for browsing on the home page (adult genres are left out). */
export const BROWSABLE_GENRES = Object.keys(GENRES_PT_BR).filter((g) => g !== "Hentai");
