import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  mangaId: z.string().min(1),
  content: z.string().trim().min(1, "O comentário não pode ficar vazio").max(1000, "O comentário pode ter no máximo 1000 caracteres"),
  spoiler: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { mangaId, content, spoiler } = parsed.data;

  const manga = await prisma.manga.findUnique({ where: { id: mangaId }, select: { id: true } });
  if (!manga) {
    return NextResponse.json({ error: "Mangá não encontrado" }, { status: 404 });
  }

  const comment = await prisma.mangaComment.create({
    data: { userId: session.user.id, mangaId, content, spoiler: spoiler ?? false },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
