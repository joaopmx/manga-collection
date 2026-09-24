"use client";

import Link from "next/link";
import { useState } from "react";
import { QuickAddModal } from "@/components/QuickAddModal";

export function MangaCard({
  anilistId,
  title,
  image,
  score,
  badge,
  volumesCount,
  showQuickAdd = false,
}: {
  anilistId: number;
  title: string;
  image: string | null;
  score?: number | null;
  badge?: string;
  volumesCount?: number | null;
  showQuickAdd?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="pb-3">
      <Link href={`/manga/${anilistId}`} className="group block">
        <div className="book-card relative aspect-[2/3] bg-card">
          <div className="book-cover">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
            )}
            {badge && (
              <span className="absolute top-1.5 right-1.5 rounded bg-accent text-accent-foreground text-[10px] font-semibold px-1.5 py-0.5 shadow">
                {badge}
              </span>
            )}
            {typeof score === "number" && (
              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5">
                ★ {score.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-2 flex items-start gap-1.5">
        <Link href={`/manga/${anilistId}`} className="group min-w-0 flex-1">
          <p className="text-sm font-medium font-display line-clamp-2 text-foreground group-hover:text-accent transition-colors">
            {title}
          </p>
        </Link>

        {showQuickAdd && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label={`Adicionar ${title} rapidamente à estante`}
            title="Adicionar à estante"
            className="shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold leading-none hover:bg-accent-hover transition-colors"
          >
            +
          </button>
        )}
      </div>

      {modalOpen && (
        <QuickAddModal
          anilistId={anilistId}
          title={title}
          image={image}
          volumesCount={volumesCount}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
