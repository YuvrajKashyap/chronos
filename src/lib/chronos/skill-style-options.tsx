import * as LucideIcons from "lucide-react";
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
  School,
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
export type SkillAccentSelection = SkillAccentKey | "custom";

export type SkillIconOption = {
  key: string;
  label: string;
  category: "Core" | "Creative" | "Work" | "Learning" | "Wellness" | "Life" | "Travel" | "Tech";
  icon: LucideIcon;
};

export type SkillStyle = {
  icon: LucideIcon;
  emoji?: string;
  accent: SkillAccentSelection;
  accentColor?: string;
  accentRgb?: string;
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

export const SKILL_MOTIF_OPTIONS: Array<{ key: SkillMotif; label: string }> = [
  { key: "contour", label: "Lines" },
  { key: "flow", label: "Flow" },
  { key: "branch", label: "Leaf" },
  { key: "quill", label: "Quill" },
  { key: "mesh", label: "Mesh" },
  { key: "clouds", label: "Clouds" },
  { key: "campaign", label: "Signal" },
];

export const CUSTOM_EMOJI_OPTIONS = [
  "\u2728",
  "\u2B50",
  "\u{1F525}",
  "\u26A1",
  "\u{1F48E}",
  "\u{1F3AF}",
  "\u{1F9E0}",
  "\u{1F4A1}",
  "\u{1F4DA}",
  "\u270D\uFE0F",
  "\u{1F3A8}",
  "\u{1F3A7}",
  "\u{1F399}\uFE0F",
  "\u{1F4F7}",
  "\u{1F3AC}",
  "\u{1F4BB}",
  "\u{1F9EA}",
  "\u{1F52C}",
  "\u{1F4C8}",
  "\u{1F4BC}",
  "\u{1F3C6}",
  "\u{1F3BE}",
  "\u{1F3C3}",
  "\u{1F3CB}\uFE0F",
  "\u{1F9D8}",
  "\u{1F957}",
  "\u2615",
  "\u{1F331}",
  "\u{1F3E0}",
  "\u2708\uFE0F",
  "\u{1F5FA}\uFE0F",
  "\u{1F9F0}",
  "\u{1F4DD}",
  "\u{1F4D6}",
  "\u{1F4CC}",
  "\u{1F4CE}",
  "\u{1F4CB}",
  "\u{1F4CA}",
  "\u{1F4B0}",
  "\u{1F4B3}",
  "\u{1F4E6}",
  "\u{1F6D2}",
  "\u{1F3A5}",
  "\u{1F3B5}",
  "\u{1F3B9}",
  "\u{1F3B8}",
  "\u{1F3AE}",
  "\u{1F9E9}",
  "\u{1F3B2}",
  "\u{1F3CA}",
  "\u{1F6B4}",
  "\u{1F9D7}",
  "\u{1F3D5}\uFE0F",
  "\u{1F30A}",
  "\u{1F332}",
  "\u{1F33F}",
  "\u{1F33A}",
  "\u{1F34E}",
  "\u{1F35C}",
  "\u{1F35E}",
  "\u{1F3E5}",
  "\u{1F489}",
  "\u{1F6CC}",
  "\u{1F698}",
  "\u{1F686}",
  "\u{1F68C}",
  "\u{1F6A2}",
  "\u{1F9ED}",
  "\u{1F3D4}\uFE0F",
  "\u{1F4F1}",
  "\u{1F5A5}\uFE0F",
  "\u{1F5C4}\uFE0F",
  "\u2601\uFE0F",
  "\u{1F916}",
  "\u{1F680}",
  "\u{1F4E7}",
  "\u{1F4AC}",
  "\u{1F310}",
  "\u{1F512}",
  "\u{1F511}",
  "\u{1F6E1}\uFE0F",
  "\u{1F3C1}",
  "\u{1F6A9}",
  "\u{1F3F7}\uFE0F",
  "\u{1F4AB}",
  "\u{1F319}",
  "\u2600\uFE0F",
  "\u2744\uFE0F",
  "\u{1F308}",
  "\u{1F53A}",
  "\u25FB\uFE0F",
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

const BlankMarkIcon = forwardRef<SVGSVGElement, ComponentProps<LucideIcon>>(function BlankMarkIcon(
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
      <path d="M12 12h0" opacity="0" />
    </svg>
  );
});

const BASE_ICON_OPTIONS: SkillIconOption[] = [
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
  { key: "school", label: "School", category: "Learning", icon: School },
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

const MORE_ICON_OPTIONS: SkillIconOption[] = [
  { key: "blank", label: "Blank", category: "Core", icon: BlankMarkIcon },
  { key: "circle", label: "Circle", category: "Core", icon: LucideIcons.Circle },
  { key: "square", label: "Square", category: "Core", icon: LucideIcons.Square },
  { key: "triangle", label: "Triangle", category: "Core", icon: LucideIcons.Triangle },
  { key: "diamond", label: "Diamond", category: "Core", icon: LucideIcons.Diamond },
  { key: "hexagon", label: "Hexagon", category: "Core", icon: LucideIcons.Hexagon },
  { key: "asterisk", label: "Asterisk", category: "Core", icon: LucideIcons.Asterisk },
  { key: "hash", label: "Hash", category: "Core", icon: LucideIcons.Hash },
  { key: "bookmark", label: "Bookmark", category: "Core", icon: LucideIcons.Bookmark },
  { key: "flag", label: "Flag", category: "Core", icon: LucideIcons.Flag },
  { key: "flagtriangle", label: "Marker", category: "Core", icon: LucideIcons.FlagTriangleRight },
  { key: "milestone", label: "Milestone", category: "Core", icon: LucideIcons.Milestone },
  { key: "listchecks", label: "Checklist", category: "Core", icon: LucideIcons.ListChecks },
  { key: "circlecheck", label: "Done", category: "Core", icon: LucideIcons.CircleCheck },
  { key: "circledot", label: "Dot", category: "Core", icon: LucideIcons.CircleDot },
  { key: "layers", label: "Layers", category: "Core", icon: LucideIcons.Layers },
  { key: "scan", label: "Scan", category: "Core", icon: LucideIcons.Scan },
  { key: "radar", label: "Radar", category: "Core", icon: LucideIcons.Radar },
  { key: "timer", label: "Timer", category: "Core", icon: LucideIcons.Timer },
  { key: "timerreset", label: "Reset", category: "Core", icon: LucideIcons.TimerReset },
  { key: "hourglass", label: "Hourglass", category: "Core", icon: LucideIcons.Hourglass },
  { key: "gauge", label: "Gauge", category: "Core", icon: LucideIcons.Gauge },
  { key: "award", label: "Award", category: "Core", icon: LucideIcons.Award },
  { key: "badgepercent", label: "Percent", category: "Core", icon: LucideIcons.BadgePercent },
  { key: "accessibility", label: "Access", category: "Core", icon: LucideIcons.Accessibility },
  { key: "smile", label: "Smile", category: "Core", icon: LucideIcons.Smile },
  { key: "frown", label: "Frown", category: "Core", icon: LucideIcons.Frown },
  { key: "medal", label: "Medal", category: "Core", icon: LucideIcons.Medal },
  { key: "penline", label: "Pen", category: "Creative", icon: LucideIcons.PenLine },
  { key: "pentool", label: "Pen Tool", category: "Creative", icon: LucideIcons.PenTool },
  { key: "feather", label: "Feather", category: "Creative", icon: LucideIcons.Feather },
  { key: "wandsparkles", label: "Wand", category: "Creative", icon: LucideIcons.WandSparkles },
  { key: "image", label: "Image", category: "Creative", icon: LucideIcons.Image },
  { key: "images", label: "Images", category: "Creative", icon: LucideIcons.Images },
  { key: "shapes", label: "Shapes", category: "Creative", icon: LucideIcons.Shapes },
  { key: "frame", label: "Frame", category: "Creative", icon: LucideIcons.Frame },
  { key: "gallery", label: "Gallery", category: "Creative", icon: LucideIcons.GalleryHorizontal },
  { key: "album", label: "Album", category: "Creative", icon: LucideIcons.Album },
  { key: "sticker", label: "Sticker", category: "Creative", icon: LucideIcons.Sticker },
  { key: "drama", label: "Drama", category: "Creative", icon: LucideIcons.Drama },
  { key: "theater", label: "Theater", category: "Creative", icon: LucideIcons.Theater },
  { key: "origami", label: "Origami", category: "Creative", icon: LucideIcons.Origami },
  { key: "audiowaveform", label: "Waveform", category: "Creative", icon: LucideIcons.AudioWaveform },
  { key: "disc", label: "Disc", category: "Creative", icon: LucideIcons.Disc3 },
  { key: "paintbucket", label: "Paint", category: "Creative", icon: LucideIcons.PaintBucket },
  { key: "swatchbook", label: "Swatches", category: "Creative", icon: LucideIcons.SwatchBook },
  { key: "building", label: "Building", category: "Work", icon: LucideIcons.Building2 },
  { key: "landmark", label: "Landmark", category: "Work", icon: LucideIcons.Landmark },
  { key: "factory", label: "Factory", category: "Work", icon: LucideIcons.Factory },
  { key: "store", label: "Store", category: "Work", icon: LucideIcons.Store },
  { key: "receipt", label: "Receipt", category: "Work", icon: LucideIcons.Receipt },
  { key: "handcoins", label: "Revenue", category: "Work", icon: LucideIcons.HandCoins },
  { key: "chartpie", label: "Pie", category: "Work", icon: LucideIcons.ChartPie },
  { key: "chartbar", label: "Bar Chart", category: "Work", icon: LucideIcons.ChartBar },
  { key: "candlestick", label: "Markets", category: "Work", icon: LucideIcons.ChartCandlestick },
  { key: "clipboardcheck", label: "Tasks", category: "Work", icon: LucideIcons.ClipboardCheck },
  { key: "clipboardplus", label: "Queue", category: "Work", icon: LucideIcons.ClipboardPlus },
  { key: "filetext", label: "Document", category: "Work", icon: LucideIcons.FileText },
  { key: "files", label: "Files", category: "Work", icon: LucideIcons.Files },
  { key: "inbox", label: "Inbox", category: "Work", icon: LucideIcons.Inbox },
  { key: "squarekanban", label: "Kanban", category: "Work", icon: LucideIcons.SquareKanban },
  { key: "signature", label: "Signature", category: "Work", icon: LucideIcons.Signature },
  { key: "library", label: "Library", category: "Learning", icon: LucideIcons.Library },
  { key: "bookcopy", label: "Books", category: "Learning", icon: LucideIcons.BookCopy },
  { key: "booka", label: "Vocabulary", category: "Learning", icon: LucideIcons.BookA },
  { key: "bookcheck", label: "Course", category: "Learning", icon: LucideIcons.BookCheck },
  { key: "scrolltext", label: "Notes", category: "Learning", icon: LucideIcons.ScrollText },
  { key: "microscope", label: "Lab", category: "Learning", icon: LucideIcons.Microscope },
  { key: "flask", label: "Experiment", category: "Learning", icon: LucideIcons.FlaskConical },
  { key: "sigma", label: "Math", category: "Learning", icon: LucideIcons.Sigma },
  { key: "braincircuit", label: "Memory", category: "Learning", icon: LucideIcons.BrainCircuit },
  { key: "dna", label: "Biology", category: "Learning", icon: LucideIcons.Dna },
  { key: "pill", label: "Medicine", category: "Wellness", icon: LucideIcons.Pill },
  { key: "syringe", label: "Shot", category: "Wellness", icon: LucideIcons.Syringe },
  { key: "bandage", label: "Recovery", category: "Wellness", icon: LucideIcons.Bandage },
  { key: "hospital", label: "Hospital", category: "Wellness", icon: LucideIcons.Hospital },
  { key: "ambulance", label: "Emergency", category: "Wellness", icon: LucideIcons.Ambulance },
  { key: "wind", label: "Breath", category: "Wellness", icon: LucideIcons.Wind },
  { key: "personstanding", label: "Posture", category: "Wellness", icon: LucideIcons.PersonStanding },
  { key: "footprints", label: "Walking", category: "Wellness", icon: LucideIcons.Footprints },
  { key: "biceps", label: "Strength", category: "Wellness", icon: LucideIcons.BicepsFlexed },
  { key: "bath", label: "Recovery", category: "Wellness", icon: LucideIcons.Bath },
  { key: "utensils", label: "Dining", category: "Life", icon: LucideIcons.Utensils },
  { key: "pizza", label: "Pizza", category: "Life", icon: LucideIcons.Pizza },
  { key: "sandwich", label: "Snack", category: "Life", icon: LucideIcons.Sandwich },
  { key: "icecream", label: "Dessert", category: "Life", icon: LucideIcons.IceCreamBowl },
  { key: "banana", label: "Fruit", category: "Life", icon: LucideIcons.Banana },
  { key: "carrot", label: "Veg", category: "Life", icon: LucideIcons.Carrot },
  { key: "wine", label: "Wine", category: "Life", icon: LucideIcons.Wine },
  { key: "beer", label: "Beer", category: "Life", icon: LucideIcons.Beer },
  { key: "sofa", label: "Home", category: "Life", icon: LucideIcons.Sofa },
  { key: "armchair", label: "Chair", category: "Life", icon: LucideIcons.Armchair },
  { key: "lamp", label: "Lamp", category: "Life", icon: LucideIcons.Lamp },
  { key: "shirt2", label: "Clothes", category: "Life", icon: LucideIcons.Shirt },
  { key: "gift", label: "Gift", category: "Life", icon: LucideIcons.Gift },
  { key: "baby", label: "Family", category: "Life", icon: LucideIcons.Baby },
  { key: "pawprint", label: "Pets", category: "Life", icon: LucideIcons.PawPrint },
  { key: "route", label: "Route", category: "Travel", icon: LucideIcons.Route },
  { key: "navigation", label: "Navigate", category: "Travel", icon: LucideIcons.Navigation },
  { key: "locate", label: "Locate", category: "Travel", icon: LucideIcons.LocateFixed },
  { key: "signpost", label: "Signpost", category: "Travel", icon: LucideIcons.Signpost },
  { key: "luggage", label: "Luggage", category: "Travel", icon: LucideIcons.Luggage },
  { key: "backpack", label: "Backpack", category: "Travel", icon: LucideIcons.Backpack },
  { key: "sailboat", label: "Sailing", category: "Travel", icon: LucideIcons.Sailboat },
  { key: "tram", label: "Tram", category: "Travel", icon: LucideIcons.TramFront },
  { key: "fuel", label: "Fuel", category: "Travel", icon: LucideIcons.Fuel },
  { key: "hotel", label: "Hotel", category: "Travel", icon: LucideIcons.Hotel },
  { key: "terminal", label: "Terminal", category: "Tech", icon: LucideIcons.Terminal },
  { key: "braces", label: "Braces", category: "Tech", icon: LucideIcons.Braces },
  { key: "binary", label: "Binary", category: "Tech", icon: LucideIcons.Binary },
  { key: "gitbranch", label: "Git", category: "Tech", icon: LucideIcons.GitBranch },
  { key: "workflow", label: "Workflow", category: "Tech", icon: LucideIcons.Workflow },
  { key: "webhook", label: "Webhook", category: "Tech", icon: LucideIcons.Webhook },
  { key: "blocks3", label: "Stack", category: "Tech", icon: LucideIcons.Blocks },
  { key: "container", label: "Container", category: "Tech", icon: LucideIcons.Container },
  { key: "harddrive", label: "Storage", category: "Tech", icon: LucideIcons.HardDrive },
  { key: "memory", label: "Memory", category: "Tech", icon: LucideIcons.MemoryStick },
  { key: "chip", label: "Chip", category: "Tech", icon: LucideIcons.Microchip },
  { key: "satellite", label: "Satellite", category: "Tech", icon: LucideIcons.Satellite },
  { key: "scanface", label: "Identity", category: "Tech", icon: LucideIcons.ScanFace },
  { key: "fingerprint", label: "Touch", category: "Tech", icon: LucideIcons.Fingerprint },
  { key: "qr", label: "QR", category: "Tech", icon: LucideIcons.QrCode },
  { key: "bluetooth", label: "Bluetooth", category: "Tech", icon: LucideIcons.Bluetooth },
];

export const ICON_OPTIONS: SkillIconOption[] = [...BASE_ICON_OPTIONS, ...MORE_ICON_OPTIONS];

const ICONS_BY_KEY = new Map(ICON_OPTIONS.map((option) => [option.key, option]));
const ACCENTS_BY_KEY = new Map(ACCENT_OPTIONS.map((option) => [option.key, option]));
const MOTIFS_BY_KEY = new Set(SKILL_MOTIF_OPTIONS.map((option) => option.key));
const CUSTOM_ACCENT_PATTERN = /^custom-([0-9a-f]{6})$/i;
const HEX_COLOR_PATTERN = /^#?([0-9a-f]{6})$/i;

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
  school: "school",
  study: "graduation",
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
  school: "indigo",
  search: "teal",
  study: "indigo",
};

export function normalizeSkillKey(value: string | null | undefined) {
  return value?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

export function splitSkillIconKey(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  const [iconKey, motifToken] = raw.split("|motif:");
  const motif = MOTIFS_BY_KEY.has(motifToken as SkillMotif) ? (motifToken as SkillMotif) : null;

  return {
    iconKey: iconKey || raw,
    motif,
  };
}

export function buildSkillIconKey(iconKey: string, motif: SkillMotif) {
  const safeIconKey = iconKey.trim() || "sparkles";
  return `${safeIconKey}|motif:${motif}`;
}

export function getSkillMotif(key: string | null | undefined) {
  return splitSkillIconKey(key).motif;
}

export function getSkillAccentKeyFromHex(value: string) {
  const match = value.trim().match(HEX_COLOR_PATTERN);
  return match ? `custom-${match[1].toLowerCase()}` : "custom-ff563f";
}

export function getSkillCustomAccent(key: string | null | undefined) {
  const value = String(key ?? "").trim();
  const match = value.match(CUSTOM_ACCENT_PATTERN) ?? value.match(HEX_COLOR_PATTERN);

  if (!match) {
    return null;
  }

  const hex = `#${match[1].toLowerCase()}`;
  const red = Number.parseInt(match[1].slice(0, 2), 16);
  const green = Number.parseInt(match[1].slice(2, 4), 16);
  const blue = Number.parseInt(match[1].slice(4, 6), 16);

  return {
    color: hex,
    key: `custom-${match[1].toLowerCase()}`,
    rgb: `${red}, ${green}, ${blue}`,
  };
}

export function getSkillIconOption(key: string | null | undefined) {
  const normalized = normalizeSkillKey(splitSkillIconKey(key).iconKey);
  return ICONS_BY_KEY.get(ALIASES[normalized] ?? normalized) ?? ICONS_BY_KEY.get("sparkles") ?? ICON_OPTIONS[0];
}

export function getSkillEmoji(key: string | null | undefined) {
  const baseKey = splitSkillIconKey(key).iconKey;

  if (!baseKey.startsWith("emoji:")) {
    return null;
  }

  return baseKey.slice("emoji:".length) || null;
}

function findSkillIconOption(key: string | null | undefined) {
  const normalized = normalizeSkillKey(splitSkillIconKey(key).iconKey);
  return ICONS_BY_KEY.get(ALIASES[normalized] ?? normalized) ?? null;
}

export function getSkillAccentOption(key: string | null | undefined) {
  const customAccent = getSkillCustomAccent(key);

  if (customAccent) {
    return ACCENT_OPTIONS[0];
  }

  const normalized = normalizeSkillKey(key);
  return ACCENTS_BY_KEY.get((ACCENT_ALIASES[normalized] ?? normalized) as SkillAccentKey) ?? ACCENT_OPTIONS[0];
}

function findSkillAccentOption(key: string | null | undefined) {
  if (getSkillCustomAccent(key)) {
    return null;
  }

  const normalized = normalizeSkillKey(key);
  return ACCENTS_BY_KEY.get((ACCENT_ALIASES[normalized] ?? normalized) as SkillAccentKey) ?? null;
}

export function resolveSkillStyle({
  accentColor,
  accentKey,
  iconKey,
  name,
  slug,
}: {
  accentColor?: string | null;
  accentKey?: string | null;
  iconKey?: string | null;
  name?: string | null;
  slug?: string | null;
}): SkillStyle {
  const splitIcon = splitSkillIconKey(iconKey);
  const iconOption = [splitIcon.iconKey, slug, name].map(findSkillIconOption).find(Boolean) ?? getSkillIconOption("sparkles");
  const customAccent = getSkillCustomAccent(accentColor) ?? getSkillCustomAccent(accentKey);
  const accentOption = [accentKey, iconKey, slug, name].map(findSkillAccentOption).find(Boolean) ?? getSkillAccentOption("coral");
  const motif = splitIcon.motif ?? (iconOption.key === "megaphone" ? "campaign" : accentOption.motif);

  return {
    icon: iconOption.icon,
    emoji: getSkillEmoji(iconKey) ?? undefined,
    accent: customAccent ? "custom" : accentOption.key,
    accentColor: customAccent?.color,
    accentRgb: customAccent?.rgb,
    motif,
  };
}
