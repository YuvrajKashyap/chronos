import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { DashboardSortMode } from "@/lib/chronos/transform-dashboard";
import { AddSkillCard } from "./add-skill-card";
import type { DashboardControls } from "./chronos-dashboard-page";
import { DowntimeTimerCard } from "./downtime-timer-card";
import { ReorderableSkillTimerGrid } from "./reorderable-skill-timer-grid";
import { SkillTimerCard } from "./skill-timer-card";

export function SkillTimerGrid({
  controls,
  downtimeSkill,
  idleSession,
  skills,
  sortMode,
}: {
  controls: DashboardControls;
  downtimeSkill?: ChronosSkill | null;
  idleSession?: {
    started_at: string;
    current_idle_elapsed_seconds: number;
  } | null;
  skills: ChronosSkill[];
  sortMode: DashboardSortMode;
}) {
  const hasActiveTimer = skills.some((skill) => skill.isActive);
  const skillCards = skills.map((skill) => (
    <SkillTimerCard controls={controls} hasActiveTimer={hasActiveTimer} key={skill.id} skill={skill} />
  ));

  if (controls.mode === "admin" && sortMode === "custom") {
    return (
      <ReorderableSkillTimerGrid
        controls={{
          createSkillAction: controls.createSkillAction,
          nextPath: controls.nextPath,
          reorderSkillAction: controls.reorderSkillAction,
        }}
        fixedChildren={
          downtimeSkill ? (
            <DowntimeTimerCard idleSession={idleSession} lifetimeSeconds={downtimeSkill.lifetimeSeconds} />
          ) : null
        }
        skillIds={skills.map((skill) => skill.id)}
      >
        {skillCards}
      </ReorderableSkillTimerGrid>
    );
  }

  if (controls.mode === "admin") {
    return (
      <section className="skill-grid" aria-label="Skill timers">
        {skillCards}
        {downtimeSkill ? (
          <DowntimeTimerCard idleSession={idleSession} lifetimeSeconds={downtimeSkill.lifetimeSeconds} />
        ) : null}
        <AddSkillCard action={controls.createSkillAction} nextPath={controls.nextPath} />
      </section>
    );
  }

  return (
    <section className="skill-grid" aria-label="Skill timers">
      {skillCards}
    </section>
  );
}
