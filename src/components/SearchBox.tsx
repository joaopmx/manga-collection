"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (value.trim()) params.set("q", value.trim());
        router.push(`/?${params.toString()}`);
      }}
      className="flex gap-2"
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar mangá por título..."
        className="flex-1 min-w-0 rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        className="rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:bg-accent-hover"
      >
        Buscar
      </button>
    </form>
  );
}
