"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { focusRing } from "@/lib/ui/styles";

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Matches",
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/m/"),
  },
  {
    href: "/matches/new",
    label: "New",
    isActive: (pathname) => pathname === "/matches/new",
  },
];

function navLinkClass(active: boolean) {
  return `${focusRing} rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors ${
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted hover:bg-[var(--surface-muted)] hover:text-foreground"
  }`;
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-surface/95 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80">
      <nav
        className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3"
        aria-label="Main"
      >
        <Link href="/" className={`${focusRing} shrink-0 text-lg font-bold text-foreground no-underline`}>
          Cricket Score
        </Link>
        <ul className="flex list-none gap-1 p-0 m-0">
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            return (
              <li key={item.href}>
                <Link href={item.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
