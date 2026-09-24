import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrImportManga } from "@/lib/manga";

const statusEnum = z.enum(["WANT_TO_READ", "READING", "READ", "DROPPED"]);

const ratingSchema = z
  .number()
  .min(0.5)
  .max(5)
  .refine((v) => Number.isInteger(v * 2), "A nota deve ser em passos de meia estrela")
  .nullable()
  .optional();

const upsertSchema = z.object({
  anilistId: z.number().int().positive(),
  status: statusEnum,
  rating: ratingSchema,
  currentVolume: z.number().int().positive().nullable().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const parsedStatus = statusEnum.safeParse(status);

  const entries = await prisma.libraryEntry.findMany({
    where: {
      userId: session.user.id,
      ...(parsedStatus.success ? { status: parsedStatus.data } : {}),
    },
    include: { manga: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { anilistId, status, rating, currentVolume } = parsed.data;

  try {
    const manga = await getOrImportManga(anilistId);

    // A finished work counts as fully read: every volume, no manual count needed.
    const effectiveVolume =
      status === "READ" ? (manga.volumesCount ?? currentVolume) : currentVolume;

    const entry = await prisma.libraryEntry.upsert({
      where: { userId_mangaId: { userId: session.user.id, mangaId: manga.id } },
      update: {
        status,
        ...(rating !== undefined ? { rating } : {}),
        ...(effectiveVolume !== undefined ? { currentVolume: effectiveVolume } : {}),
      },
      create: {
        userId: session.user.id,
        mangaId: manga.id,
        status,
        rating: rating ?? null,
        currentVolume: effectiveVolume ?? null,
      },
      include: { manga: true },
    });

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar na biblioteca agora." },
      { status: 502 }
    );
  }
}
