import { Moon } from "lucide-react";

import type { ChronosSkill } from "@/lib/chronos-sample-data";
import { formatSecondsAsTimer } from "@/lib/chronos/format-time";
import { CardMotif } from "./card-motif";
import { LiveTimerValue } from "./live-timer-value";

type DowntimeTimerCardProps = {
  idleSession?: {
    started_at: string;
    current_idle_elapsed_seconds: number;
  } | null;
  skill: ChronosSkill;
};

export function DowntimeTimerCard({ idleSession, skill }: DowntimeTimerCardProps) {
  const isTracking = Boolean(idleSession);
  const lifetimeSeconds = Math.max(0, Math.floor(skill.lifetimeSeconds ?? 0));

  return (
    <article className={isTracking ? "skill-card downtime-card is-auto-tracking" : "skill-card downtime-card"} aria-label="Downtime auto tracker">
      <div className="card-glow" aria-hidden="true" />
      <div className="downtime-orbit" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="card-header-row">
        <div className="skill-icon downtime-icon">
          <Moon size={42} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <span className={isTracking ? "live-badge downtime-badge" : "live-badge downtime-badge is-muted"}>
          <span aria-hidden="true" />
          {isTracking ? "AUTO" : "READY"}
        </span>
      </div>
      <div className="card-body downtime-body">
        <h2>Downtime</h2>
        <p className="metric-label">{isTracking ? "AUTO TRACKING NOW" : "LIFETIME DOWNTIME"}</p>
        {idleSession ? (
          <LiveTimerValue
            className="metric-value active-value"
            initialSeconds={idleSession.current_idle_elapsed_seconds}
            startedAt={idleSession.started_at}
          />
        ) : (
          <div className="metric-value">{formatSecondsAsTimer(lifetimeSeconds)}</div>
        )}
        <p className="downtime-copy">
          {isTracking ? "No skill timer is active, so this is being counted automatically." : "Starts itself when every skill timer is stopped."}
        </p>
      </div>
      <div className="card-rule" aria-hidden="true" />
      <div className="downtime-auto-panel" aria-hidden="true">
        <span>No manual controls</span>
      </div>
      <CardMotif type="clouds" />
    </article>
  );
}
