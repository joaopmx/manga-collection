"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link do seu perfil:", window.location.href);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="px-3 py-1.5 rounded-md text-sm font-medium border border-card-border hover:border-accent hover:text-accent transition-colors"
    >
      {copied ? "Link copiado!" : "Copiar link do perfil"}
    </button>
  );
}
