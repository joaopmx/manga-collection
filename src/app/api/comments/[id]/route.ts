import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  content: z.string().trim().min(1, "O comentário não pode ficar vazio").max(1000, "O comentário pode ter no máximo 1000 caracteres").optional(),
  spoiler: z.boolean().optional(),
});

async function loadOwned(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }

  const existing = await prisma.mangaComment.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return { error: NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 }) };
  }
  return { existing };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await loadOwned(id);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const comment = await prisma.mangaComment.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ comment });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await loadOwned(id);
  if (error) return error;

  await prisma.mangaComment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
