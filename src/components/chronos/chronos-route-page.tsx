import Link from "next/link";

import { ChronosShell } from "./chronos-shell";

export function ChronosRoutePage({
  eyebrow,
  title,
  description,
  isAuthenticated,
}: {
  eyebrow: string;
  title: string;
  description: string;
  isAuthenticated: boolean;
}) {
  return (
    <ChronosShell isAuthenticated={isAuthenticated}>
      <main className="route-main">
        <section className="route-panel" aria-labelledby="route-title">
          <p className="auth-kicker">{eyebrow}</p>
          <h1 id="route-title">{title}</h1>
          <p>{description}</p>
          <Link className="auth-primary-link" href="/">
            Dashboard
          </Link>
        </section>
      </main>
    </ChronosShell>
  );
}
