import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureVolumesCount, getOrImportManga, withPtSynopsis } from "@/lib/manga";
import { translateGenre } from "@/lib/genres";
import { LibraryControls } from "@/components/LibraryControls";
import { MangaComments, type CommentDTO } from "@/components/MangaComments";

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ anilistId: string }>;
}) {
  const { anilistId: anilistIdParam } = await params;
  const anilistId = Number(anilistIdParam);
  if (!Number.isInteger(anilistId) || anilistId <= 0) notFound();

  let manga;
  try {
    manga = await getOrImportManga(anilistId);
  } catch {
    notFound();
  }
  manga = await ensureVolumesCount(manga);
  manga = await withPtSynopsis(manga);

  const session = await auth();

  const [libraryEntry, rawComments] = await Promise.all([
    session?.user?.id
      ? prisma.libraryEntry.findUnique({
          where: { userId_mangaId: { userId: session.user.id, mangaId: manga.id } },
        })
      : null,
    prisma.mangaComment.findMany({
      where: { mangaId: manga.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Commenters' ratings/progress live on their library entries; avatars are
  // only checked for existence here and served through /api/avatar/[userId].
  const relatedUserIds = [
    ...new Set([...rawComments.map((c) => c.userId), ...(session?.user?.id ? [session.user.id] : [])]),
  ];
  const [commenterEntries, usersWithAvatar] = await Promise.all([
    prisma.libraryEntry.findMany({
      where: { mangaId: manga.id, userId: { in: relatedUserIds } },
      select: { userId: true, rating: true, status: true, currentVolume: true },
    }),
    prisma.user.findMany({
      where: { id: { in: relatedUserIds }, avatar: { not: null } },
      select: { id: true },
    }),
  ]);
  const entryByUser = new Map(commenterEntries.map((e) => [e.userId, e]));
  const avatarUserIds = new Set(usersWithAvatar.map((u) => u.id));

  const comments: CommentDTO[] = rawComments.map((c) => {
    const entry = entryByUser.get(c.userId);
    return {
      id: c.id,
      content: c.content,
      spoiler: c.spoiler,
      dateLabel: c.createdAt.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      edited: c.updatedAt.getTime() - c.createdAt.getTime() > 2000,
      author: { id: c.user.id, name: c.user.name, hasAvatar: avatarUserIds.has(c.user.id) },
      rating: entry?.rating ?? null,
      status: entry?.status ?? null,
      currentVolume: entry?.currentVolume ?? null,
    };
  });

  const currentUser = session?.user?.id
    ? {
        id: session.user.id,
        name: session.user.name ?? "Você",
        hasAvatar: avatarUserIds.has(session.user.id),
      }
    : null;

  const authors = manga.authors?.split(", ").filter(Boolean) ?? [];
  const genres = (manga.genres?.split(", ").filter(Boolean) ?? []).map(translateGenre);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6">
        <div className="book-card relative aspect-[2/3] bg-card max-w-[200px]">
          <div className="book-cover">
            {manga.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold">{manga.titleEnglish || manga.title}</h1>
          {manga.titleEnglish && manga.titleEnglish !== manga.title && (
            <p className="text-sm text-muted">{manga.title}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted mt-2">
            {authors.length > 0 && <span>Autor(es): {authors.join(", ")}</span>}
            {manga.volumesCount && (
              <span title={manga.volumesEstimated ? "Volumes publicados até o momento (fonte: MangaUpdates)" : undefined}>
                {manga.volumesCount} volumes{manga.volumesEstimated ? " (até agora)" : ""}
              </span>
            )}
            {manga.chaptersCount && <span>{manga.chaptersCount} capítulos</span>}
            {manga.publishStatus && <span>{manga.publishStatus}</span>}
            {typeof manga.score === "number" && <span>★ {manga.score.toFixed(1)} (AniList)</span>}
          </div>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {genres.map((g) => (
                <span
                  key={g}
                  className="text-xs rounded-full border border-card-border px-2 py-0.5 text-muted"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {(manga.synopsisPt ?? manga.synopsis) && (
            <p className="text-sm text-foreground/90 mt-4 whitespace-pre-line">
              {manga.synopsisPt ?? manga.synopsis}
            </p>
          )}

          <div className="mt-4">
            <LibraryControls
              anilistId={manga.anilistId}
              mangaId={manga.id}
              isAuthenticated={!!session?.user?.id}
              initialStatus={libraryEntry?.status ?? null}
              initialRating={libraryEntry?.rating ?? null}
              initialCurrentVolume={libraryEntry?.currentVolume ?? null}
              volumesCount={manga.volumesCount}
            />
          </div>
        </div>
      </div>

      <MangaComments
        mangaId={manga.id}
        comments={comments}
        currentUser={currentUser}
        currentUserRating={libraryEntry?.rating ?? null}
      />
    </div>
  );
}
