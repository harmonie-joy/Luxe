import { cleanup } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, vi } from "vitest";

import type { AuthSession } from "@/types/auth";

/** Shared next/navigation router spies — cleared between tests. */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// next/link needs an app-router context in jsdom; a plain anchor is enough for tests.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children?: ReactNode } & Record<string, unknown>) =>
    createElement("a", { href, ...props }, children),
}));

/** Minimal signed-in session shared by component tests. */
export const mockSession: AuthSession = {
  user: {
    id: "user-1",
    username: "mario",
    email: "mario@example.com",
    displayName: "Mario",
  },
  workspaces: [{ id: "ws-1", name: "Live Workspace", role: "owner" }],
  activeWorkspaceId: "ws-1",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
