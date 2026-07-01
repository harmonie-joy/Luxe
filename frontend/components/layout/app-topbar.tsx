"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ROUTES, TOPBAR_LINKS, type TopbarLink } from "@/lib/routes";

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActiveTopbarLink(link: TopbarLink, pathname: string) {
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m21 21-4.35-4.35" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}

interface TopbarActionProps {
  children: ReactNode;
  label: string;
}

function TopbarAction({ children, label }: TopbarActionProps) {
  const className =
    "luxe-icon-action luxe-focus-ring grid h-10 w-10 place-items-center rounded-full";

  return (
    <button aria-label={label} className={className} type="button">
      {children}
    </button>
  );
}

export function AppTopbar() {
  const pathname = usePathname();

  return (
    <header className="luxe-topbar sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 backdrop-blur md:px-8 lg:px-10">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link
          className="luxe-mobile-brand luxe-focus-ring shrink-0 rounded-sm text-2xl leading-none tracking-[-0.04em] md:hidden"
          href={APP_ROUTES.dashboard}
        >
          THE LUXE
        </Link>

        <label className="luxe-search relative hidden w-full max-w-sm sm:block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </span>
          <span className="sr-only">Search workspace</span>
          <input
            className="luxe-search-input h-10 w-full rounded-sm pl-10 pr-4 text-sm"
            placeholder="Search workspace..."
            type="search"
          />
        </label>
      </div>

      <nav
        aria-label="Workspace shortcuts"
        className="hidden items-center gap-8 md:flex"
      >
        {TOPBAR_LINKS.map((link) => {
          const active = isActiveTopbarLink(link, pathname);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={classNames(
                "luxe-topbar-link luxe-focus-ring rounded-sm border-b-2 py-5 text-[15px] font-semibold",
                active && "luxe-topbar-link-active",
              )}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <TopbarAction label="Notifications">
          <BellIcon />
        </TopbarAction>
        <TopbarAction label="Profile menu">
          <UserIcon />
        </TopbarAction>
      </div>
    </header>
  );
}
