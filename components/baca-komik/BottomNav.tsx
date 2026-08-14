"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, BookMarked, LayoutGrid } from "lucide-react";

const items = [
  { href: "/tools/baca-komik", label: "Home", icon: Home, match: "exact" },
  { href: "/tools/baca-komik?tab=populer", label: "Populer", icon: Flame },
  { href: "/tools/baca-komik/library", label: "Library", icon: BookMarked },
  { href: "/tools/baca-komik/katalog", label: "Genre", icon: LayoutGrid },
];

export default function BottomNav() {
  const path = usePathname() || "";
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((it) => {
          const active =
            it.match === "exact"
              ? path === "/tools/baca-komik"
              : path.startsWith(it.href.split("?")[0]) &&
                path !== "/tools/baca-komik";
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              href={it.href}
              className={
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold " +
                (active ? "text-red-500" : "text-zinc-500")
              }
            >
              <span
                className={
                  "rounded-2xl px-4 py-1 " +
                  (active ? "bg-red-600 text-white" : "")
                }
              >
                <Icon className="h-5 w-5" />
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
