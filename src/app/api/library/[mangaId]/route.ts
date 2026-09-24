import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["WANT_TO_READ", "READING", "READ", "DROPPED"]).optional(),
  rating: z
    .number()
    .min(0.5)
    .max(5)
    .refine((v) => Number.isInteger(v * 2), "A nota deve ser em passos de meia estrela")
    .nullable()
    .optional(),
  currentVolume: z.number().int().positive().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { mangaId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const existing = await prisma.libraryEntry.findUnique({
    where: { userId_mangaId: { userId: session.user.id, mangaId } },
    include: { manga: { select: { volumesCount: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Entrada não encontrada" }, { status: 404 });
  }

  // A finished work counts as fully read: every volume, no manual count needed.
  const data =
    parsed.data.status === "READ"
      ? { ...parsed.data, currentVolume: existing.manga.volumesCount ?? parsed.data.currentVolume }
      : parsed.data;

  const entry = await prisma.libraryEntry.update({
    where: { userId_mangaId: { userId: session.user.id, mangaId } },
    data,
    include: { manga: true },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { mangaId } = await params;

  const existing = await prisma.libraryEntry.findUnique({
    where: { userId_mangaId: { userId: session.user.id, mangaId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Entrada não encontrada" }, { status: 404 });
  }

  await prisma.libraryEntry.delete({
    where: { userId_mangaId: { userId: session.user.id, mangaId } },
  });

  return NextResponse.json({ ok: true });
}
