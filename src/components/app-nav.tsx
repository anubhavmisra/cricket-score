"use client";

import { Show, UserButton } from "@clerk/nextjs";
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
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const signInHref = pathname.startsWith("/m/")
    ? `/sign-in?redirect_url=${encodeURIComponent(pathname)}`
    : "/sign-in";

  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-surface/95 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80">
      <nav
        className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3"
        aria-label="Main"
      >
        <Link href="/" className={`${focusRing} shrink-0 text-lg font-bold text-foreground no-underline`}>
          Cricket Score
        </Link>
        <div className="flex items-center gap-2">
          <ul className="m-0 flex list-none gap-1 p-0">
            {navItems.map((item) => {
              const active = item.isActive(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={navLinkClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Show
            when="signed-in"
            fallback={
              <Link href={signInHref} className={navLinkClass(false)}>
                Sign in
              </Link>
            }
          >
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </Show>
        </div>
      </nav>
    </header>
  );
}
