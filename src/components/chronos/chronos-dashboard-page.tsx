import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { DashboardSortMode } from "@/lib/chronos/transform-dashboard";
import type { AdminPendingSession } from "@/lib/chronos/admin-dashboard";
import type {
  confirmChronosTimerSession,
  confirmChronosTimerSessionSmooth,
  createChronosSkill,
  deleteChronosSkill,
  reorderChronosSkills,
  startChronosTimer,
  startChronosTimerSmooth,
  stopChronosTimer,
  stopChronosTimerSmooth,
  updateChronosSkill,
} from "@/app/admin/actions";
import { ChronosShell } from "./chronos-shell";
import { DashboardSortDropdown } from "./dashboard-sort-dropdown";
import { DashboardFooterHint } from "./dashboard-footer-hint";
import { LiveTimerValue } from "./live-timer-value";
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
      reorderSkillAction: typeof reorderChronosSkills;
      nextPath: string;
    };

export function ChronosDashboardPage({
  activeSessionCount = 1,
  controls = { mode: "readonly" },
  downtimeSkill,
  isAuthenticated = false,
  idleSession,
  message,
  skills,
  sortMode = "custom",
}: {
  activeSessionCount?: number;
  controls?: DashboardControls;
  downtimeSkill?: ChronosSkill | null;
  idleSession?: {
    started_at: string;
    current_idle_elapsed_seconds: number;
  } | null;
  isAuthenticated?: boolean;
  message?: string | null;
  pendingSessions?: AdminPendingSession[];
  skills: ChronosSkill[];
  sortMode?: DashboardSortMode;
}) {
  const sessionLabel = activeSessionCount === 1 ? "1 active session" : `${activeSessionCount} active sessions`;
  const isIdleTracking = activeSessionCount === 0 && Boolean(idleSession);
  const showViewOnlyNote = controls.mode === "login";

  return (
    <ChronosShell isAuthenticated={isAuthenticated}>
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-label="Dashboard status">
          <div className={showViewOnlyNote ? "dashboard-status-bar has-view-only-note" : "dashboard-status-bar"}>
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
            <DashboardSortDropdown sortMode={sortMode} />
            {showViewOnlyNote ? (
              <span className="status-view-only-note">
                <span>Public view of Yuvraj's current stats.</span>
                <span>Editing is available only when Yuvraj signs in.</span>
                <span>P.S. The majority of these stats have only been tracked since Yuvraj turned 21. So some have been estimated.</span>
              </span>
            ) : null}
          </div>
        </section>
        {message ? <p className="admin-inline-message is-error">{message}</p> : null}
        <SkillTimerGrid controls={controls} downtimeSkill={downtimeSkill} idleSession={idleSession} skills={skills} sortMode={sortMode} />
        <DashboardFooterHint />
      </main>
    </ChronosShell>
  );
}
