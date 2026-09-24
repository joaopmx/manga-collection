const ENDPOINT = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t";
const CHUNK_SIZE = 1500;
const TIMEOUT_MS = 5000;
const COOLDOWN_MS = 5 * 60 * 1000;

// If the (unofficial, keyless) endpoint is down or rate-limiting us, stop
// trying for a while so pages don't each wait out the timeout.
let cooldownUntil = 0;

// Groups whole lines into chunks so paragraph breaks survive translation.
export function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const line of text.split("\n")) {
    // A single very long line is split on sentence ends instead.
    const pieces = line.length > CHUNK_SIZE ? line.split(/(?<=[.!?…])\s+/) : [line];
    for (const piece of pieces) {
      if (current && current.length + piece.length + 1 > CHUNK_SIZE) {
        chunks.push(current);
        current = piece;
      } else {
        current = current ? current + "\n" + piece : piece;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(chunk: string): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ q: chunk }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Translate failed (${res.status})`);

  const data = (await res.json()) as [[string, string][]];
  return data[0].map((segment) => segment[0]).join("");
}

/**
 * Machine-translates English text to Brazilian Portuguese. Returns null on any
 * failure so callers can fall back to the original text.
 */
export async function translateToPtBr(text: string | null): Promise<string | null> {
  if (!text?.trim()) return null;
  if (Date.now() < cooldownUntil) return null;

  try {
    const translated: string[] = [];
    for (const chunk of splitIntoChunks(text)) {
      translated.push(await translateChunk(chunk));
    }
    let result = translated.join("\n").replace(/[ \t]+\n/g, "\n").trim();

    // AniList credits publishers as "(Source: Name)"; keep the name untouched.
    const source = text.match(/\(Source:\s*([^)]+)\)/)?.[1];
    if (source) result = result.replace(/\(Fonte:[^)]*\)/, `(Fonte: ${source})`);

    return result || null;
  } catch {
    cooldownUntil = Date.now() + COOLDOWN_MS;
    return null;
  }
}
