import type { AdminSkill } from "@/lib/chronos/admin-dashboard";
import { formatSecondsAsTimer } from "@/lib/chronos/format-time";
import { AdminSubmitButton } from "./admin-submit-button";

const ACCENT_BY_KEY: Record<string, string> = {
  coding: "coral",
  fitness: "blue",
  business: "amber",
  content: "violet",
  research: "teal",
  learning: "indigo",
  downtime: "muted",
};

function getAccentClass(skill: AdminSkill) {
  const key = skill.accent_key?.toLowerCase() ?? skill.slug;
  return ACCENT_BY_KEY[key] ?? "coral";
}

export function AdminSkillCard({
  skill,
  activeSkillId,
  hasActiveTimer,
  startAction,
}: {
  skill: AdminSkill;
  activeSkillId: string | null;
  hasActiveTimer: boolean;
  startAction: (formData: FormData) => Promise<void>;
}) {
  const isActive = activeSkillId === skill.id;
  const isPrivate = skill.visibility !== "public" || skill.is_downtime;

  return (
    <article className={`admin-skill-card accent-${getAccentClass(skill)} ${isActive ? "is-active" : ""}`}>
      <div>
        <span className="admin-skill-meta">{isPrivate ? "Private" : "Public"}</span>
        <h2>{skill.name}</h2>
        <p>{skill.is_downtime ? "Downtime stays private." : "Productive time appears publicly."}</p>
      </div>
      <div className="admin-skill-total">
        <span>Lifetime</span>
        <strong>{formatSecondsAsTimer(skill.lifetime_seconds)}</strong>
      </div>
      <form action={startAction}>
        <input type="hidden" name="skillId" value={skill.id} />
        <AdminSubmitButton
          className="admin-skill-action"
          disabled={hasActiveTimer}
          pendingLabel="Starting"
        >
          {isActive ? "Running" : hasActiveTimer ? "Timer active" : "Start"}
        </AdminSubmitButton>
      </form>
    </article>
  );
}
