import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { AdminPendingSession } from "@/lib/chronos/admin-dashboard";
import type { DashboardSortMode } from "@/lib/chronos/transform-dashboard";
import type {
  confirmChronosTimerSession,
  createChronosSkill,
  deleteChronosSkill,
  startChronosTimer,
  stopChronosTimer,
  updateChronosSkill,
  reorderChronosSkills,
} from "@/app/admin/actions";
import { ChronosShell } from "./chronos-shell";
import { DashboardSortDropdown } from "./dashboard-sort-dropdown";
import { DashboardFooterHint } from "./dashboard-footer-hint";
import { PendingSessionReview } from "./pending-session-review";
import { SkillTimerGrid } from "./skill-timer-grid";

export type DashboardControls =
  | { mode: "readonly" }
  | { mode: "login" }
  | {
      mode: "admin";
      startAction: typeof startChronosTimer;
      stopAction: typeof stopChronosTimer;
      confirmSessionAction: typeof confirmChronosTimerSession;
      createSkillAction: typeof createChronosSkill;
      updateSkillAction: typeof updateChronosSkill;
      deleteSkillAction: typeof deleteChronosSkill;
      reorderSkillAction: typeof reorderChronosSkills;
      nextPath: string;
    };

export function ChronosDashboardPage({
  activeSessionCount = 1,
  controls = { mode: "readonly" },
  isAuthenticated = false,
  message,
  pendingSessions = [],
  skills,
  sortMode = "custom",
}: {
  activeSessionCount?: number;
  controls?: DashboardControls;
  isAuthenticated?: boolean;
  message?: string | null;
  pendingSessions?: AdminPendingSession[];
  skills: ChronosSkill[];
  sortMode?: DashboardSortMode;
}) {
  const sessionLabel = activeSessionCount === 1 ? "1 active session" : `${activeSessionCount} active sessions`;

  return (
    <ChronosShell isAuthenticated={isAuthenticated}>
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-label="Chronos timer status">
          <div className="dashboard-status-bar">
            <div className="status-row">
              <span className="status-dot" aria-hidden="true" />
              <span>{sessionLabel}</span>
            </div>
            <DashboardSortDropdown sortMode={sortMode} />
          </div>
        </section>
        {message ? <p className="admin-inline-message is-error">{message}</p> : null}
        {controls.mode === "admin" ? (
          <PendingSessionReview
            action={controls.confirmSessionAction}
            nextPath={controls.nextPath}
            sessions={pendingSessions}
          />
        ) : null}
        <SkillTimerGrid controls={controls} skills={skills} sortMode={sortMode} />
        <DashboardFooterHint />
      </main>
    </ChronosShell>
  );
}
