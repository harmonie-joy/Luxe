"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthSession } from "@/types/auth";
import {
  APP_ROUTES,
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  type NavigationIcon,
  type NavigationItem,
} from "@/lib/routes";

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActiveRoute(item: NavigationItem, pathname: string) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

interface NavIconProps {
  icon: NavigationIcon;
}

function NavIcon({ icon }: NavIconProps) {
  const sharedProps = {
    "aria-hidden": true,
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
  } as const;

  switch (icon) {
    case "dashboard":
      return (
        <svg {...sharedProps}>
          <path d="M4 4h6v6H4z" />
          <path d="M14 4h6v6h-6z" />
          <path d="M4 14h6v6H4z" />
          <path d="M14 14h6v6h-6z" />
        </svg>
      );
    case "brandVoice":
      return (
        <svg {...sharedProps}>
          <path d="M12 4v8" />
          <path d="M8 7v5a4 4 0 0 0 8 0V7" />
          <path d="M6 12a6 6 0 0 0 12 0" />
          <path d="M12 18v2" />
        </svg>
      );
    case "create":
      return (
        <svg {...sharedProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "drafts":
      return (
        <svg {...sharedProps}>
          <path d="M7 3h8l4 4v17H7z" />
          <path d="M15 3v5h5" />
          <path d="M10 13h7" />
          <path d="M10 17h5" />
        </svg>
      );
    case "compliance":
      return (
        <svg {...sharedProps}>
          <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...sharedProps}>
          <path d="M5 5h14v16H5z" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M5 10h14" />
        </svg>
      );
  }
}

interface SidebarLinkProps {
  item: NavigationItem;
}

function SidebarLink({ item }: SidebarLinkProps) {
  const pathname = usePathname();
  const active = isActiveRoute(item, pathname);

  return (
    <div>
      <Link
        aria-current={pathname === item.href ? "page" : undefined}
        className={classNames(
          "luxe-nav-link luxe-focus-ring flex items-center gap-3 px-4 py-3 text-sm font-medium",
          active && "luxe-nav-link-active",
        )}
        href={item.href}
      >
        <NavIcon icon={item.icon} />
        <span>{item.label}</span>
      </Link>
      {item.children && active ? (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => {
            const childActive =
              pathname === child.href || pathname.startsWith(`${child.href}/`);
            return (
              <Link
                aria-current={pathname === child.href ? "page" : undefined}
                className={classNames(
                  "luxe-nav-link luxe-focus-ring flex min-h-11 items-center py-2 pl-12 pr-4 text-sm",
                  childActive && "luxe-nav-link-active",
                )}
                href={child.href}
                key={child.href}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

interface AppSidebarProps {
  session?: AuthSession;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ session, mobile = false, onNavigate }: AppSidebarProps = {}) {
  const workspace = session?.workspaces.find((item) => item.id === session.activeWorkspaceId);
  const pathname = usePathname();
  const moreToolsActive = SECONDARY_NAV_ITEMS.some((item) => isActiveRoute(item, pathname));
  return (
    <aside className={`luxe-sidebar h-full shrink-0 flex-col ${mobile ? "flex" : "hidden lg:flex"}`} onClick={(event) => {
      if ((event.target as Element).closest("a")) onNavigate?.();
    }}>
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-5">
        <Link
          aria-label="THE LUXE Creator Home"
          className="luxe-wordmark luxe-focus-ring mt-3 block"
          href={APP_ROUTES.dashboard}
        >
          THE LUXE<span aria-hidden>✦</span>
        </Link>

        <nav aria-label="Primary navigation" className="space-y-1">
          <p className="luxe-eyebrow mb-4 px-4">Your workspace</p>
          {PRIMARY_NAV_ITEMS.map((item) => (
            <SidebarLink item={item} key={item.href} />
          ))}
        </nav>

        <details className="luxe-tools" key={moreToolsActive ? "active" : "inactive"} open={moreToolsActive || undefined}>
          <summary className="luxe-focus-ring px-4 py-3 text-sm">More tools <span className="luxe-form-help">Existing workflow</span></summary>
          <nav aria-label="Existing tools" className="mt-2 space-y-1">
            {SECONDARY_NAV_ITEMS.map((item) => <SidebarLink item={item} key={item.href} />)}
          </nav>
          <p className="luxe-form-help mt-3 px-4">Some existing screens include labeled demo data.</p>
        </details>

        <div className="luxe-sidebar-footer mt-auto space-y-5 pt-6">
          <div className="luxe-sidebar-note space-y-2 p-4">
            <p className="luxe-section-title">A little more flow.</p>
            <p className="luxe-form-help">Your voice, your ideas.<br />One place to move forward.</p>
          </div>
          <Link
            className="luxe-identity luxe-focus-ring flex min-w-0 items-center gap-3 rounded-sm p-2"
            href={APP_ROUTES.account}
          >
            <span className="luxe-avatar shrink-0" aria-hidden>
              {(session?.user.displayName || session?.user.username || "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{session?.user.displayName || session?.user.username || "Account"}</span>
              <span className="luxe-form-help block truncate">{workspace?.name ?? "No active workspace"}</span>
            </span>
            <span className="luxe-muted ml-auto" aria-hidden>↗</span>
          </Link>
          <Link className="luxe-text-link luxe-focus-ring block px-2 text-xs" href={APP_ROUTES.account}>Account &amp; sign out</Link>
        </div>
      </div>
    </aside>
  );
}
