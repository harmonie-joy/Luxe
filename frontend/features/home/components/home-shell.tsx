import Link from "next/link";

import { APP_ROUTES } from "@/lib/routes";

const alphaCapabilities = [
  "Start a post in the idea or drafting stage, or resume a saved post.",
  "Review and explicitly accept the exact BrandVoice version for a new post.",
  "Save and resume the post's checkpoint state.",
] as const;

export function HomeShell() {
  return (
    <div
      className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]"
      data-theme="dark"
    >
      <header className="border-b border-[var(--color-border-subtle)]">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex min-h-20 max-w-[var(--layout-container-max)] items-center justify-between gap-6 px-5 py-4 md:px-16"
        >
          <Link
            className="luxe-focus-ring rounded-sm font-[var(--font-luxe-serif)] text-3xl leading-none tracking-[-0.04em] text-[var(--color-brand)]"
            href={APP_ROUTES.home}
          >
            THE LUXE
          </Link>
          <Link
            className="luxe-secondary-action luxe-focus-ring rounded-sm px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em]"
            href={APP_ROUTES.login}
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[var(--layout-container-max)] px-5 md:px-16">
        <section
          aria-labelledby="home-title"
          className="relative isolate flex min-h-[min(42rem,calc(100svh-5rem))] flex-col justify-center gap-8 overflow-hidden py-20 md:py-28"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-x-10 top-10 -z-10 h-72 bg-[radial-gradient(circle,var(--color-brand-soft),transparent_65%)] opacity-30 blur-3xl"
          />
          <p className="luxe-eyebrow text-[var(--color-brand)]">
            For Creators and CEOs
          </p>
          <h1
            className="max-w-5xl font-[var(--font-luxe-serif)] text-5xl leading-[1.05] tracking-[-0.04em] md:text-7xl"
            id="home-title"
          >
            Keep your context. Finish the work in front of you.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] md:text-lg">
            THE LUXE is being built to help Creators and CEOs carry their context
            into the next piece of work—and pick up where they left off.
          </p>
          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            <Link
              className="luxe-primary-action luxe-focus-ring inline-flex min-h-12 items-center justify-center rounded-sm px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em]"
              href={APP_ROUTES.login}
            >
              Sign in
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="alpha-title"
          className="grid gap-8 border-t border-[var(--color-border-subtle)] py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-16 md:py-20"
        >
          <div>
            <p className="luxe-eyebrow text-[var(--color-brand)]">Current state</p>
            <h2
              className="mt-4 font-[var(--font-luxe-serif)] text-3xl leading-tight md:text-4xl"
              id="alpha-title"
            >
              Internal Alpha
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-[var(--color-text-secondary)]">
              The current alpha is a narrow create-and-resume flow, limited to
              the idea and drafting stages.
            </p>
          </div>
          <ul className="m-0 grid list-none gap-4 p-0">
            {alphaCapabilities.map((capability) => (
              <li
                className="border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 leading-7 text-[var(--color-text-secondary)] md:p-6"
                key={capability}
              >
                {capability}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="vision-title"
          className="border-t border-[var(--color-border-subtle)] py-16 md:py-20"
        >
          <p className="luxe-eyebrow text-[var(--color-brand)]">Longer-term vision</p>
          <h2
            className="mt-4 font-[var(--font-luxe-serif)] text-3xl leading-tight md:text-4xl"
            id="vision-title"
          >
            Build → Scale → Automate
          </h2>
          <p className="mt-5 max-w-2xl leading-7 text-[var(--color-text-secondary)]">
            Build → Scale → Automate is the longer-term vision. The Internal Alpha
            above is the current limited functionality. Scale and Automate are
            future, planned stages—not capabilities available in this alpha.
          </p>
          <Link
            className="luxe-primary-action luxe-focus-ring mt-8 inline-flex min-h-12 items-center justify-center rounded-sm px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em]"
            href={APP_ROUTES.login}
          >
            Sign in
          </Link>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border-subtle)]">
        <div className="mx-auto flex max-w-[var(--layout-container-max)] flex-col gap-4 px-5 py-8 text-sm text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between md:px-16">
          <p className="font-[var(--font-luxe-serif)] text-2xl text-[var(--color-text-primary)]">
            THE LUXE
          </p>
          <p>Internal Alpha status and planned stages are stated separately.</p>
        </div>
      </footer>
    </div>
  );
}
