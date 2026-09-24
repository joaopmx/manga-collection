export type StatsStatus = "WANT_TO_READ" | "READING" | "READ" | "DROPPED";

export interface StatsEntry {
  status: StatsStatus;
  rating: number | null;
  currentVolume: number | null;
  manga: {
    anilistId: number;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
    genres: string | null;
    volumesCount: number | null;
  };
}

export interface ProfileStats {
  total: number;
  byStatus: Record<StatsStatus, number>;
  volumesTraveled: number;
  ratedCount: number;
  averageRating: number | null;
  /** Ten half-star buckets: index 0 = 0.5 stars ... index 9 = 5 stars. */
  ratingBins: number[];
  topGenres: { name: string; count: number }[];
  favorite: { anilistId: number; title: string; coverImage: string | null; rating: number } | null;
}

/** Entries are expected newest-first, so ties for "favorite" go to the most recent. */
export function computeProfileStats(entries: StatsEntry[]): ProfileStats {
  const byStatus: Record<StatsStatus, number> = {
    WANT_TO_READ: 0,
    READING: 0,
    READ: 0,
    DROPPED: 0,
  };
  const ratingBins = Array<number>(10).fill(0);
  const genreCounts = new Map<string, number>();

  let volumesTraveled = 0;
  let ratingSum = 0;
  let ratedCount = 0;
  let favoriteEntry: StatsEntry | null = null;

  for (const entry of entries) {
    byStatus[entry.status]++;

    if (entry.status === "READ") {
      volumesTraveled += entry.manga.volumesCount ?? entry.currentVolume ?? 0;
    } else if (entry.status === "READING" || entry.status === "DROPPED") {
      volumesTraveled += entry.currentVolume ?? 0;
    }

    if (entry.rating != null) {
      ratedCount++;
      ratingSum += entry.rating;
      const bin = Math.min(9, Math.max(0, Math.round(entry.rating * 2) - 1));
      ratingBins[bin]++;
      if (!favoriteEntry || entry.rating > (favoriteEntry.rating ?? 0)) favoriteEntry = entry;
    }

    for (const genre of entry.manga.genres?.split(", ").filter(Boolean) ?? []) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }

  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    total: entries.length,
    byStatus,
    volumesTraveled,
    ratedCount,
    averageRating: ratedCount > 0 ? ratingSum / ratedCount : null,
    ratingBins,
    topGenres,
    favorite: favoriteEntry
      ? {
          anilistId: favoriteEntry.manga.anilistId,
          title: favoriteEntry.manga.titleEnglish || favoriteEntry.manga.title,
          coverImage: favoriteEntry.manga.coverImage,
          rating: favoriteEntry.rating as number,
        }
      : null,
  };
}
