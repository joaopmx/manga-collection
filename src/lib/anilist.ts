const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export interface AniListManga {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
  };
  volumes: number | null;
  chapters: number | null;
  status: string | null;
  genres: string[];
  averageScore: number | null;
  startDate: { year: number | null } | null;
  synonyms: string[];
  staff: {
    edges: { node: { name: { full: string } } }[];
  };
}

/** The subset of fields the cards and rankings on the home page need. */
export type MangaSummary = Pick<
  AniListManga,
  "id" | "title" | "coverImage" | "volumes" | "status" | "genres" | "averageScore" | "startDate"
>;

export const STATUS_LABELS: Record<string, string> = {
  FINISHED: "Finalizado",
  RELEASING: "Em publicação",
  NOT_YET_RELEASED: "Não lançado",
  CANCELLED: "Cancelado",
  HIATUS: "Hiato",
};

const MEDIA_FIELDS = `
  id
  title { romaji english }
  description
  coverImage { extraLarge large }
  volumes
  chapters
  status
  genres
  averageScore
  startDate { year }
  synonyms
  staff(perPage: 3, sort: RELEVANCE) {
    edges { node { name { full } } }
  }
`;

const SUMMARY_FIELDS = `
  id
  title { romaji english }
  coverImage { large }
  volumes
  status
  genres
  averageScore
  startDate { year }
`;

async function anilistFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Falha ao consultar a API AniList (${res.status})`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? "Erro desconhecido na API AniList");
  }
  return json.data as T;
}

export async function searchMangaAniList(query: string): Promise<AniListManga[]> {
  if (!query.trim()) return [];

  const data = await anilistFetch<{ Page: { media: AniListManga[] } }>(
    `query ($search: String) {
      Page(perPage: 18) {
        media(search: $search, type: MANGA) { ${MEDIA_FIELDS} }
      }
    }`,
    { search: query }
  );

  return data.Page.media;
}

export async function getTopMangaAniList(): Promise<AniListManga[]> {
  const data = await anilistFetch<{ Page: { media: AniListManga[] } }>(
    `query {
      Page(perPage: 18) {
        media(type: MANGA, sort: POPULARITY_DESC) { ${MEDIA_FIELDS} }
      }
    }`,
    {}
  );

  return data.Page.media;
}

export async function getMangaByIdAniList(id: number): Promise<AniListManga> {
  const data = await anilistFetch<{ Media: AniListManga }>(
    `query ($id: Int) {
      Media(id: $id, type: MANGA) { ${MEDIA_FIELDS} }
    }`,
    { id }
  );

  return data.Media;
}

export const POPULAR_LIMIT = 12;
export const TOP_RATED_LIMIT = 10;
export const RECENT_LIMIT = 15;

export interface HomeManga {
  popular: MangaSummary[];
  topRated: MangaSummary[];
  recent: MangaSummary[];
}

/**
 * Everything the home page shelves need, in a single request (GraphQL aliases)
 * so the AniList rate limit isn't spent on one call per section.
 * Adult titles are left out of these public showcases.
 */
export async function getHomeMangaAniList(): Promise<HomeManga> {
  const data = await anilistFetch<{
    popular: { media: MangaSummary[] };
    topRated: { media: MangaSummary[] };
    recent: { media: MangaSummary[] };
  }>(
    `query {
      popular: Page(perPage: ${POPULAR_LIMIT}) {
        media(type: MANGA, isAdult: false, sort: POPULARITY_DESC) { ${SUMMARY_FIELDS} }
      }
      topRated: Page(perPage: ${TOP_RATED_LIMIT}) {
        media(type: MANGA, isAdult: false, sort: SCORE_DESC, popularity_greater: 30000) { ${SUMMARY_FIELDS} }
      }
      recent: Page(perPage: ${RECENT_LIMIT * 2}) {
        media(type: MANGA, format: MANGA, isAdult: false, sort: ID_DESC) { ${SUMMARY_FIELDS} }
      }
    }`,
    {}
  );

  return {
    popular: data.popular.media,
    topRated: data.topRated.media,
    // Newly created AniList entries sometimes have no cover yet; skip those so the carousel looks right.
    recent: data.recent.media
      .filter((m) => m.coverImage?.large && !m.coverImage.large.includes("default"))
      .slice(0, RECENT_LIMIT),
  };
}

export async function getMangaByGenreAniList(genre: string): Promise<MangaSummary[]> {
  const data = await anilistFetch<{ Page: { media: MangaSummary[] } }>(
    `query ($genre: String) {
      Page(perPage: 24) {
        media(type: MANGA, isAdult: false, genre: $genre, sort: POPULARITY_DESC) { ${SUMMARY_FIELDS} }
      }
    }`,
    { genre }
  );

  return data.Page.media;
}

/** Strips the basic HTML AniList descriptions contain (<br>, <i>, <a>, etc.) down to plain text. */
export function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
