"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { StarRating } from "@/components/StarRating";

type Status = "WANT_TO_READ" | "READING" | "READ" | "DROPPED";

const STATUS_LABEL: Record<Status, string> = {
  WANT_TO_READ: "Quero Ler",
  READING: "Lendo",
  READ: "Lido",
  DROPPED: "Dropado",
};

export function QuickAddModal({
  anilistId,
  title,
  image,
  volumesCount,
  onClose,
}: {
  anilistId: number;
  title: string;
  image: string | null;
  volumesCount?: number | null;
  onClose: () => void;
}) {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [status, setStatus] = useState<Status | null>(null);
  const [currentVolume, setCurrentVolume] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!status) {
      setError("Escolha um status para adicionar à sua estante.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anilistId,
          status,
          rating,
          currentVolume: status !== "READ" && currentVolume ? Number(currentVolume) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSaved(true);
      router.refresh();
      setTimeout(onClose, 700);
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-lg border border-card-border bg-card p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="book-card relative w-14 aspect-[2/3] shrink-0 bg-card">
            <div className="book-cover">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="quick-add-title" className="font-display text-lg font-bold line-clamp-2">
              {title}
            </h2>
            <p className="text-xs text-muted mt-0.5">Adicionar à sua estante</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted hover:text-accent text-xl leading-none px-1"
          >
            ×
          </button>
        </div>

        {sessionStatus !== "authenticated" ? (
          <p className="text-sm text-muted">
            <a href="/login" className="text-accent hover:underline">
              Entre na sua conta
            </a>{" "}
            para adicionar mangás à sua estante.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_LABEL) as Status[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatus(key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                      status === key
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-card-border hover:border-accent"
                    }`}
                  >
                    {STATUS_LABEL[key]}
                  </button>
                ))}
              </div>
            </div>

            {status === "READ" ? (
              <p className="text-sm text-muted">
                ✓ {volumesCount ? `Todos os ${volumesCount} volumes serão contados como lidos` : "A obra será contada como lida por completo"}
              </p>
            ) : (
              <div>
                <label htmlFor="qa-volume" className="block text-sm font-medium mb-1">
                  Volume atual
                </label>
                <input
                  id="qa-volume"
                  type="number"
                  min={1}
                  max={volumesCount ?? undefined}
                  value={currentVolume}
                  onChange={(e) => setCurrentVolume(e.target.value)}
                  placeholder="—"
                  className="w-28 rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            <div>
              <p className="block text-sm font-medium mb-1">Nota</p>
              <StarRating value={rating} onChange={setRating} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-accent">Adicionado à sua estante!</p>}

            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-md text-sm font-medium text-muted hover:bg-background"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
