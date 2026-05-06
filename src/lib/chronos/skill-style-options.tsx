import {
  Activity,
  AlarmClock,
  Apple,
  Archive,
  Atom,
  BadgeCheck,
  Banknote,
  Bed,
  Bike,
  Blocks,
  BookMarked,
  BookOpen,
  Bot,
  Box,
  Brain,
  BriefcaseBusiness,
  Brush,
  Bus,
  Calculator,
  CalendarCheck,
  Camera,
  Car,
  ChartNoAxesCombined,
  ChefHat,
  Church,
  CircuitBoard,
  Clapperboard,
  ClipboardList,
  Cloud,
  Code2,
  Coffee,
  Compass,
  CookingPot,
  Cpu,
  Crown,
  Crosshair,
  Database,
  Dices,
  Dog,
  Dumbbell,
  Eye,
  Film,
  Flame,
  Flower2,
  FolderKanban,
  Gamepad2,
  Gem,
  Globe2,
  Goal,
  GraduationCap,
  Guitar,
  Hammer,
  Handshake,
  Headphones,
  Heart,
  HeartPulse,
  Home,
  Joystick,
  KeyRound,
  Languages,
  Laptop,
  Leaf,
  Lightbulb,
  LineChart,
  LockKeyhole,
  Mail,
  Map as MapIcon,
  MapPinned,
  Megaphone,
  MessagesSquare,
  Mic,
  Monitor,
  Mountain,
  Music,
  Network,
  Newspaper,
  NotebookPen,
  Package,
  Paintbrush,
  Palette,
  Pencil,
  Phone,
  PiggyBank,
  Plane,
  Podcast,
  Presentation,
  Puzzle,
  Radio,
  Rocket,
  Salad,
  Scale,
  Scissors,
  Search,
  Send,
  Server,
  ShieldCheck,
  Ship,
  Shirt,
  ShoppingBag,
  Soup,
  Sparkles,
  Sprout,
  Stethoscope,
  Target,
  Tent,
  Train,
  TrendingUp,
  Trees,
  Trophy,
  Users,
  Wallet,
  Waves,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { forwardRef, type ComponentProps } from "react";

import type { SkillMotif } from "@/lib/chronos-sample-data";

export type SkillAccentKey = "coral" | "blue" | "amber" | "violet" | "teal" | "indigo";

export type SkillIconOption = {
  key: string;
  label: string;
  category: "Core" | "Creative" | "Work" | "Learning" | "Wellness" | "Life" | "Travel" | "Tech";
  icon: LucideIcon;
};

export type SkillStyle = {
  icon: LucideIcon;
  emoji?: string;
  accent: SkillAccentKey;
  motif: SkillMotif;
};

export const ACCENT_OPTIONS: Array<{ key: SkillAccentKey; label: string; motif: SkillMotif }> = [
  { key: "coral", label: "Coral", motif: "contour" },
  { key: "blue", label: "Blue", motif: "flow" },
  { key: "amber", label: "Amber", motif: "branch" },
  { key: "violet", label: "Violet", motif: "quill" },
  { key: "teal", label: "Teal", motif: "mesh" },
  { key: "indigo", label: "Indigo", motif: "clouds" },
];

export const CUSTOM_EMOJI_OPTIONS = [
  "✨",
  "⭐",
  "🔥",
  "⚡",
  "💎",
  "🎯",
  "🧠",
  "💡",
  "📚",
  "✍️",
  "🎨",
  "🎧",
  "🎙️",
  "📷",
  "🎬",
  "💻",
  "🧪",
  "🔬",
  "📈",
  "💼",
  "🏆",
  "🎾",
  "🏃",
  "🏋️",
  "🧘",
  "🥗",
  "☕",
  "🌱",
  "🏠",
  "✈️",
  "🗺️",
  "🧰",
];

const TennisRacketIcon = forwardRef<SVGSVGElement, ComponentProps<LucideIcon>>(function TennisRacketIcon(
  {
    size = 24,
    strokeWidth = 2,
    ...props
  },
  ref,
) {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="9" cy="8" rx="4.4" ry="6.1" transform="rotate(-34 9 8)" />
      <path d="m12.1 12.8 7 7" />
      <path d="m16.4 18.3 1.9-1.9" />
      <path d="M6.3 4.2 12.8 10.7" opacity="0.55" />
      <path d="M4.8 7.4 9.6 12.2" opacity="0.55" />
      <path d="M8.6 2.9 14.2 8.5" opacity="0.55" />
      <circle cx="17.8" cy="6.2" r="2.1" />
    </svg>
  );
});

