import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { StarDisplay } from "@/components/StarRating";
import { SectionHeader } from "@/components/home/SectionHeader";

const COMMENTS_LIMIT = 4;
const READERS_LIMIT = 5;

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function avatarSrc(userId: string, avatarIds: Set<string>) {
  return avatarIds.has(userId) ? `/api/avatar/${userId}` : null;
}

/** Community pulse: totals, the latest comments and the readers with the biggest shelves. */
export async function Community() {
  const [users, titles, ratings, commentsTotal, recentComments, topReaders] = await Promise.all([
    prisma.user.count(),
    prisma.manga.count({ where: { libraryEntries: { some: {} } } }),
    prisma.libraryEntry.count({ where: { rating: { not: null } } }),
    prisma.mangaComment.count(),
    prisma.mangaComment.findMany({
      orderBy: { createdAt: "desc" },
      take: COMMENTS_LIMIT,
      include: {
        user: { select: { id: true, name: true } },
        manga: { select: { anilistId: true, title: true, titleEnglish: true } },
      },
    }),
    prisma.user.findMany({
      where: { libraryEntries: { some: {} } },
      orderBy: { libraryEntries: { _count: "desc" } },
      take: READERS_LIMIT,
      select: { id: true, name: true, _count: { select: { libraryEntries: true } } },
    }),
  ]);
  if (users === 0) return null;

  // Ratings live on the commenter's library entry; avatars are only checked for
  // existence here and served through /api/avatar/[userId].
  const relatedUserIds = [
    ...new Set([...recentComments.map((c) => c.user.id), ...topReaders.map((u) => u.id)]),
  ];
  const [commenterEntries, usersWithAvatar] = await Promise.all([
    recentComments.length
      ? prisma.libraryEntry.findMany({
          where: {
            userId: { in: recentComments.map((c) => c.userId) },
            mangaId: { in: recentComments.map((c) => c.mangaId) },
          },
          select: { userId: true, mangaId: true, rating: true },
        })
      : [],
    prisma.user.findMany({
      where: { id: { in: relatedUserIds }, avatar: { not: null } },
      select: { id: true },
    }),
  ]);
  const ratingByKey = new Map(commenterEntries.map((e) => [`${e.userId}:${e.mangaId}`, e.rating]));
  const avatarIds = new Set(usersWithAvatar.map((u) => u.id));

  const stats = [
    { value: users, label: plural(users, "leitor", "leitores") },
    { value: titles, label: plural(titles, "título na estante", "títulos nas estantes") },
    { value: ratings, label: plural(ratings, "avaliação", "avaliações") },
    { value: commentsTotal, label: plural(commentsTotal, "comentário", "comentários") },
  ];

  return (
    <section className="mt-10">
      <SectionHeader title="Na comunidade" subtitle="O que os leitores andam fazendo por aqui" />

      <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ value, label }) => (
          <div key={label} className="rounded-lg border border-card-border bg-card p-3 text-center">
            <dd className="font-display text-3xl font-black tabular-nums text-accent">
              {value.toLocaleString("pt-BR")}
            </dd>
            <dt className="text-xs text-muted">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div>
          <h3 className="mb-2 font-display text-lg font-semibold">Comentários recentes</h3>
          {recentComments.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhum comentário ainda. Abra uma obra e seja o primeiro!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentComments.map((comment) => {
                const rating = ratingByKey.get(`${comment.userId}:${comment.mangaId}`) ?? null;
                const profileHref = `/u/${comment.user.id}`;
                return (
                  <article
                    key={comment.id}
                    className="flex gap-3 rounded-lg border border-card-border bg-card p-3"
                  >
                    <Link
                      href={profileHref}
                      aria-label={`Ver perfil de ${comment.user.name}`}
                      className="shrink-0 self-start rounded-full hover:ring-2 hover:ring-accent transition-shadow"
                    >
                      <Avatar
                        src={avatarSrc(comment.user.id, avatarIds)}
                        name={comment.user.name}
                        framed={false}
                        className="w-10 h-10"
                        initialClassName="text-base"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <Link
                          href={profileHref}
                          className="font-display font-bold hover:text-accent hover:underline"
                        >
                          {comment.user.name}
                        </Link>{" "}
                        <span className="text-muted">comentou em</span>{" "}
                        <Link
                          href={`/manga/${comment.manga.anilistId}`}
                          className="font-medium hover:text-accent hover:underline"
                        >
                          {comment.manga.titleEnglish || comment.manga.title}
                        </Link>
                      </p>

                      {rating !== null && (
                        <span className="mt-0.5 inline-flex items-center gap-1">
                          <StarDisplay value={rating} />
                          <span className="text-xs text-muted tabular-nums">{rating}</span>
                        </span>
                      )}

                      {comment.spoiler ? (
                        <p className="mt-1 text-sm italic text-muted">
                          ⚠ Este comentário contém spoiler. Abra a obra para ler.
                        </p>
                      ) : (
                        <p className="mt-1 line-clamp-3 whitespace-pre-line break-words text-sm text-foreground/90">
                          {comment.content}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-muted">
                        {comment.createdAt.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {topReaders.length > 0 && (
          <div>
            <h3 className="mb-2 font-display text-lg font-semibold">Maiores estantes</h3>
            <ul className="flex flex-col gap-2">
              {topReaders.map((reader) => {
                const count = reader._count.libraryEntries;
                return (
                  <li key={reader.id}>
                    <Link
                      href={`/u/${reader.id}`}
                      className="flex items-center gap-3 rounded-lg border border-card-border bg-card p-2.5 hover:border-accent transition-colors"
                    >
                      <Avatar
                        src={avatarSrc(reader.id, avatarIds)}
                        name={reader.name}
                        framed={false}
                        className="w-10 h-10"
                        initialClassName="text-base"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display font-medium">{reader.name}</p>
                        <p className="text-xs text-muted">
                          {count} {plural(count, "obra", "obras")}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
