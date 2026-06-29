import Link from "next/link";

import { APP_ROUTES } from "@/lib/routes";

const spotlightImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC9Y6euzDW2q25wVAscRy9movrxyYpzco7ucyzjT4Dnnce2SBK_HplEaml84BHMCv-YqM9XPEyT2J5Vq6VRHO40yRPWgT1NUliPAEF2o_RuQTKjjDPKk4g76yHn7_UJNG2RW18MSnhlETVf5LKEIxZuEPUuSrj_VojA99zVM6ClmpqPXVfOeFNmbMxjj8HwGVPUX9qLdo3ygM-RAwE4fRlmgzkIZb6LmRro8ul3obu8OI2Se63KRVopytSfUx8QRQHlqEdae2A8b58D";

const silkImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAc1RfRgIDd1uNPYfiA-Pkwbqe45Z_STM3DhufVQkMwDmGOb3CwNauJZ6jEAB3kVahvoelzQjoAuk2LzVMjmZf3IAcqHlAXtZwa4pshRj8187JAWTykMmi6fEN1T2h4A43-fJEmK7AYhz296hhJRse3J1KKCKFnQhIKlWszzyP5YXKv5ag3SeVhRVtSOF1MjwI4Z2etNSH1X18q26v2ViHvBSB09NiZ0oqvIFEFdMPVv0fLQxmjAs21z2257g5xKu3QzWI_di4iBQ9_";

const features = [
  {
    number: "01",
    title: "Strategic Voice",
    body: "Craft a signature persona that travels across channels while preserving brand voice, audience fit, and editorial control.",
  },
  {
    number: "02",
    title: "Fast Drafting",
    body: "Move from brief to channel-ready drafts with the right structure, tone, and campaign intent already in place.",
  },
  {
    number: "03",
    title: "Compliance Review",
    body: "Review GDPR, consent, IP, and claims risks before content moves into approval and scheduling.",
  },
] as const;

