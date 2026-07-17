import Link from "next/link";
import { X } from "lucide-react";

import { ChronosDashboardPage } from "@/components/chronos/chronos-dashboard-page";
import { LoginForm } from "@/components/chronos/login-form";
import { getPublicDashboard } from "@/lib/chronos/public-dashboard";
import {
  getPublicActiveSessionCount,
  hasUsefulPublicDashboardData,
  parseDashboardSortMode,
  transformPublicDashboardToSkills,
} from "@/lib/chronos/transform-dashboard";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const authError = params.error ? decodeURIComponent(params.error) : null;
  const sortMode = parseDashboardSortMode(params.sort);
  const nextPath = params.next === "/insights" || params.next === "/settings" || params.next === "/admin" ? params.next : "/admin";
  const { payload, error } = await getPublicDashboard();
  const hasRealData = hasUsefulPublicDashboardData(payload);
  const skills = hasRealData && payload ? transformPublicDashboardToSkills(payload, sortMode) : [];
  const activeSessionCount = hasRealData ? getPublicActiveSessionCount(payload) : 0;
  const dataNotice = hasRealData
    ? null
    : error ?? "Live public totals are temporarily unavailable. Chronos does not substitute sample data.";

  return (
    <div className="login-overlay-page">
      <div className="login-overlay-background" aria-hidden="true">
        <ChronosDashboardPage
          activeSessionCount={activeSessionCount}
          controls={{ mode: "readonly" }}
          dataNotice={dataNotice}
          skills={skills}
          sortMode={sortMode}
        />
      </div>
      <main className="auth-modal-backdrop" aria-labelledby="login-title">
        <Link className="auth-backdrop-dismiss" href="/" aria-label="Back to dashboard" />
        <section className="auth-modal-panel chronos-auth-card" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <Link className="auth-modal-close" href="/" aria-label="Close login">
            <X size={18} aria-hidden="true" />
          </Link>
          <aside className="auth-brand-pane" aria-hidden="true">
            <div className="auth-brand-lockup">
              <span className="auth-mini-seal">
                <img
                  className="auth-mini-logo auth-mini-logo-light"
                  src="/assets/chronos-logo-light.png"
                  alt=""
                  width="876"
                  height="876"
                />
                <img
                  className="auth-mini-logo auth-mini-logo-dark"
                  src="/assets/chronos-logo-dark.png"
                  alt=""
                  width="1072"
                  height="1072"
                />
              </span>
              <span>CHRONOS</span>
            </div>
            <div className="auth-orbit-mark">
              <span className="auth-orbit-ring auth-orbit-ring-one" />
              <span className="auth-orbit-ring auth-orbit-ring-two" />
              <span className="auth-orbit-ring auth-orbit-ring-three" />
              <img
                className="auth-orbit-logo auth-orbit-logo-light"
                src="/assets/chronos-logo-light.png"
                alt=""
                width="876"
                height="876"
              />
              <img
                className="auth-orbit-logo auth-orbit-logo-dark"
                src="/assets/chronos-logo-dark.png"
                alt=""
                width="1072"
                height="1072"
              />
            </div>
            <p className="auth-brand-motto">
              Time is not spent.
              <span>It&apos;s invested.</span>
            </p>
          </aside>
          <div className="auth-form-pane">
            <h1 id="login-title">Welcome Back</h1>
            <p className="auth-copy">Sign in if you&apos;re me.</p>
            {authError ? <p className="auth-message is-error">Auth callback: {authError}</p> : null}
            <LoginForm nextPath={nextPath} />
          </div>
        </section>
      </main>
    </div>
  );
}
