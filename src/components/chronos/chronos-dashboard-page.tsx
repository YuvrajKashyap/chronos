import { ChronosShell } from "./chronos-shell";
import { DashboardFooterHint } from "./dashboard-footer-hint";
import { SkillTimerGrid } from "./skill-timer-grid";

export function ChronosDashboardPage() {
  return (
    <ChronosShell>
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-labelledby="dashboard-title">
          <h1 id="dashboard-title">Time Investment Ledger</h1>
          <div className="status-row">
            <span className="status-dot" aria-hidden="true" />
            <span>1 active session</span>
          </div>
        </section>
        <SkillTimerGrid />
        <DashboardFooterHint />
      </main>
    </ChronosShell>
  );
}
