"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-black/90 text-white dark:bg-white dark:text-black"
        : "text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-canvas/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold tracking-tight">Health</span>
          <nav className="flex gap-1">
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Today
            </Link>
            <Link href="/history" className={linkClass("/history")}>
              History
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-black/50 dark:text-white/50">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
