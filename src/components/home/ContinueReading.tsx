import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReadingProgressRow } from "@/components/ReadingProgressRow";
import { SectionHeader } from "@/components/home/SectionHeader";

const LIMIT = 4;

/** The signed-in reader's latest "Lendo" entries with their progress bars. */
export async function ContinueReading() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const entries = await prisma.libraryEntry.findMany({
    where: { userId, status: "READING" },
    orderBy: { updatedAt: "desc" },
    take: LIMIT,
    include: {
      manga: {
        select: { anilistId: true, title: true, titleEnglish: true, coverImage: true, volumesCount: true },
      },
    },
  });
  if (entries.length === 0) return null;

  return (
    <section className="mt-10">
      <SectionHeader
        title="Continue lendo"
        subtitle="De onde você parou"
        action={
          <Link href={`/u/${userId}`} className="text-sm text-accent hover:underline">
            Ver minha estante →
          </Link>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map((entry) => (
          <ReadingProgressRow
            key={entry.id}
            manga={entry.manga}
            currentVolume={entry.currentVolume}
            isOwner
          />
        ))}
      </div>
    </section>
  );
}
