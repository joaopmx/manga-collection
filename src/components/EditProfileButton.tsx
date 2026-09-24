"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";

const AVATAR_SIZE = 256;
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const BIO_MAX = 300;

/** Center-crops the picked image to a square and shrinks it so it can live inline in the DB. */
async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("A imagem deve ter no máximo 10 MB.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Não foi possível ler essa imagem. Tente um JPG, PNG ou WebP.");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não suporta o processamento de imagens.");

  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function EditProfileButton({
  name,
  initialBio,
  initialAvatar,
}: {
  name: string;
  initialBio: string | null;
  initialAvatar: string | null;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function openModal() {
    setBio(initialBio ?? "");
    setAvatar(initialAvatar);
    setError(null);
    setOpen(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      setAvatar(await fileToAvatarDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível usar essa imagem.");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim() || null,
          ...(avatar !== initialAvatar ? { avatar } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
      >
        Editar perfil
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="w-full max-w-md rounded-lg border border-card-border bg-card p-5 shadow-xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="edit-profile-title" className="font-display text-xl font-bold">
                Editar perfil
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="text-muted hover:text-accent text-xl leading-none px-1"
              >
                ×
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Avatar src={avatar} name={name} className="w-24 h-24" />
              <div className="flex flex-col gap-2 items-start">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                  data-testid="avatar-input"
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="px-3 py-1.5 rounded-md text-sm font-medium border border-card-border hover:border-accent hover:text-accent transition-colors"
                >
                  Escolher foto
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="text-xs text-red-700 hover:underline"
                  >
                    Remover foto
                  </button>
                )}
                <p className="text-xs text-muted">A foto é recortada em quadrado.</p>
              </div>
            </div>

            <div>
              <label htmlFor="profile-bio" className="block text-sm font-medium mb-1">
                Descrição
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={BIO_MAX}
                rows={4}
                placeholder="Conte um pouco sobre seus gostos de leitura..."
                className="w-full rounded-md border border-card-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted text-right mt-1">
                {bio.length}/{BIO_MAX}
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 rounded-md text-sm font-medium text-muted hover:bg-background"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
