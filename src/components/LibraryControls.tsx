"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarRating } from "@/components/StarRating";

type Status = "WANT_TO_READ" | "READING" | "READ" | "DROPPED";

const STATUS_LABEL: Record<Status, string> = {
  WANT_TO_READ: "Quero Ler",
  READING: "Lendo",
  READ: "Lido",
  DROPPED: "Dropado",
};

export function LibraryControls({
  anilistId,
  mangaId,
  isAuthenticated,
  initialStatus,
  initialRating,
  initialCurrentVolume,
  volumesCount,
}: {
  anilistId: number;
  mangaId: string;
  isAuthenticated: boolean;
  initialStatus: Status | null;
  initialRating: number | null;
  initialCurrentVolume?: number | null;
  volumesCount?: number | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [currentVolume, setCurrentVolume] = useState<number | null>(initialCurrentVolume ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-dashed border-card-border p-4 text-sm text-muted">
        <a href="/login" className="text-accent hover:underline">
          Entre na sua conta
        </a>{" "}
        para adicionar este mangá à sua biblioteca e avaliá-lo.
      </div>
    );
  }

  async function updateEntry(next: {
    status?: Status;
    rating?: number | null;
    currentVolume?: number | null;
  }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anilistId,
          status: next.status ?? status ?? "WANT_TO_READ",
          rating: next.rating !== undefined ? next.rating : rating,
          currentVolume:
            next.currentVolume !== undefined
              ? next.currentVolume
              : status === "READ" && next.status && next.status !== "READ"
                ? null
                : currentVolume,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus(data.entry.status);
      setRating(data.entry.rating);
      setCurrentVolume(data.entry.currentVolume);
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/library/${mangaId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStatus(null);
      setRating(null);
      setCurrentVolume(null);
      router.refresh();
    } catch {
      setError("Não foi possível remover. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-card-border bg-card p-4">
      <p className="text-sm font-medium font-display mb-2">Sua biblioteca</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(STATUS_LABEL) as Status[]).map((key) => (
          <button
            key={key}
            disabled={saving}
            onClick={() => updateEntry({ status: key })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors disabled:opacity-60 ${
              status === key
                ? "bg-accent text-accent-foreground border-accent"
                : "border-card-border hover:border-accent"
            }`}
          >
            {STATUS_LABEL[key]}
          </button>
        ))}

        {status && (
          <button
            disabled={saving}
            onClick={removeEntry}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-red-700 hover:bg-red-700/10 disabled:opacity-60"
          >
            Remover
          </button>
        )}
      </div>

      {status && (
        <div className="flex flex-wrap items-center gap-4">
          {status === "READ" ? (
            <p className="text-sm text-muted">
              ✓ {volumesCount ? `Todos os ${volumesCount} volumes lidos` : "Obra lida por completo"}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <label htmlFor="currentVolume" className="text-sm text-muted">
                Volume atual:
              </label>
              <input
                id="currentVolume"
                type="number"
                min={1}
                max={volumesCount ?? undefined}
                disabled={saving}
                value={currentVolume ?? ""}
                onChange={(e) =>
                  updateEntry({ currentVolume: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="—"
                className="w-16 rounded-md border border-card-border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {volumesCount && <span className="text-xs text-muted">de {volumesCount}</span>}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Sua nota:</span>
            <StarRating
              value={rating}
              onChange={(next) => updateEntry({ rating: next })}
              disabled={saving}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