export const ICON_OPTIONS: SkillIconOption[] = [
  { key: "code", label: "Code", category: "Core", icon: Code2 },
  { key: "dumbbell", label: "Fitness", category: "Core", icon: Dumbbell },
  { key: "briefcase", label: "Business", category: "Core", icon: BriefcaseBusiness },
  { key: "pencil", label: "Writing", category: "Core", icon: Pencil },
  { key: "search", label: "Research", category: "Core", icon: Search },
  { key: "book", label: "Learning", category: "Core", icon: BookOpen },
  { key: "custom", label: "Custom", category: "Core", icon: Sparkles },
  { key: "tennis", label: "Tennis", category: "Core", icon: TennisRacketIcon },
  { key: "target", label: "Target", category: "Core", icon: Target },
  { key: "trophy", label: "Trophy", category: "Core", icon: Trophy },
  { key: "goal", label: "Goal", category: "Core", icon: Goal },
  { key: "sparkles", label: "Spark", category: "Core", icon: Sparkles },
  { key: "flame", label: "Flame", category: "Core", icon: Flame },
  { key: "lightbulb", label: "Idea", category: "Core", icon: Lightbulb },
  { key: "brain", label: "Brain", category: "Core", icon: Brain },
  { key: "activity", label: "Activity", category: "Core", icon: Activity },
  { key: "alarm", label: "Time", category: "Core", icon: AlarmClock },
  { key: "calendar", label: "Schedule", category: "Core", icon: CalendarCheck },
  { key: "badgecheck", label: "Habit", category: "Core", icon: BadgeCheck },
  { key: "crown", label: "Priority", category: "Core", icon: Crown },
  { key: "gem", label: "Value", category: "Core", icon: Gem },
  { key: "key", label: "Key", category: "Core", icon: KeyRound },
  { key: "lock", label: "Focus", category: "Core", icon: LockKeyhole },
  { key: "eye", label: "Review", category: "Core", icon: Eye },
  { key: "atom", label: "Science", category: "Core", icon: Atom },
  { key: "calculator", label: "Numbers", category: "Core", icon: Calculator },
  { key: "send", label: "Ship", category: "Core", icon: Send },
  { key: "network", label: "Network", category: "Core", icon: Network },
  { key: "bike", label: "Cycling", category: "Core", icon: Bike },
  { key: "waves", label: "Water", category: "Core", icon: Waves },
  { key: "crosshair", label: "Precision", category: "Core", icon: Crosshair },
  { key: "music", label: "Music", category: "Creative", icon: Music },
  { key: "guitar", label: "Guitar", category: "Creative", icon: Guitar },
  { key: "mic", label: "Voice", category: "Creative", icon: Mic },
  { key: "camera", label: "Photo", category: "Creative", icon: Camera },
  { key: "film", label: "Film", category: "Creative", icon: Film },
  { key: "clapperboard", label: "Video", category: "Creative", icon: Clapperboard },
  { key: "palette", label: "Art", category: "Creative", icon: Palette },
  { key: "paintbrush", label: "Design", category: "Creative", icon: Paintbrush },
  { key: "brush", label: "Craft", category: "Creative", icon: Brush },
  { key: "scissors", label: "Making", category: "Creative", icon: Scissors },
  { key: "presentation", label: "Presentation", category: "Work", icon: Presentation },
  { key: "handshake", label: "Sales", category: "Work", icon: Handshake },
  { key: "users", label: "People", category: "Work", icon: Users },
  { key: "clipboard", label: "Operations", category: "Work", icon: ClipboardList },
  { key: "kanban", label: "Projects", category: "Work", icon: FolderKanban },
  { key: "chart", label: "Analytics", category: "Work", icon: ChartNoAxesCombined },
  { key: "trending", label: "Growth", category: "Work", icon: TrendingUp },
  { key: "banknote", label: "Money", category: "Work", icon: Banknote },
  { key: "wallet", label: "Finance", category: "Work", icon: Wallet },
  { key: "notebook", label: "Notes", category: "Learning", icon: NotebookPen },
  { key: "bookmarked", label: "Reading", category: "Learning", icon: BookMarked },
  { key: "newspaper", label: "News", category: "Learning", icon: Newspaper },
  { key: "graduation", label: "Study", category: "Learning", icon: GraduationCap },
  { key: "languages", label: "Language", category: "Learning", icon: Languages },
  { key: "brain", label: "Thinking", category: "Learning", icon: Brain },
  { key: "heartpulse", label: "Health", category: "Wellness", icon: HeartPulse },
  { key: "stethoscope", label: "Medical", category: "Wellness", icon: Stethoscope },
  { key: "heart", label: "Care", category: "Wellness", icon: Heart },
  { key: "bed", label: "Sleep", category: "Wellness", icon: Bed },
  { key: "shield", label: "Discipline", category: "Wellness", icon: ShieldCheck },
  { key: "badgecheck", label: "Habit", category: "Wellness", icon: BadgeCheck },
  { key: "cooking", label: "Cooking", category: "Life", icon: CookingPot },
  { key: "chefhat", label: "Chef", category: "Life", icon: ChefHat },
  { key: "soup", label: "Meals", category: "Life", icon: Soup },
  { key: "salad", label: "Nutrition", category: "Life", icon: Salad },
  { key: "apple", label: "Food", category: "Life", icon: Apple },
  { key: "coffee", label: "Coffee", category: "Life", icon: Coffee },
  { key: "home", label: "Home", category: "Life", icon: Home },
  { key: "wrench", label: "Repair", category: "Life", icon: Wrench },
  { key: "hammer", label: "Build", category: "Life", icon: Hammer },
  { key: "shirt", label: "Style", category: "Life", icon: Shirt },
  { key: "shopping", label: "Shopping", category: "Life", icon: ShoppingBag },
  { key: "sprout", label: "Growth", category: "Life", icon: Sprout },
  { key: "leaf", label: "Nature", category: "Life", icon: Leaf },
  { key: "flower", label: "Garden", category: "Life", icon: Flower2 },
  { key: "trees", label: "Outdoors", category: "Life", icon: Trees },
  { key: "dog", label: "Pets", category: "Life", icon: Dog },
  { key: "plane", label: "Flights", category: "Travel", icon: Plane },
  { key: "car", label: "Driving", category: "Travel", icon: Car },
  { key: "train", label: "Train", category: "Travel", icon: Train },
  { key: "bus", label: "Transit", category: "Travel", icon: Bus },
  { key: "ship", label: "Trips", category: "Travel", icon: Ship },
  { key: "map", label: "Map", category: "Travel", icon: MapIcon },
  { key: "mappin", label: "Places", category: "Travel", icon: MapPinned },
  { key: "compass", label: "Explore", category: "Travel", icon: Compass },
  { key: "mountain", label: "Hiking", category: "Travel", icon: Mountain },
  { key: "tent", label: "Camping", category: "Travel", icon: Tent },
  { key: "laptop", label: "Laptop", category: "Tech", icon: Laptop },
  { key: "monitor", label: "Desk", category: "Tech", icon: Monitor },
  { key: "database", label: "Data", category: "Tech", icon: Database },
  { key: "server", label: "Server", category: "Tech", icon: Server },
  { key: "cloud", label: "Cloud", category: "Tech", icon: Cloud },
  { key: "cpu", label: "Systems", category: "Tech", icon: Cpu },
  { key: "circuit", label: "Hardware", category: "Tech", icon: CircuitBoard },
  { key: "bot", label: "AI", category: "Tech", icon: Bot },
  { key: "rocket", label: "Launch", category: "Tech", icon: Rocket },
  { key: "gamepad", label: "Gaming", category: "Tech", icon: Gamepad2 },
  { key: "joystick", label: "Play", category: "Tech", icon: Joystick },
  { key: "wifi", label: "Network", category: "Tech", icon: Wifi },
  { key: "phone", label: "Phone", category: "Tech", icon: Phone },
  { key: "mail", label: "Email", category: "Tech", icon: Mail },
  { key: "messages", label: "Messages", category: "Tech", icon: MessagesSquare },
  { key: "podcast", label: "Podcast", category: "Tech", icon: Podcast },
  { key: "radio", label: "Radio", category: "Tech", icon: Radio },
  { key: "headphones", label: "Audio", category: "Tech", icon: Headphones },
  { key: "megaphone", label: "Marketing", category: "Tech", icon: Megaphone },
  { key: "globe", label: "World", category: "Tech", icon: Globe2 },
  { key: "package", label: "Package", category: "Life", icon: Package },
  { key: "box", label: "Inventory", category: "Life", icon: Box },
  { key: "blocks", label: "Blocks", category: "Creative", icon: Blocks },
  { key: "puzzle", label: "Puzzle", category: "Creative", icon: Puzzle },
  { key: "dices", label: "Games", category: "Tech", icon: Dices },
  { key: "archive", label: "Archive", category: "Work", icon: Archive },
  { key: "scale", label: "Legal", category: "Work", icon: Scale },
  { key: "church", label: "Spiritual", category: "Life", icon: Church },
  { key: "calendar", label: "Schedule", category: "Work", icon: CalendarCheck },
];

