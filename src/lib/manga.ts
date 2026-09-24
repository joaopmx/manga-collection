import { prisma } from "@/lib/prisma";
import { getMangaByIdAniList, stripHtml, STATUS_LABELS, type AniListManga } from "@/lib/anilist";
import { translateToPtBr } from "@/lib/translate";
import { findVolumes, getVolumesBySeriesId, type VolumeLookup } from "@/lib/mangaupdates";
import type { Manga } from "@prisma/client";

function toLocalData(anilist: AniListManga) {
  return {
    title: anilist.title.romaji,
    titleEnglish: anilist.title.english,
    synopsis: stripHtml(anilist.description),
    coverImage: anilist.coverImage?.extraLarge ?? anilist.coverImage?.large ?? null,
    authors: anilist.staff?.edges.map((e) => e.node.name.full).join(", ") || null,
    genres: anilist.genres?.join(", ") || null,
    volumesCount: anilist.volumes,
    startYear: anilist.startDate?.year ?? null,
    chaptersCount: anilist.chapters,
    publishStatus: anilist.status ? STATUS_LABELS[anilist.status] ?? anilist.status : null,
    score: typeof anilist.averageScore === "number" ? anilist.averageScore / 10 : null,
  };
}

/**
 * Returns the local Manga row for a given AniList id, importing it from the
 * AniList API on first access. Later reads are served from the local
 * database so we don't hit the API's rate limits on every page view.
 */
export async function getOrImportManga(anilistId: number) {
  const existing = await prisma.manga.findUnique({ where: { anilistId } });
  if (existing) return existing;

  const anilistManga = await getMangaByIdAniList(anilistId);
  const data = toLocalData(anilistManga);

  const created = await prisma.manga.create({ data: { anilistId, ...data } });
  return ensureVolumesCount(created, anilistManga);
}

/**
 * Adds a Brazilian Portuguese synopsis, translating (and caching in the DB) on
 * first view. Falls back to the original English text if translation fails.
 */
export async function withPtSynopsis<
  T extends { id: string; synopsis: string | null; synopsisPt: string | null },
>(manga: T): Promise<T> {
  if (manga.synopsisPt || !manga.synopsis) return manga;

  const synopsisPt = await translateToPtBr(manga.synopsis);
  if (!synopsisPt) return manga;

  await prisma.manga.update({ where: { id: manga.id }, data: { synopsisPt } });
  return { ...manga, synopsisPt };
}

const VOLUME_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * AniList leaves the volume count empty for works still being published, so
 * we fall back to MangaUpdates, which reports how many volumes are out so far.
 * Those counts grow over time, so estimated values are re-checked weekly (and
 * AniList takes over once it publishes a final count).
 */
export async function ensureVolumesCount(manga: Manga, prefetched?: AniListManga): Promise<Manga> {
  const needsCount = manga.volumesCount == null || manga.volumesEstimated;
  if (!needsCount) return manga;

  const stale =
    !manga.volumesCheckedAt || Date.now() - manga.volumesCheckedAt.getTime() > VOLUME_REFRESH_MS;
  if (!prefetched && !stale) return manga;

  let anilist = prefetched ?? null;
  if (!anilist) {
    try {
      anilist = await getMangaByIdAniList(manga.anilistId);
    } catch {
      return manga;
    }
  }

  const now = new Date();
  const publishStatus = anilist.status ? (STATUS_LABELS[anilist.status] ?? anilist.status) : null;
  const startYear = anilist.startDate?.year ?? null;

  if (anilist.volumes) {
    return prisma.manga.update({
      where: { id: manga.id },
      data: {
        volumesCount: anilist.volumes,
        volumesEstimated: false,
        volumesCheckedAt: now,
        publishStatus,
        startYear,
      },
    });
  }

  let lookup: VolumeLookup | null | undefined;
  if (manga.mangaUpdatesId) {
    const volumes = await getVolumesBySeriesId(manga.mangaUpdatesId);
    lookup =
      volumes === undefined
        ? undefined
        : volumes
          ? { seriesId: manga.mangaUpdatesId, volumes }
          : null;
  } else {
    lookup = await findVolumes(
      [anilist.title.romaji, anilist.title.english ?? "", ...(anilist.synonyms ?? [])],
      startYear
    );
  }

  // Service unreachable: leave things as they are and try again on a later visit.
  if (lookup === undefined) return manga;

  return prisma.manga.update({
    where: { id: manga.id },
    data: {
      volumesCheckedAt: now,
      publishStatus,
      startYear,
      ...(lookup
        ? { volumesCount: lookup.volumes, volumesEstimated: true, mangaUpdatesId: lookup.seriesId }
        : {}),
    },
  });
}
