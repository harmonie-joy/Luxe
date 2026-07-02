"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api/http-client";
import {
  bootstrapWorkspace,
  login,
  prepareCsrf,
  signup,
} from "@/lib/api/auth";
import { APP_ROUTES } from "@/lib/routes";

interface AuthShellProps {
  mode: "login" | "signup";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Authentication failed. Please try again.";
}

export function AuthShell({ mode }: AuthShellProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(mode === "login" ? "demo@theluxe.local" : "");
  const [password, setPassword] = useState(mode === "login" ? "theluxe-demo" : "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await prepareCsrf();
      if (isSignup) {
        await signup({ display_name: displayName, email, password });
      } else {
        await login({ email, password });
      }
      await bootstrapWorkspace();
      router.push(isSignup ? APP_ROUTES.onboarding : APP_ROUTES.dashboard);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="h-screen overflow-y-auto bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)] md:px-16"
      data-theme="dark"
    >
      <div className="mx-auto flex min-h-full w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <section className="max-w-2xl space-y-8">
            <Link
              className="luxe-focus-ring inline-block rounded-sm font-[var(--font-luxe-serif)] text-4xl leading-none tracking-[-0.04em] text-[var(--color-brand)]"
              href={APP_ROUTES.home}
            >
              THE LUXE
            </Link>
            <div className="space-y-5">
              <h1 className="font-[var(--font-luxe-serif)] text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">
                {isSignup ? "Start your content cockpit." : "Welcome back."}
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--color-text-secondary)] md:text-lg">
                {isSignup
                  ? "Create a workspace, shape your brand voice, and move from homepage to working product flow."
                  : "Use the demo account or your own credentials to enter the THE LUXE workspace."}
              </p>
            </div>
          </section>

          <form
            className="luxe-panel space-y-5 rounded-sm p-6 md:p-8"
            onSubmit={handleSubmit}
          >
            <div>
              <p className="luxe-eyebrow">{isSignup ? "Request Access" : "Sign In"}</p>
              <h2 className="mt-3 text-2xl font-semibold">
                {isSignup ? "Create account" : "Workspace access"}
              </h2>
            </div>

            {isSignup ? (
              <label className="block">
                <span className="luxe-form-label">Display name</span>
                <input
                  className="luxe-field mt-2 h-12 w-full px-4"
                  onChange={(event) => setDisplayName(event.currentTarget.value)}
                  required
                  value={displayName}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="luxe-form-label">Email</span>
              <input
                autoComplete="email"
                className="luxe-field mt-2 h-12 w-full px-4"
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="luxe-form-label">Password</span>
              <input
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="luxe-field mt-2 h-12 w-full px-4"
                minLength={8}
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {message ? (
              <p className="text-sm leading-6 text-[var(--status-danger)]">{message}</p>
            ) : null}

            <button
              className="luxe-primary-action luxe-focus-ring w-full rounded-sm px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? "Working..."
                : isSignup
                  ? "Create workspace"
                  : "Enter dashboard"}
            </button>

            <p className="luxe-form-help text-center">
              {isSignup ? "Already have access? " : "Need access? "}
              <Link
                className="luxe-focus-ring rounded-sm font-semibold text-[var(--color-brand)]"
                href={isSignup ? APP_ROUTES.login : APP_ROUTES.signup}
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
