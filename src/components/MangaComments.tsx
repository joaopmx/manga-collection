"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { StarDisplay } from "@/components/StarRating";

type Status = "WANT_TO_READ" | "READING" | "READ" | "DROPPED";

const STATUS_LABEL: Record<Status, string> = {
  WANT_TO_READ: "Quer ler",
  READING: "Lendo",
  READ: "Leu",
  DROPPED: "Dropou",
};

const MAX_LENGTH = 1000;

export interface CommentDTO {
  id: string;
  content: string;
  spoiler: boolean;
  dateLabel: string;
  edited: boolean;
  author: { id: string; name: string; hasAvatar: boolean };
  rating: number | null;
  status: Status | null;
  currentVolume: number | null;
}

function avatarSrc(author: { id: string; hasAvatar: boolean }) {
  return author.hasAvatar ? `/api/avatar/${author.id}` : null;
}

function CommentItem({ comment, isOwner }: { comment: CommentDTO; isOwner: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.content);
  const [spoiler, setSpoiler] = useState(comment.spoiler);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileHref = `/u/${comment.author.id}`;
  const hidden = comment.spoiler && !revealed && !editing;

  async function save() {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), spoiler }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Excluir este comentário?")) return;
    setBusy(true);
    try {
      await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex gap-3 rounded-lg border border-card-border bg-card p-3">
      <Link
        href={profileHref}
        aria-label={`Ver perfil de ${comment.author.name}`}
        className="shrink-0 self-start rounded-full hover:ring-2 hover:ring-accent transition-shadow"
      >
        <Avatar
          src={avatarSrc(comment.author)}
          name={comment.author.name}
          framed={false}
          className="w-11 h-11"
          initialClassName="text-lg"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={profileHref} className="font-display font-bold hover:text-accent hover:underline">
            {comment.author.name}
          </Link>

          {comment.rating !== null && (
            <span className="inline-flex items-center gap-1" title={`Nota: ${comment.rating} de 5`}>
              <StarDisplay value={comment.rating} />
              <span className="text-xs text-muted tabular-nums">{comment.rating}</span>
            </span>
          )}

          {comment.status && (
            <span className="text-[11px] rounded-full border border-card-border px-2 py-0.5 text-muted">
              {STATUS_LABEL[comment.status]}
              {comment.status === "READING" && comment.currentVolume
                ? ` · vol. ${comment.currentVolume}`
                : ""}
            </span>
          )}

          <span className="text-xs text-muted ml-auto">
            {comment.dateLabel}
            {comment.edited ? " · editado" : ""}
          </span>
        </div>

        {editing ? (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={4}
              className="w-full rounded-md border border-card-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={spoiler}
                  onChange={(e) => setSpoiler(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Contém spoiler
              </label>
              <span className="text-xs text-muted">
                {text.length}/{MAX_LENGTH}
              </span>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setText(comment.content);
                  setSpoiler(comment.spoiler);
                  setError(null);
                }}
                className="px-3 py-1 rounded-md text-sm text-muted hover:bg-background"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy || !text.trim()}
                className="px-3 py-1 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
              >
                {busy ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        ) : hidden ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-2 w-full rounded-md border border-dashed border-card-border px-3 py-2 text-left text-sm text-muted hover:border-accent hover:text-accent transition-colors"
          >
            ⚠ Este comentário contém spoiler — clique para mostrar
          </button>
        ) : (
          <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        {isOwner && !editing && (
          <div className="mt-2 flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-muted hover:text-accent hover:underline"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="text-red-700 hover:underline disabled:opacity-60"
            >
              Excluir
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function MangaComments({
  mangaId,
  comments,
  currentUser,
  currentUserRating,
}: {
  mangaId: string;
  comments: CommentDTO[];
  currentUser: { id: string; name: string; hasAvatar: boolean } | null;
  currentUserRating: number | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaId, content: text.trim(), spoiler }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setText("");
      setSpoiler(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Não foi possível publicar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold mb-3">
        Comentários{" "}
        <span className="text-base font-normal text-muted">({comments.length})</span>
      </h2>

      {currentUser ? (
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 mb-6 rounded-lg border border-card-border bg-card p-3"
        >
          <div className="shrink-0 self-start">
            <Avatar
              src={avatarSrc(currentUser)}
              name={currentUser.name}
              framed={false}
              className="w-11 h-11"
              initialClassName="text-lg"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={3}
              disabled={saving}
              placeholder="O que você achou dessa obra?"
              aria-label="Escreva um comentário"
              className="w-full rounded-md border border-card-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <p className="text-xs text-muted">
              {currentUserRating !== null ? (
                <>
                  Sua nota <span className="text-accent font-medium">★ {currentUserRating}</span>{" "}
                  aparecerá junto ao comentário.
                </>
              ) : (
                "Dica: avalie a obra na sua biblioteca para que sua nota apareça junto ao comentário."
              )}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={spoiler}
                  onChange={(e) => setSpoiler(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Contém spoiler
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {text.length}/{MAX_LENGTH}
                </span>
                <button
                  type="submit"
                  disabled={saving || !text.trim()}
                  className="rounded-md bg-accent text-accent-foreground px-4 py-1.5 text-sm font-medium hover:bg-accent-hover disabled:opacity-60"
                >
                  {saving ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted mb-6">
          <a href="/login" className="text-accent hover:underline">
            Entre na sua conta
          </a>{" "}
          para comentar sobre esta obra.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwner={currentUser?.id === comment.author.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
