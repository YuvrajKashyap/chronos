import { chronosSkills } from "@/lib/chronos-sample-data";
import { SkillTimerCard } from "./skill-timer-card";

export function SkillTimerGrid() {
  return (
    <section className="skill-grid" aria-label="Skill timers">
      {chronosSkills.map((skill) => (
        <SkillTimerCard key={skill.id} skill={skill} />
      ))}
    </section>
  );
}