const ICONS_BY_KEY = new Map(ICON_OPTIONS.map((option) => [option.key, option]));
const ACCENTS_BY_KEY = new Map(ACCENT_OPTIONS.map((option) => [option.key, option]));

const ALIASES: Record<string, string> = {
  ad: "megaphone",
  ads: "megaphone",
  adtracker: "megaphone",
  advertising: "megaphone",
  bookopen: "book",
  briefcasebusiness: "briefcase",
  business: "briefcase",
  campaign: "megaphone",
  campaigns: "megaphone",
  coding: "code",
  content: "pencil",
  dumbbell: "dumbbell",
  fitness: "dumbbell",
  learning: "book",
  marketing: "megaphone",
  metaads: "megaphone",
  paidads: "megaphone",
  research: "search",
};

const ACCENT_ALIASES: Record<string, SkillAccentKey> = {
  ad: "amber",
  ads: "amber",
  adtracker: "amber",
  advertising: "amber",
  book: "indigo",
  bookopen: "indigo",
  briefcase: "amber",
  briefcasebusiness: "amber",
  business: "amber",
  campaign: "amber",
  campaigns: "amber",
  code: "coral",
  code2: "coral",
  coding: "coral",
  content: "violet",
  dumbbell: "blue",
  fitness: "blue",
  learning: "indigo",
  marketing: "amber",
  megaphone: "amber",
  metaads: "amber",
  paidads: "amber",
  pencil: "violet",
  research: "teal",
  search: "teal",
};

