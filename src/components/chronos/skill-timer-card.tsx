import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { DashboardControls } from "./chronos-dashboard-page";
import { CardMotif } from "./card-motif";
import { LoginPromptButton } from "./login-prompt-button";
import { LiveTimerValue } from "./live-timer-value";
import { TimerSubmitButton } from "./timer-submit-button";

export function SkillTimerCard({
  controls,
  hasActiveTimer,
  skill,
}: {
  controls: DashboardControls;
  hasActiveTimer: boolean;
  skill: ChronosSkill;
}) {
  const Icon = skill.icon;
  const isDisabledStart = controls.mode === "admin" && hasActiveTimer && !skill.isActive;

  return (
    <article className={`skill-card accent-${skill.accent} ${skill.isActive ? "is-active" : ""}`}>
      <div className="card-glow" aria-hidden="true" />
      <div className="card-header-row">
        <div className="skill-icon">
          <Icon size={42} strokeWidth={1.85} aria-hidden="true" />
        </div>
        {skill.badge ? (
          <span className="live-badge">
            <span aria-hidden="true" />
            {skill.badge}
          </span>
        ) : null}
      </div>
      <div className="card-body">
        <h2>{skill.title}</h2>
        {!skill.isActive ? <p className="metric-label">{skill.label}</p> : null}
        {skill.isActive && skill.activeStartedAt ? (
          <LiveTimerValue
            className="metric-value active-value"
            initialSeconds={skill.initialElapsedSeconds}
            startedAt={skill.activeStartedAt}
          />
        ) : (
          <div className={skill.isActive ? "metric-value active-value" : "metric-value"}>{skill.value}</div>
        )}
        {skill.isActive ? <p className="metric-label">{skill.label}</p> : null}
      </div>
      <div className="card-rule" aria-hidden="true" />
      {controls.mode === "admin" ? (
        <form action={skill.isActive ? controls.stopAction : controls.startAction} className="timer-control-form">
          <input type="hidden" name="skillId" value={skill.id} />
          <input type="hidden" name="nextPath" value={controls.nextPath} />
          <TimerSubmitButton buttonLabel={isDisabledStart ? "Start" : skill.buttonLabel} disabled={isDisabledStart} />
        </form>
      ) : controls.mode === "login" ? (
        <LoginPromptButton buttonLabel={skill.buttonLabel} />
      ) : (
        <button className="timer-button" type="button">
          <span>{skill.buttonLabel}</span>
        </button>
      )}
      <CardMotif type={skill.motif} />
    </article>
  );
}
