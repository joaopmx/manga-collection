import { NextResponse } from "next/server";
import { searchMangaAniList, getTopMangaAniList } from "@/lib/anilist";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  try {
    const results = q ? await searchMangaAniList(q) : await getTopMangaAniList();
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível buscar mangás agora. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
