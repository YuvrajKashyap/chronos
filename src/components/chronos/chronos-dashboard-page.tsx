import type { ChronosSkill } from "@/lib/chronos-sample-data";
import { ChronosShell } from "./chronos-shell";
import { DashboardFooterHint } from "./dashboard-footer-hint";
import { SkillTimerGrid } from "./skill-timer-grid";

export function ChronosDashboardPage({
  activeSessionCount = 1,
  skills,
}: {
  activeSessionCount?: number;
  skills: ChronosSkill[];
}) {
  const sessionLabel = activeSessionCount === 1 ? "1 active session" : `${activeSessionCount} active sessions`;

  return (
    <ChronosShell>
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-labelledby="dashboard-title">
          <h1 id="dashboard-title">Time Investment Ledger</h1>
          <div className="status-row">
            <span className="status-dot" aria-hidden="true" />
            <span>{sessionLabel}</span>
          </div>
        </section>
        <SkillTimerGrid skills={skills} />
        <DashboardFooterHint />
      </main>
    </ChronosShell>
  );
}
