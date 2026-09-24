"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-black/25 text-nav-foreground shadow-inner"
        : "text-nav-foreground/75 hover:bg-black/10 hover:text-nav-foreground"
    }`;

  return (
    <header className="wood-panel border-b-4 border-shelf-wood-dark sticky top-0 z-10 shadow-md">
      <nav className="mx-auto max-w-5xl flex items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-nav-foreground drop-shadow-sm">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/" className={`${linkClass("/")} hidden sm:inline-block`}>
            Início
          </Link>

          {status === "authenticated" ? (
            <>
              <Link
                href={`/u/${session.user.id}`}
                className={linkClass(`/u/${session.user.id}`)}
              >
                Meu Perfil
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-nav-foreground/75 hover:bg-black/10 hover:text-red-300"
              >
                Sair
              </button>
              <span className="hidden sm:inline text-sm text-nav-foreground/80 ml-1">
                Olá, {session.user?.name?.split(" ")[0]}
              </span>
            </>
          ) : status === "loading" ? (
            <div className="w-16 h-8" />
          ) : (
            <>
              <Link href="/login" className={linkClass("/login")}>
                Entrar
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent-hover"
              >
                Criar conta
              </Link>
            </>
          )}

          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
