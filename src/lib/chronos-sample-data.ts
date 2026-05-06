import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Dumbbell,
  Pencil,
  Search,
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
};

export const chronosSkills: ChronosSkill[] = [
  {
    id: "coding",
    title: "Coding",
    icon: Code2,
    accent: "coral",
    isActive: true,
    badge: "LIVE",
    label: "ELAPSED TIME",
    value: "02:14:36",
    buttonLabel: "Stop",
    motif: "contour",
  },
  {
    id: "fitness",
    title: "Fitness",
    icon: Dumbbell,
    accent: "blue",
    isActive: false,
    label: "LIFETIME TOTAL",
    value: "126:45:00",
    buttonLabel: "Start",
    motif: "flow",
  },
  {
    id: "business",
    title: "Business",
    icon: BriefcaseBusiness,
    accent: "amber",
    isActive: false,
    label: "LIFETIME TOTAL",
    value: "98:30:00",
    buttonLabel: "Start",
    motif: "branch",
  },
  {
    id: "content",
    title: "Content",
    icon: Pencil,
    accent: "violet",
    isActive: false,
    label: "LIFETIME TOTAL",
    value: "72:20:00",
    buttonLabel: "Start",
    motif: "quill",
  },
  {
    id: "research",
    title: "Research",
    icon: Search,
    accent: "teal",
    isActive: false,
    label: "LIFETIME TOTAL",
    value: "54:10:00",
    buttonLabel: "Start",
    motif: "mesh",
  },
  {
    id: "learning",
    title: "Learning",
    icon: BookOpen,
    accent: "indigo",
    isActive: false,
    label: "LIFETIME TOTAL",
    value: "88:15:00",
    buttonLabel: "Start",
    motif: "clouds",
  },
];
