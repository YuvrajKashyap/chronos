import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { DashboardControls } from "./chronos-dashboard-page";
import { CardMotif } from "./card-motif";
import { LoginPromptButton } from "./login-prompt-button";
import { LiveTimerValue } from "./live-timer-value";
import { SkillCardFrame } from "./skill-card-frame";
import { TimerSubmitButton } from "./timer-submit-button";

function isAdTracker(skill: ChronosSkill) {
  const normalized = [skill.title, skill.slug, skill.iconKey]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

  return /\b(ad|ads|advertising|marketing|campaign|campaigns)\b/.test(normalized) || normalized.includes("paid ads");
}

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
  const cardClassName = [
    "skill-card",
    `accent-${skill.accent}`,
    skill.isActive ? "is-active" : "",
    isAdTracker(skill) ? "is-ad-tracker-card" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SkillCardFrame
      className={cardClassName}
      manage={
        controls.mode === "admin"
          ? {
              accentKey: skill.accentKey,
              deleteAction: controls.deleteSkillAction,
              iconKey: skill.iconKey,
              id: skill.id,
              isActive: skill.isActive,
              lifetimeSeconds: skill.lifetimeSeconds,
              name: skill.title,
              nextPath: controls.nextPath,
              updateAction: controls.updateSkillAction,
              visibility: skill.visibility,
            }
          : undefined
      }
    >
      <div className="card-glow" aria-hidden="true" />
      {isAdTracker(skill) ? (
        <div className="ad-tracker-signal" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}
      <div className="card-header-row">
        <div className="skill-icon">
          {skill.iconEmoji ? (
            <span className="skill-emoji-icon" aria-hidden="true">
              {skill.iconEmoji}
            </span>
          ) : (
            <Icon size={42} strokeWidth={1.85} aria-hidden="true" />
          )}
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
    </SkillCardFrame>
  );
}
