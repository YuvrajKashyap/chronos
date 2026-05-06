import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { AdminPendingSession } from "@/lib/chronos/admin-dashboard";
import type {
  confirmChronosTimerSession,
  confirmChronosTimerSessionSmooth,
  createChronosSkill,
  deleteChronosSkill,
  startChronosTimer,
  startChronosTimerSmooth,
  stopChronosTimer,
  stopChronosTimerSmooth,
  updateChronosSkill,
} from "@/app/admin/actions";
import { ChronosShell } from "./chronos-shell";
import { DashboardFooterHint } from "./dashboard-footer-hint";
import { LiveTimerValue } from "./live-timer-value";
import { PendingSessionReview } from "./pending-session-review";
import { SkillTimerGrid } from "./skill-timer-grid";

export type DashboardControls =
  | { mode: "readonly" }
  | { mode: "login" }
  | {
      mode: "admin";
      startAction: typeof startChronosTimer;
      startSmoothAction: typeof startChronosTimerSmooth;
      stopAction: typeof stopChronosTimer;
      stopSmoothAction: typeof stopChronosTimerSmooth;
      confirmSessionAction: typeof confirmChronosTimerSession;
      confirmSessionSmoothAction: typeof confirmChronosTimerSessionSmooth;
      createSkillAction: typeof createChronosSkill;
      updateSkillAction: typeof updateChronosSkill;
      deleteSkillAction: typeof deleteChronosSkill;
      nextPath: string;
    };

export function ChronosDashboardPage({
  activeSessionCount = 1,
  controls = { mode: "readonly" },
  isAuthenticated = false,
  idleSession,
  message,
  pendingSessions = [],
  skills,
}: {
  activeSessionCount?: number;
  controls?: DashboardControls;
  idleSession?: {
    started_at: string;
    current_idle_elapsed_seconds: number;
  } | null;
  isAuthenticated?: boolean;
  message?: string | null;
  pendingSessions?: AdminPendingSession[];
  skills: ChronosSkill[];
}) {
  const sessionLabel = activeSessionCount === 1 ? "1 active session" : `${activeSessionCount} active sessions`;
  const isIdleTracking = activeSessionCount === 0 && Boolean(idleSession);

  return (
    <ChronosShell isAuthenticated={isAuthenticated}>
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-label="Dashboard status">
          <div className="status-row">
            <span className="status-dot" aria-hidden="true" />
            <span>{isIdleTracking ? "Idle tracking active" : sessionLabel}</span>
            {isIdleTracking && idleSession ? (
              <LiveTimerValue
                className="status-live-value"
                initialSeconds={idleSession.current_idle_elapsed_seconds}
                startedAt={idleSession.started_at}
              />
            ) : null}
          </div>
        </section>
        {message ? <p className="admin-inline-message is-error">{message}</p> : null}
        {controls.mode === "admin" ? (
          <PendingSessionReview
            action={controls.confirmSessionSmoothAction}
            sessions={pendingSessions}
          />
        ) : null}
        <SkillTimerGrid controls={controls} skills={skills} />
        <DashboardFooterHint />
      </main>
    </ChronosShell>
  );
}
