import Link from "next/link";

import { ChronosShell } from "@/components/chronos/chronos-shell";
import { LoginForm } from "@/components/chronos/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authError = params.error ? decodeURIComponent(params.error) : null;

  return (
    <ChronosShell>
      <main className="auth-main">
        <section className="auth-panel" aria-labelledby="login-title">
          <p className="auth-kicker">Private ledger access</p>
          <h1 id="login-title">Admin Login</h1>
          <p className="auth-copy">Private Chronos control access.</p>
          {authError ? <p className="auth-message is-error">Auth callback: {authError}</p> : null}
          <LoginForm />
          <Link className="auth-secondary-link" href="/">
            Return to public dashboard
          </Link>
        </section>
      </main>
    </ChronosShell>
  );
}
