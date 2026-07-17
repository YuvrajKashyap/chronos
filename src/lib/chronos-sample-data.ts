import {
  type LucideIcon,
} from "lucide-react";

export type SkillMotif = "contour" | "flow" | "branch" | "quill" | "mesh" | "clouds" | "campaign";

export type ChronosSkill = {
  id: string;
  slug?: string;
  title: string;
  iconKey?: string;
  icon: LucideIcon;
  accent: string;
  accentKey?: string;
  accentColor?: string;
  accentRgb?: string;
  visibility?: "public" | "private";
  iconEmoji?: string;
  isActive: boolean;
  badge?: string;
  label: string;
  value: string;
  buttonLabel: "Start" | "Stop";
  motif: SkillMotif;
  activeStartedAt?: string;
  initialElapsedSeconds?: number;
  lifetimeSeconds?: number | null;
  weeklyTargetSeconds?: number | null;
  targetSessionsPerWeek?: number | null;
  priorityWeight?: number | null;
  goalNote?: string | null;
};