export function normalizeSkillKey(value: string | null | undefined) {
  return value?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

export function getSkillIconOption(key: string | null | undefined) {
  const normalized = normalizeSkillKey(key);
  return ICONS_BY_KEY.get(ALIASES[normalized] ?? normalized) ?? ICONS_BY_KEY.get("sparkles") ?? ICON_OPTIONS[0];
}

export function getSkillEmoji(key: string | null | undefined) {
  if (!key?.startsWith("emoji:")) {
    return null;
  }

  return key.slice("emoji:".length) || null;
}

function findSkillIconOption(key: string | null | undefined) {
  const normalized = normalizeSkillKey(key);
  return ICONS_BY_KEY.get(ALIASES[normalized] ?? normalized) ?? null;
}

export function getSkillAccentOption(key: string | null | undefined) {
  const normalized = normalizeSkillKey(key);
  return ACCENTS_BY_KEY.get((ACCENT_ALIASES[normalized] ?? normalized) as SkillAccentKey) ?? ACCENT_OPTIONS[0];
}

function findSkillAccentOption(key: string | null | undefined) {
  const normalized = normalizeSkillKey(key);
  return ACCENTS_BY_KEY.get((ACCENT_ALIASES[normalized] ?? normalized) as SkillAccentKey) ?? null;
}

export function resolveSkillStyle({
  accentKey,
  iconKey,
  name,
  slug,
}: {
  accentKey?: string | null;
  iconKey?: string | null;
  name?: string | null;
  slug?: string | null;
}): SkillStyle {
  const iconOption = [iconKey, slug, name].map(findSkillIconOption).find(Boolean) ?? getSkillIconOption("sparkles");
  const accentOption = [accentKey, iconKey, slug, name].map(findSkillAccentOption).find(Boolean) ?? getSkillAccentOption("coral");

  return {
    icon: iconOption.icon,
    emoji: getSkillEmoji(iconKey) ?? undefined,
    accent: accentOption.key,
    motif: iconOption.key === "megaphone" ? "campaign" : accentOption.motif,
  };
}
