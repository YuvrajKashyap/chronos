import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Dumbbell,
  Pencil,
  Search,
  type LucideIcon,
} from "lucide-react";

import type { ChronosSkill, SkillMotif } from "@/lib/chronos-sample-data";
import { formatSecondsAsTimer } from "@/lib/chronos/format-time";
import type { PublicDashboardPayload, PublicDashboardSkill } from "@/lib/chronos/public-dashboard";

type SkillStyle = {
  icon: LucideIcon;
  accent: string;
  motif: SkillMotif;
};

const DEFAULT_STYLE: SkillStyle = {
  icon: Code2,
  accent: "coral",
  motif: "contour",
};

const STYLE_BY_KEY: Record<string, SkillStyle> = {
  coding: { icon: Code2, accent: "coral", motif: "contour" },
  code: { icon: Code2, accent: "coral", motif: "contour" },
  code2: { icon: Code2, accent: "coral", motif: "contour" },
  fitness: { icon: Dumbbell, accent: "blue", motif: "flow" },
  dumbbell: { icon: Dumbbell, accent: "blue", motif: "flow" },
  business: { icon: BriefcaseBusiness, accent: "amber", motif: "branch" },
  briefcase: { icon: BriefcaseBusiness, accent: "amber", motif: "branch" },
  content: { icon: Pencil, accent: "violet", motif: "quill" },
  pencil: { icon: Pencil, accent: "violet", motif: "quill" },
  research: { icon: Search, accent: "teal", motif: "mesh" },
  search: { icon: Search, accent: "teal", motif: "mesh" },
  learning: { icon: BookOpen, accent: "indigo", motif: "clouds" },
  book: { icon: BookOpen, accent: "indigo", motif: "clouds" },
  bookopen: { icon: BookOpen, accent: "indigo", motif: "clouds" },
};

const ACCENT_KEYS = new Set(["coral", "blue", "amber", "violet", "teal", "indigo"]);

function normalizeKey(value: string | null | undefined) {
  return value?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function resolveStyle(skill: PublicDashboardSkill): SkillStyle {
  const keys = [
    skill.icon_key,
    skill.accent_key,
    skill.slug,
    skill.name,
  ].map(normalizeKey);

  const matched = keys.map((key) => STYLE_BY_KEY[key]).find(Boolean);
  const accentKey = normalizeKey(skill.accent_key);

  return {
    ...(matched ?? DEFAULT_STYLE),
    accent: ACCENT_KEYS.has(accentKey) ? accentKey : (matched ?? DEFAULT_STYLE).accent,
  };
}

export function hasUsefulPublicDashboardData(payload: PublicDashboardPayload | null) {
  return Array.isArray(payload?.skills) && payload.skills.length > 0;
}

export function getPublicActiveSessionCount(payload: PublicDashboardPayload | null) {
  if (!payload?.skills?.length) {
    return payload?.active_session ? 1 : 0;
  }

  return payload.skills.filter((skill) => {
    return Boolean(skill.active_session_started_at || skill.current_active_elapsed_seconds);
  }).length;
}

export function transformPublicDashboardToSkills(payload: PublicDashboardPayload): ChronosSkill[] {
  return [...(payload.skills ?? [])]
    .sort((a, b) => {
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name ?? "").localeCompare(b.name ?? "");
    })
    .map((skill) => {
      const style = resolveStyle(skill);
      const isActive = Boolean(skill.active_session_started_at || skill.current_active_elapsed_seconds);
      const initialElapsedSeconds = skill.current_active_elapsed_seconds ?? 0;

      return {
        id: skill.slug ?? skill.id ?? skill.name ?? "skill",
        title: skill.name ?? skill.slug ?? "Skill",
        icon: style.icon,
        accent: style.accent,
        isActive,
        badge: isActive ? "LIVE" : undefined,
        label: isActive ? "ELAPSED TIME" : "LIFETIME TOTAL",
        value: formatSecondsAsTimer(isActive ? initialElapsedSeconds : skill.lifetime_seconds),
        buttonLabel: isActive ? "Stop" : "Start",
        motif: style.motif,
        activeStartedAt: skill.active_session_started_at ?? undefined,
        initialElapsedSeconds,
      };
    });
}
