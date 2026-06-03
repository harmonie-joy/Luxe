"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  APP_ROUTES,
  CREATE_BRIEF_ROUTE,
  FOOTER_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
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
    case "settings":
      return (
        <svg {...sharedProps}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
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
    <Link
      aria-current={active ? "page" : undefined}
      className={classNames(
        "luxe-nav-link luxe-focus-ring flex items-center gap-3 rounded-sm border-l-2 px-4 py-3 text-[15px] font-semibold",
        active && "luxe-nav-link-active",
      )}
      href={item.href}
    >
      <NavIcon icon={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppSidebar() {
  return (
    <aside className="luxe-sidebar hidden h-screen shrink-0 flex-col border-r md:flex">
      <div className="flex min-h-0 flex-1 flex-col px-5 py-10">
        <Link
          aria-label="THE LUXE dashboard"
          className="luxe-focus-ring mb-10 block rounded-sm"
          href={APP_ROUTES.dashboard}
        >
          <span
            className="luxe-sidebar-brand-title block text-5xl leading-[0.92] tracking-[-0.04em]"
          >
            THE
            <br />
            LUXE
          </span>
          <span className="luxe-sidebar-kicker mt-4 block text-[11px] font-medium uppercase tracking-[0.18em]">
            Enterprise Workspace
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="space-y-1">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <SidebarLink item={item} key={item.href} />
          ))}
        </nav>

        <div className="mt-auto space-y-6 pt-8">
          <Link
            className="luxe-primary-action luxe-focus-ring flex w-full items-center justify-center gap-2 rounded-sm px-4 py-3 text-[15px] font-semibold"
            href={CREATE_BRIEF_ROUTE}
          >
            <span aria-hidden className="text-xl leading-none">
              +
            </span>
            Create New Brief
          </Link>

          <nav
            aria-label="Account navigation"
            className="luxe-account-nav space-y-1 border-t pt-4"
          >
            {FOOTER_NAV_ITEMS.map((item) => (
              <SidebarLink item={item} key={item.href} />
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
