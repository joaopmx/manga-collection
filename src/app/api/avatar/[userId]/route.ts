import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Avatars live in the DB as data URIs. Serving them as real images (instead of
// inlining base64 into every page that shows a commenter) keeps pages light and
// lets browsers cache them; the ETag makes a changed avatar show up right away.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });

  const match = user?.avatar?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!user?.avatar || !match) {
    return new Response(null, { status: 404 });
  }

  const etag = `"${createHash("sha1").update(user.avatar).digest("hex")}"`;
  const headers = {
    ETag: etag,
    "Cache-Control": "public, no-cache",
    "X-Content-Type-Options": "nosniff",
  };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(Buffer.from(match[2], "base64"), {
    headers: { ...headers, "Content-Type": match[1] },
  });
}
