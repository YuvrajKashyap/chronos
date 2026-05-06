import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { CSSProperties } from "react";
import type { DashboardControls } from "./chronos-dashboard-page";
import { CardMotif } from "./card-motif";
import { LoginPromptButton } from "./login-prompt-button";
import { SkillCardFrame } from "./skill-card-frame";
import { TimerCardRuntime } from "./smooth-timer-control";

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
  const cardStyle =
    skill.accentColor && skill.accentRgb
      ? ({
          "--accent": skill.accentColor,
          "--accent-rgb": skill.accentRgb,
        } as CSSProperties)
      : undefined;

  return (
    <SkillCardFrame
      className={cardClassName}
      style={cardStyle}
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
              weeklyTargetSeconds: skill.weeklyTargetSeconds,
              targetSessionsPerWeek: skill.targetSessionsPerWeek,
              priorityWeight: skill.priorityWeight,
              goalNote: skill.goalNote,
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
        {controls.mode !== "admin" && skill.badge ? (
          <span className="live-badge">
            <span aria-hidden="true" />
            {skill.badge}
          </span>
        ) : null}
      </div>
      {controls.mode === "admin" ? (
        <TimerCardRuntime
          activeStartedAt={skill.activeStartedAt}
          buttonLabel={isDisabledStart ? "Start" : skill.buttonLabel}
          confirmAction={controls.confirmSessionSmoothAction}
          disabled={isDisabledStart}
          initialElapsedSeconds={skill.initialElapsedSeconds}
          initialIsActive={skill.isActive}
          label={skill.label}
          skillId={skill.id}
          skillName={skill.title}
          startAction={controls.startSmoothAction}
          stopAction={controls.stopSmoothAction}
          value={skill.value}
        />
      ) : (
        <>
          <div className="card-body">
            <h2>{skill.title}</h2>
            {!skill.isActive ? <p className="metric-label">{skill.label}</p> : null}
            <div className={skill.isActive ? "metric-value active-value" : "metric-value"}>{skill.value}</div>
            {skill.isActive ? <p className="metric-label">{skill.label}</p> : null}
          </div>
          <div className="card-rule" aria-hidden="true" />
          {controls.mode === "login" ? (
            <LoginPromptButton buttonLabel={skill.buttonLabel} />
          ) : (
            <button className="timer-button" type="button">
              <span>{skill.buttonLabel}</span>
            </button>
          )}
        </>
      )}
      <CardMotif type={skill.motif} />
    </SkillCardFrame>
  );
}
