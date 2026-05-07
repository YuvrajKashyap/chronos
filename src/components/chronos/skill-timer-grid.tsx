import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { DashboardControls } from "./chronos-dashboard-page";
import { ReorderableSkillTimerGrid } from "./reorderable-skill-timer-grid";
import { SkillTimerCard } from "./skill-timer-card";

export function SkillTimerGrid({
  controls,
  skills,
}: {
  controls: DashboardControls;
  skills: ChronosSkill[];
}) {
  const hasActiveTimer = skills.some((skill) => skill.isActive);

  if (controls.mode === "admin") {
    return (
      <ReorderableSkillTimerGrid
        controls={{
          createSkillAction: controls.createSkillAction,
          nextPath: controls.nextPath,
          reorderSkillAction: controls.reorderSkillAction,
        }}
        skillIds={skills.map((skill) => skill.id)}
      >
        {skills.map((skill) => (
          <SkillTimerCard controls={controls} hasActiveTimer={hasActiveTimer} key={skill.id} skill={skill} />
        ))}
      </ReorderableSkillTimerGrid>
    );
  }

  return (
    <section className="skill-grid" aria-label="Skill timers">
      {skills.map((skill) => (
        <SkillTimerCard controls={controls} hasActiveTimer={hasActiveTimer} key={skill.id} skill={skill} />
      ))}
    </section>
  );
}
