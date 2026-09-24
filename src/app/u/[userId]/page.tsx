import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeProfileStats } from "@/lib/profileStats";
import { ProfileTabs } from "@/components/ProfileTabs";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { EditProfileButton } from "@/components/EditProfileButton";
import { Avatar } from "@/components/Avatar";
import { ProfileStatsPanel } from "@/components/ProfileStatsPanel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return { title: user ? `${user.name} — Mangá Collection` : "Perfil — Mangá Collection" };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, bio: true, avatar: true, createdAt: true },
  });
  if (!user) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === user.id;

  const entries = await prisma.libraryEntry.findMany({
    where: { userId: user.id },
    include: {
      manga: {
        select: {
          anilistId: true,
          title: true,
          titleEnglish: true,
          coverImage: true,
          volumesCount: true,
          genres: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const stats = computeProfileStats(entries);

  const memberSince = user.createdAt.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-8 items-start">
      <aside className="flex flex-col gap-5">
        <div className="flex flex-col items-center lg:items-start gap-3 text-center lg:text-left">
          <Avatar src={user.avatar} name={user.name} />

          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">{user.name}</h1>
            <p className="text-sm text-muted mt-1">Membro desde {memberSince}</p>
          </div>

          {user.bio ? (
            <p className="text-sm text-foreground/90 whitespace-pre-line">{user.bio}</p>
          ) : (
            isOwner && (
              <p className="text-sm text-muted italic">
                Você ainda não escreveu uma descrição. Clique em “Editar perfil” para adicionar.
              </p>
            )
          )}

          {isOwner && (
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              <EditProfileButton
                name={user.name}
                initialBio={user.bio}
                initialAvatar={user.avatar}
              />
              <CopyLinkButton />
            </div>
          )}
          {isOwner && (
            <p className="text-xs text-muted">
              Seu perfil é público: qualquer pessoa com o link pode ver sua estante.
            </p>
          )}
        </div>

        <div className="border-t border-card-border pt-5">
          <ProfileStatsPanel stats={stats} />
        </div>
      </aside>

      <section className="min-w-0">
        <ProfileTabs entries={entries} isOwner={isOwner} />
      </section>
    </div>
  );
}
