import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { startChronosTimer, stopChronosTimer } from "@/app/admin/actions";
import { ChronosShell } from "./chronos-shell";
import { DashboardFooterHint } from "./dashboard-footer-hint";
import { SkillTimerGrid } from "./skill-timer-grid";

export type DashboardControls =
  | { mode: "readonly" }
  | { mode: "login" }
  | {
      mode: "admin";
      startAction: typeof startChronosTimer;
      stopAction: typeof stopChronosTimer;
      nextPath: string;
    };

export function ChronosDashboardPage({
  activeSessionCount = 1,
  controls = { mode: "readonly" },
  isAuthenticated = false,
  message,
  skills,
}: {
  activeSessionCount?: number;
  controls?: DashboardControls;
  isAuthenticated?: boolean;
  message?: string | null;
  skills: ChronosSkill[];
}) {
  const sessionLabel = activeSessionCount === 1 ? "1 active session" : `${activeSessionCount} active sessions`;

  return (
    <ChronosShell isAuthenticated={isAuthenticated}>
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-labelledby="dashboard-title">
          <h1 id="dashboard-title">Time Investment Ledger</h1>
          <div className="status-row">
            <span className="status-dot" aria-hidden="true" />
            <span>{sessionLabel}</span>
          </div>
        </section>
        {message ? <p className="admin-inline-message is-error">{message}</p> : null}
        <SkillTimerGrid controls={controls} skills={skills} />
        <DashboardFooterHint />
      </main>
    </ChronosShell>
  );
}
