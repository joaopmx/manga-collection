import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/SearchBox";

const STATUS_STATS = [
  { key: "WANT_TO_READ", label: "Quero ler" },
  { key: "READING", label: "Lendo" },
  { key: "READ", label: "Lidos" },
  { key: "DROPPED", label: "Dropados" },
] as const;

async function HeroActions() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/register"
          className="rounded-md bg-nav-foreground px-4 py-2 text-sm font-semibold text-shelf-wood-dark shadow hover:bg-white transition-colors"
        >
          Criar minha estante
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-nav-foreground/60 px-4 py-2 text-sm font-semibold text-nav-foreground hover:bg-black/15 transition-colors"
        >
          Entrar
        </Link>
      </div>
    );
  }

  const groups = await prisma.libraryEntry.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const counts = new Map(groups.map((g) => [g.status, g._count._all]));
  const firstName = session.user.name?.split(" ")[0] ?? "leitor";

  return (
    <div className="mt-5">
      <p className="text-sm font-medium">Olá, {firstName}! Sua estante agora:</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {STATUS_STATS.map(({ key, label }) => (
          <li key={key}>
            <Link
              href={`/u/${userId}`}
              className="flex items-baseline gap-2 rounded-md bg-black/20 px-3 py-1.5 hover:bg-black/30 transition-colors"
            >
              <span className="font-display text-xl font-black tabular-nums">{counts.get(key) ?? 0}</span>
              <span className="text-xs uppercase tracking-wide">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HeroBanner() {
  return (
    <section className="wood-panel rounded-xl border-b-4 border-shelf-wood-dark px-5 py-8 shadow-md text-nav-foreground [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] sm:px-10 sm:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-90">
        Sua biblioteca de mangás
      </p>
      <h1 className="mt-2 font-display text-3xl font-black italic sm:text-5xl">
        Monte a sua estante
      </h1>
      <p className="mt-3 max-w-xl font-medium">
        Descubra títulos, organize o que você quer ler, está lendo, já leu ou abandonou, dê notas
        e converse sobre cada obra com outros leitores.
      </p>

      <div className="mt-5 max-w-xl [text-shadow:none]">
        <SearchBox />
      </div>

      <Suspense fallback={<div className="mt-5 h-10" />}>
        <HeroActions />
      </Suspense>
    </section>
  );
}
