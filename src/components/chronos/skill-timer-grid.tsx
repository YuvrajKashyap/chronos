import type { ChronosSkill } from "@/lib/chronos-sample-data";
import { SkillTimerCard } from "./skill-timer-card";

export function SkillTimerGrid({ skills }: { skills: ChronosSkill[] }) {
  return (
    <section className="skill-grid" aria-label="Skill timers">
      {skills.map((skill) => (
        <SkillTimerCard key={skill.id} skill={skill} />
      ))}
    </section>
  );
}
