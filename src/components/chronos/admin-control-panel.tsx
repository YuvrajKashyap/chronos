import Link from "next/link";

import { formatSecondsAsTimer } from "@/lib/chronos/format-time";
import type { AdminTimerState } from "@/lib/chronos/admin-dashboard";
import { logoutFromChronos, startChronosTimer, stopChronosTimer } from "@/app/admin/actions";
import { LiveTimerValue } from "./live-timer-value";
import { AdminSkillCard } from "./admin-skill-card";
import { AdminSubmitButton } from "./admin-submit-button";

export function AdminControlPanel({
  state,
  message,
}: {
  state: AdminTimerState;
  message?: string | null;
}) {
  const activeSession = state.active_session;

  return (
    <main className="admin-main">
      <section className="admin-hero-panel" aria-labelledby="admin-title">
        <div>
          <p className="auth-kicker">Owner control shell</p>
          <h1 id="admin-title">Chronos Admin</h1>
          <p className="auth-copy">Start one focused timer, stop it cleanly, and let sessions remain the ledger.</p>
        </div>
        <div className="admin-identity">
          <span>Signed in as</span>
          <strong>{state.user?.email ?? "Unknown email"}</strong>
          <div className="auth-actions">
            <Link className="auth-primary-link" href="/">
              Public dashboard
            </Link>
            <form action={logoutFromChronos}>
              <AdminSubmitButton className="auth-outline-button" pendingLabel="Logging out">
                Logout
              </AdminSubmitButton>
            </form>
          </div>
        </div>
      </section>

      {message ? <p className="admin-inline-message is-error">{message}</p> : null}

      <section className={activeSession ? "active-timer-panel is-live" : "active-timer-panel"} aria-label="Active timer">
        <div>
          <span>{activeSession ? "Active timer" : "No active timer"}</span>
          <h2>{activeSession?.skill_name ?? "Ready when you are"}</h2>
          <p>
            {activeSession
              ? `${activeSession.is_private ? "Private" : "Public"} session started ${new Date(activeSession.started_at).toLocaleString()}`
              : "Only one timer can run at a time."}
          </p>
        </div>
        <div className="active-timer-readout">
          {activeSession ? (
            <LiveTimerValue
              className="admin-live-value"
              initialSeconds={activeSession.current_active_elapsed_seconds}
              startedAt={activeSession.started_at}
            />
          ) : (
            <span className="admin-live-value">00:00:00</span>
          )}
          {activeSession ? (
            <form action={stopChronosTimer}>
              <AdminSubmitButton className="auth-primary-link stop-action" pendingLabel="Stopping">
                Stop timer
              </AdminSubmitButton>
            </form>
          ) : null}
        </div>
      </section>

      <section className="admin-skill-grid" aria-label="Admin skill timers">
        {state.skills.map((skill) => (
          <AdminSkillCard
            key={skill.id}
            activeSkillId={activeSession?.skill_id ?? null}
            hasActiveTimer={Boolean(activeSession)}
            skill={skill}
            startAction={startChronosTimer}
          />
        ))}
      </section>

      <section className="recent-session-panel" aria-label="Recent sessions">
        <div className="recent-session-heading">
          <span>Recent sessions</span>
          <strong>{state.recent_sessions.length}</strong>
        </div>
        <div className="recent-session-list">
          {state.recent_sessions.length > 0 ? (
            state.recent_sessions.map((session) => (
              <div key={session.id} className="recent-session-row">
                <span>{session.skill_name}</span>
                <strong>{formatSecondsAsTimer(session.duration_seconds)}</strong>
              </div>
            ))
          ) : (
            <p>No sessions logged yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
