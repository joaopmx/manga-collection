"use client";

import { useState } from "react";
import { MangaCard } from "@/components/MangaCard";
import { ReadingProgressRow } from "@/components/ReadingProgressRow";

type Status = "WANT_TO_READ" | "READING" | "READ" | "DROPPED";

interface EntryDTO {
  id: string;
  status: Status;
  rating: number | null;
  currentVolume: number | null;
  manga: {
    anilistId: number;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
    volumesCount: number | null;
  };
}

const TABS: { key: Status; label: string }[] = [
  { key: "WANT_TO_READ", label: "Quero Ler" },
  { key: "READING", label: "Lendo" },
  { key: "READ", label: "Lidos" },
  { key: "DROPPED", label: "Dropados" },
];

export function ProfileTabs({
  entries,
  isOwner = false,
}: {
  entries: EntryDTO[];
  isOwner?: boolean;
}) {
  const [active, setActive] = useState<Status>("WANT_TO_READ");

  const grouped: Record<Status, EntryDTO[]> = {
    WANT_TO_READ: [],
    READING: [],
    READ: [],
    DROPPED: [],
  };
  for (const entry of entries) grouped[entry.status].push(entry);

  const current = grouped[active];

  return (
    <div>
      <div className="flex gap-2 border-b border-card-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              active === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-accent"
            }`}
          >
            {tab.label} ({grouped[tab.key].length})
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <p className="text-sm text-muted">Nenhum mangá nesta lista ainda.</p>
      ) : active === "READING" ? (
        <div className="flex flex-col gap-3">
          {current.map((entry) => (
            <ReadingProgressRow
              key={entry.id}
              manga={entry.manga}
              currentVolume={entry.currentVolume}
              isOwner={isOwner}
            />
          ))}
        </div>
      ) : (
        <div className="shelf-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
          {current.map((entry) => (
            <MangaCard
              key={entry.id}
              anilistId={entry.manga.anilistId}
              title={entry.manga.titleEnglish || entry.manga.title}
              image={entry.manga.coverImage}
              badge={entry.rating ? `★ ${entry.rating}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
