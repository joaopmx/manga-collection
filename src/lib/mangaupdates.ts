const BASE = "https://api.mangaupdates.com/v1";
const TIMEOUT_MS = 4000;
const COOLDOWN_MS = 5 * 60 * 1000;

// Community-run API; if it's unreachable, back off instead of slowing every page.
let cooldownUntil = 0;

export interface VolumeLookup {
  seriesId: string;
  volumes: number;
}

/** Lowercase, accent-free, letters/digits only — so "Jujutsu Kaisen!" equals "jujutsu kaisen". */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** MangaUpdates writes the count into its status text, e.g. "115 Volumes (Ongoing)". */
export function parseVolumes(status: string | null | undefined): number | null {
  const match = status?.match(/(\d+)\s*Volumes?/i);
  const volumes = match ? Number(match[1]) : null;
  return volumes && volumes > 0 ? volumes : null;
}

async function mu<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`MangaUpdates ${res.status}`);
  return res.json() as Promise<T>;
}

/** Volume count of a series we already know the MangaUpdates id of. */
export async function getVolumesBySeriesId(seriesId: string): Promise<number | null | undefined> {
  if (Date.now() < cooldownUntil) return undefined;
  try {
    const series = await mu<{ status?: string }>(`/series/${seriesId}`);
    return parseVolumes(series.status);
  } catch {
    cooldownUntil = Date.now() + COOLDOWN_MS;
    return undefined;
  }
}

/**
 * Finds the series by title and start year and reads its volume count.
 * Returns null when there is no confident match or no count (nothing to
 * retry soon), and undefined when the service could not be reached.
 * Requiring an exact title AND year match avoids attaching another work's data.
 */
export async function findVolumes(
  titles: string[],
  startYear: number | null
): Promise<VolumeLookup | null | undefined> {
  if (Date.now() < cooldownUntil) return undefined;

  const wanted = new Set(titles.filter(Boolean).map(normalizeTitle));
  if (wanted.size === 0) return null;

  try {
    for (const title of titles.filter(Boolean).slice(0, 2)) {
      const search = await mu<{
        results?: { hit_title?: string; record: { series_id: number; title: string; year?: string } }[];
      }>("/series/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search: title, perpage: 15 }),
      });

      const hit = search.results?.find(({ record, hit_title }) => {
        const titleMatches =
          wanted.has(normalizeTitle(record.title)) ||
          (hit_title ? wanted.has(normalizeTitle(hit_title)) : false);
        const yearMatches = startYear === null || record.year === String(startYear);
        return titleMatches && yearMatches;
      });
      if (!hit) continue;

      const seriesId = String(hit.record.series_id);
      const volumes = await getVolumesBySeriesId(seriesId);
      if (volumes === undefined) return undefined;
      return volumes ? { seriesId, volumes } : null;
    }
    return null;
  } catch {
    cooldownUntil = Date.now() + COOLDOWN_MS;
    return undefined;
  }
}
