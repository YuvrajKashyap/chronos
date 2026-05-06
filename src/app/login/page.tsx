import Link from "next/link";
import { X } from "lucide-react";

import { ChronosDashboardPage } from "@/components/chronos/chronos-dashboard-page";
import { LoginForm } from "@/components/chronos/login-form";
import { chronosSkills } from "@/lib/chronos-sample-data";
import { getPublicDashboard } from "@/lib/chronos/public-dashboard";
import {
  getPublicActiveSessionCount,
  hasUsefulPublicDashboardData,
  transformPublicDashboardToSkills,
} from "@/lib/chronos/transform-dashboard";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authError = params.error ? decodeURIComponent(params.error) : null;
  const { payload } = await getPublicDashboard();
  const hasRealData = hasUsefulPublicDashboardData(payload);
  const skills = hasRealData && payload ? transformPublicDashboardToSkills(payload) : chronosSkills;
  const activeSessionCount = hasRealData ? getPublicActiveSessionCount(payload) : 1;

  return (
    <div className="login-overlay-page">
      <div className="login-overlay-background" aria-hidden="true">
        <ChronosDashboardPage
          activeSessionCount={activeSessionCount}
          controls={{ mode: "readonly" }}
          skills={skills}
        />
      </div>
      <main className="auth-modal-backdrop" aria-labelledby="login-title">
        <section className="auth-panel auth-modal-panel" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <Link className="auth-modal-close" href="/" aria-label="Close login">
            <X size={18} aria-hidden="true" />
          </Link>
          <p className="auth-kicker">Private ledger access</p>
          <h1 id="login-title">Admin Login</h1>
          <p className="auth-copy">Private Chronos control access.</p>
          {authError ? <p className="auth-message is-error">Auth callback: {authError}</p> : null}
          <LoginForm />
          <Link className="auth-secondary-link" href="/">
            Back to public dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}
