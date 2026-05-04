import { Play, Square } from "lucide-react";
import type { ChronosSkill } from "@/lib/chronos-sample-data";
import { CardMotif } from "./card-motif";
import { LiveTimerValue } from "./live-timer-value";

export function SkillTimerCard({ skill }: { skill: ChronosSkill }) {
  const Icon = skill.icon;
  const ButtonIcon = skill.buttonLabel === "Stop" ? Square : Play;

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
      <button className="timer-button" type="button">
        <ButtonIcon size={22} fill="currentColor" aria-hidden="true" />
        <span>{skill.buttonLabel}</span>
      </button>
      <CardMotif type={skill.motif} />
    </article>
  );
}
