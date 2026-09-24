import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Avatars are resized client-side to a small square JPEG/PNG/WebP and stored
// inline as a data URI, so the cap here is a safety net, not the normal size.
const MAX_AVATAR_CHARS = 300_000;

const patchSchema = z.object({
  bio: z.string().trim().max(300, "A descrição pode ter no máximo 300 caracteres").nullable().optional(),
  avatar: z
    .string()
    .max(MAX_AVATAR_CHARS, "Imagem muito grande")
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Formato de imagem inválido")
    .nullable()
    .optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { bio, avatar } = parsed.data;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    },
    select: { id: true, bio: true },
  });

  return NextResponse.json({ user });
}
