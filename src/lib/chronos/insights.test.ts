import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/chronos/admin-dashboard", () => ({
  getAdminTimerState: vi.fn(),
}));
vi.mock("@/lib/chronos/public-dashboard", () => ({
  getPublicDashboard: vi.fn(),
}));
vi.mock("@/lib/supabase/env", () => ({
  hasChronosSupabaseEnv: vi.fn(() => false),
}));
vi.mock("@/lib/supabase/server", () => ({
  createChronosServerClient: vi.fn(),
}));

import { deriveChronosInsights, type InsightSession, type InsightSkill } from "./insights";

const skills: InsightSkill[] = [
  {
    id: "software",
    name: "Software",
    visibility: "public",
    is_downtime: false,
    lifetime_seconds: 50_000,
    weekly_target_seconds: 14_400,
    target_sessions_per_week: 2,
    priority_weight: 5,
    goal_note: "Ship useful systems",
    active_seconds: 0,
    session_count: 3,
    last_session_at: "2026-01-08T12:00:00.000Z",
  },
  {
    id: "fitness",
    name: "Fitness",
    visibility: "private",
    is_downtime: false,
    lifetime_seconds: 25_000,
    weekly_target_seconds: 0,
    target_sessions_per_week: 0,
    priority_weight: 3,
    goal_note: null,
    active_seconds: 0,
    session_count: 1,
    last_session_at: "2026-01-06T12:00:00.000Z",
  },
];

const sessions: InsightSession[] = [
  {
    id: "counted",
    skill_id: "software",
    skill_name: "Software",
    started_at: "2026-01-08T12:00:00.000Z",
    ended_at: "2026-01-08T14:00:00.000Z",
    source: "timer",
    is_private: false,
    counts_toward_lifetime: true,
    duration_seconds: 7_200,
  },
  {
    id: "skipped",
    skill_id: "fitness",
    skill_name: "Fitness",
    started_at: "2026-01-07T12:00:00.000Z",
    ended_at: "2026-01-07T12:30:00.000Z",
    source: "manual",
    is_private: true,
    counts_toward_lifetime: false,
    duration_seconds: 1_800,
  },
  {
    id: "pending",
    skill_id: "software",
    skill_name: "Software",
    started_at: "2026-01-06T12:00:00.000Z",
    ended_at: "2026-01-06T12:10:00.000Z",
    source: "timer",
    is_private: false,
    counts_toward_lifetime: null,
    duration_seconds: 600,
  },
];

describe("deriveChronosInsights", () => {
  it("keeps counted, skipped, and pending time distinct", () => {
    const insights = deriveChronosInsights({
      activeSessionCount: 0,
      error: null,
      mode: "admin",
      now: new Date("2026-01-08T18:00:00.000Z"),
      sessions,
      skills,
    });

    expect(insights.totals.observed_seconds).toBe(9_600);
    expect(insights.totals.counted_seconds).toBe(7_200);
    expect(insights.totals.skipped_seconds).toBe(1_800);
    expect(insights.totals.pending_seconds).toBe(600);
    expect(insights.totals.lifetime_seconds).toBe(75_000);
    expect(insights.totals.private_seconds).toBe(1_800);
    expect(insights.behavior.completion_rate).toBeCloseTo(1 / 3);
  });

  it("derives deterministic current-day and issue signals", () => {
    const insights = deriveChronosInsights({
      activeSessionCount: 0,
      error: null,
      mode: "admin",
      now: new Date("2026-01-08T18:00:00.000Z"),
      sessions,
      skills,
    });

    expect(insights.totals.today_seconds).toBe(7_200);
    expect(insights.rankings.skills_by_recent[0]?.label).toBe("Software");
    expect(insights.issues.some((issue) => issue.title === "Pending lifetime decisions")).toBe(true);
    expect(insights.data_health.find((item) => item.label === "Session Completeness")?.tone).toBe("warn");
  });
});
