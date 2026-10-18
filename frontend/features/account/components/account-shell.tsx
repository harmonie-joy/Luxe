"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/components/ui/surface-card";
import { AUTH_SESSION_UPDATED_EVENT, getSession, logout, updateCurrentUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http-client";
import { isBrandVoiceMockMode } from "@/lib/brand-voice-mode";
import { APP_ROUTES } from "@/lib/routes";
import type { AuthSession } from "@/types/auth";

const API_BASE_LABEL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

const BRAND_VOICE_MODE = isBrandVoiceMockMode()
  ? "Mock fallback mode"
  : "API mode";

const QUICK_ACTIONS = [
  { href: APP_ROUTES.dashboard, label: "Dashboard" },
  { href: APP_ROUTES.onboarding, label: "Onboarding" },
  { href: APP_ROUTES.brandVoice, label: "Brand Voice" },
  { href: APP_ROUTES.create, label: "Create Brief" },
] as const;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return `API error ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return fallback;
}

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="luxe-form-label">{label}</dt>
      <dd className="text-sm font-medium break-all sm:text-right">{value}</dd>
    </div>
  );
}

export function AccountShell() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSession()
      .then((loaded) => {
        if (cancelled) return;
        setSession(loaded);
        setDisplayName(loaded.user.displayName);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(getErrorMessage(error, "Session could not be loaded."));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!displayName.trim()) {
      setSaveError("Add a display name before saving.");
      setSaveMessage(null);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const updated = await updateCurrentUser({
        display_name: displayName.trim(),
      });
      setSession(updated);
      setDisplayName(updated.user.displayName);
      setSaveMessage("Display name saved.");
      window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
    } catch (error) {
      setSaveError(getErrorMessage(error, "Display name could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      router.push(APP_ROUTES.login);
    } catch (error) {
      setLogoutError(getErrorMessage(error, "Logout failed. Try again."));
      setIsLoggingOut(false);
    }
  }

  if (loadError) {
    return (
      <SurfaceCard className="max-w-xl">
        <p className="luxe-eyebrow">Account</p>
        <h1 className="luxe-section-title mt-2">Session unavailable</h1>
        <p className="luxe-form-help mt-2">{loadError}</p>
        <Link
          className="luxe-primary-action luxe-focus-ring mt-6 inline-block rounded-full px-5 py-3 text-sm font-semibold"
          href={APP_ROUTES.login}
        >
          Go to login
        </Link>
      </SurfaceCard>
    );
  }

  if (!session) {
    return (
      <SurfaceCard className="max-w-xl">
        <p className="luxe-eyebrow">Account</p>
        <p className="luxe-form-help mt-2">Loading your session...</p>
      </SurfaceCard>
    );
  }

  const activeWorkspace =
    session.workspaces.find(
      (workspace) => workspace.id === session.activeWorkspaceId,
    ) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="luxe-eyebrow">Account</p>
        <h1 className="luxe-page-title mt-3">Your Account</h1>
        <p className="luxe-page-description mt-4 max-w-2xl">
          Review who is signed in, your active workspace, and the current
          runtime setup for this MVP session.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SurfaceCard className="flex flex-col gap-6">
          <div>
            <p className="luxe-eyebrow">Identity</p>
            <h2 className="luxe-section-title mt-2">Signed-in User</h2>
          </div>

          <form className="space-y-4" onSubmit={handleSaveDisplayName}>
            <div>
              <label className="luxe-form-label" htmlFor="account-display-name">
                Display name
              </label>
              <input
                className="luxe-field mt-2 w-full px-4 py-3"
                id="account-display-name"
                name="displayName"
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setSaveMessage(null);
                  setSaveError(null);
                }}
                type="text"
                value={displayName}
              />
            </div>

            <div aria-live="polite" className="space-y-3">
              {saveMessage ? (
                <p className="luxe-preview-stat p-4 text-sm font-medium">
                  {saveMessage}
                </p>
              ) : null}
              {saveError ? (
                <p className="luxe-preview-stat p-4 text-sm font-medium text-luxe-danger">
                  {saveError}
                </p>
              ) : null}
            </div>

            <button
              className="luxe-primary-action luxe-focus-ring rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save display name"}
            </button>
          </form>

          <dl className="space-y-3 border-t border-(--color-border-subtle) pt-6">
            <DetailRow label="Email" value={session.user.email} />
            <DetailRow label="Username" value={session.user.username} />
            <DetailRow
              label="User ID"
              value={<span className="text-xs">{session.user.id}</span>}
            />
          </dl>
        </SurfaceCard>

        <SurfaceCard className="flex flex-col gap-6">
          <div>
            <p className="luxe-eyebrow">Tenant</p>
            <h2 className="luxe-section-title mt-2">Active Workspace</h2>
          </div>

          {activeWorkspace ? (
            <dl className="space-y-3">
              <DetailRow label="Name" value={activeWorkspace.name} />
              <DetailRow
                label="Workspace ID"
                value={<span className="text-xs">{activeWorkspace.id}</span>}
              />
              <DetailRow label="Your role" value={activeWorkspace.role} />
              <DetailRow
                label="Workspaces in session"
                value={session.workspaces.length}
              />
            </dl>
          ) : (
            <p className="luxe-form-help">
              No active workspace yet. It is created automatically the first
              time you sign in.
            </p>
          )}
        </SurfaceCard>

        <SurfaceCard className="flex flex-col gap-6">
          <div>
            <p className="luxe-eyebrow">Runtime</p>
            <h2 className="luxe-section-title mt-2">MVP Runtime Context</h2>
          </div>

          <dl className="space-y-3">
            <DetailRow
              label="API base"
              value={<span className="text-xs">{API_BASE_LABEL}</span>}
            />
            <DetailRow label="Brand Voice mode" value={BRAND_VOICE_MODE} />
            <DetailRow label="Session auth" value="Django session" />
            <DetailRow label="Workspace source" value="Session bootstrap" />
          </dl>
        </SurfaceCard>

        <SurfaceCard className="flex flex-col gap-6">
          <div>
            <p className="luxe-eyebrow">Navigate</p>
            <h2 className="luxe-section-title mt-2">Quick Actions</h2>
          </div>

          <nav aria-label="Account quick actions" className="flex flex-col gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                className="luxe-secondary-action luxe-focus-ring rounded-full px-5 py-3 text-center text-sm font-semibold"
                href={action.href}
                key={action.href}
              >
                {action.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-3 border-t border-(--color-border-subtle) pt-6">
            {logoutError ? (
              <p className="luxe-preview-stat p-4 text-sm font-medium text-luxe-danger">
                {logoutError}
              </p>
            ) : null}
            <button
              className="luxe-danger-action luxe-focus-ring w-full rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