export function HomeShell() {
  return (
    <div
      className="h-screen overflow-y-auto bg-[var(--color-background)] text-[var(--color-text-primary)]"
      data-theme="dark"
    >
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-background)_88%,transparent)] backdrop-blur">
        <nav className="mx-auto flex h-20 max-w-[var(--layout-container-max)] items-center justify-between px-5 md:px-16">
          <Link
            className="luxe-focus-ring rounded-sm font-[var(--font-luxe-serif)] text-3xl leading-none tracking-[-0.04em] text-[var(--color-brand)]"
            href={APP_ROUTES.home}
          >
            THE LUXE
          </Link>
          <div className="hidden items-center gap-10 md:flex">
            <a className="luxe-eyebrow text-[var(--color-brand)]" href="#platform">
              Platform
            </a>
            <a className="luxe-eyebrow" href="#stories">
              Success Stories
            </a>
            <a className="luxe-eyebrow" href="#pricing">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="luxe-focus-ring hidden rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)] sm:block"
              href={APP_ROUTES.login}
            >
              Sign In
            </Link>
            <Link
              className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em]"
              href={APP_ROUTES.signup}
            >
              Start Creating
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[var(--layout-container-max)] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center md:px-16">
          <div className="absolute inset-x-10 top-20 h-64 bg-[radial-gradient(circle,var(--color-brand-soft),transparent_65%)] opacity-30 blur-3xl" />
          <div className="relative z-10 max-w-5xl space-y-9">
            <div className="inline-flex items-center border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
                Elevate Your Narrative
              </span>
            </div>
            <h1 className="font-[var(--font-luxe-serif)] text-5xl uppercase leading-[0.95] tracking-[-0.04em] md:text-8xl">
              Going viral
              <br />
              <span className="italic text-[var(--color-brand)]">made easy.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] md:text-lg">
              The content cockpit for creators and teams who need brand voice,
              workflow, compliance review, and approval in one focused product flow.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Link
                className="luxe-primary-action luxe-focus-ring w-full rounded-sm px-10 py-4 text-sm font-semibold uppercase tracking-[0.18em] sm:w-auto"
                href={APP_ROUTES.signup}
              >
                Start Creating
              </Link>
              <a
                className="luxe-secondary-action luxe-focus-ring w-full rounded-sm px-10 py-4 text-sm font-semibold uppercase tracking-[0.18em] sm:w-auto"
                href="#platform"
              >
                The Manifesto
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[var(--layout-container-max)] px-5 py-12 md:px-16">
          <div className="relative h-[58vh] min-h-96 overflow-hidden border border-[var(--color-border-subtle)] grayscale transition duration-700 hover:grayscale-0">
            <div
              aria-label="High contrast city architecture at night"
              className="h-full w-full bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${spotlightImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent" />
            <p className="luxe-eyebrow absolute bottom-8 left-8 text-[var(--color-text-secondary)]">
              Visual Identity v1.0
            </p>
          </div>
        </section>

        <section
          className="mx-auto grid max-w-[var(--layout-container-max)] gap-6 px-5 py-24 md:grid-cols-3 md:px-16"
          id="platform"
        >
          {features.map((feature) => (
            <article
              className="group flex min-h-96 flex-col justify-between border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 transition duration-300 hover:-translate-y-1 hover:border-[var(--color-brand)]"
              key={feature.number}
            >
              <div>
                <div className="mb-12 flex items-start justify-between">
                  <span className="text-4xl text-[var(--color-brand)]">+</span>
                  <span className="luxe-eyebrow opacity-50">{feature.number}</span>
                </div>
                <h2 className="font-[var(--font-luxe-serif)] text-3xl uppercase leading-tight">
                  {feature.title}
                </h2>
                <p className="mt-5 text-sm leading-7 text-[var(--color-text-secondary)]">
                  {feature.body}
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-5 opacity-70">
                <span className="luxe-eyebrow text-[var(--color-brand)]">Explore</span>
                <svg
                  aria-hidden
                  className="h-5 w-5 text-[var(--color-brand)]"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </div>
            </article>
          ))}
        </section>

        <section
          className="relative overflow-hidden bg-[var(--color-surface-muted)] px-5 py-28 text-center md:px-16"
          id="pricing"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${silkImage})` }}
          />
          <div className="relative z-10 mx-auto max-w-4xl space-y-9">
            <h2 className="font-[var(--font-luxe-serif)] text-5xl uppercase leading-none tracking-[-0.04em] md:text-7xl">
              Own the
              <br />
              narrative.
            </h2>
            <p className="mx-auto max-w-xl text-lg italic leading-8 text-[var(--color-text-secondary)]">
              Influence is not about being everywhere. It is about making every
              draft worth approving.
            </p>
            <Link
              className="luxe-primary-action luxe-focus-ring inline-flex rounded-sm px-12 py-5 text-sm font-semibold uppercase tracking-[0.18em]"
              href={APP_ROUTES.signup}
            >
              Request Access
            </Link>
          </div>
        </section>
      </main>

      <footer
        className="border-t border-[var(--color-border-subtle)] bg-[var(--color-background)]"
        id="stories"
      >
        <div className="mx-auto grid max-w-[var(--layout-container-max)] gap-10 px-5 py-16 md:grid-cols-2 md:px-16">
          <div>
            <p className="font-[var(--font-luxe-serif)] text-4xl uppercase tracking-[-0.04em]">
              THE LUXE
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              {["Platform", "Success Stories", "Pricing", "Privacy Policy"].map((item) => (
                <span className="luxe-eyebrow" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-5 md:text-right">
            <p className="luxe-eyebrow">Workspace Access</p>
            <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
              Local prototype flow: homepage, signup, login, workspace bootstrap,
              and dashboard entry.
            </p>
            <p className="luxe-eyebrow opacity-70">© 2026 THE LUXE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
