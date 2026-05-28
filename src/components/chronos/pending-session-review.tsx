import type { confirmChronosTimerSession } from "@/app/admin/actions";
import type { AdminPendingSession } from "@/lib/chronos/admin-dashboard";
import { formatSecondsAsTimer } from "@/lib/chronos/format-time";
import { TimerDecisionButton } from "./timer-decision-button";

export function PendingSessionReview({
  action,
  nextPath,
  sessions,
}: {
  action: typeof confirmChronosTimerSession;
  nextPath: string;
  sessions: AdminPendingSession[];
}) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="pending-session-panel" aria-label="Stopped sessions awaiting lifetime decision">
      <div>
        <span>Stopped timer</span>
        <h2>Count this toward lifetime?</h2>
        <p>
          Lifetime totals are unchanged until you choose. Skipped sessions stay out of the public and admin totals.
        </p>
      </div>
      <div className="pending-session-list">
        {sessions.map((session) => (
          <div className="pending-session-row" key={session.id}>
            <div>
              <strong>{session.skill_name}</strong>
              <span>{formatSecondsAsTimer(session.duration_seconds)}</span>
            </div>
            <div className="session-decision-actions">
              <form action={action}>
                <input type="hidden" name="sessionId" value={session.id} />
                <input type="hidden" name="countTowardsLifetime" value="true" />
                <input type="hidden" name="nextPath" value={nextPath} />
                <TimerDecisionButton decision="count" />
              </form>
              <form action={action}>
                <input type="hidden" name="sessionId" value={session.id} />
                <input type="hidden" name="countTowardsLifetime" value="false" />
                <input type="hidden" name="nextPath" value={nextPath} />
                <TimerDecisionButton decision="skip" />
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
