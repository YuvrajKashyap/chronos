import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/chronos/skill-style-options", () => ({
  resolveSkillStyle: () => ({
    accent: "cyan",
    accentColor: "#22d3ee",
    accentRgb: "34, 211, 238",
    emoji: "T",
    icon: null,
    motif: "grid",
  }),
}));

import type { PublicDashboardPayload } from "./public-dashboard";
import {
  getPublicActiveSessionCount,
  hasUsefulPublicDashboardData,
  parseDashboardSortMode,
  transformPublicDashboardToSkills,
} from "./transform-dashboard";

const payload: PublicDashboardPayload = {
  skills: [
    {
      id: "alpha",
      name: "Alpha",
      sort_order: 20,
      last_active_at: "2026-01-02T12:00:00.000Z",
      lifetime_seconds: 300,
    },
    {
      id: "beta",
      name: "Beta",
      sort_order: 10,
      last_active_at: "2026-01-03T12:00:00.000Z",
      lifetime_seconds: 200,
      active_session_started_at: "2026-01-03T12:00:00.000Z",
      current_active_elapsed_seconds: 150,
    },
  ],
};

describe("public dashboard transforms", () => {
  it("accepts only supported sort modes", () => {
    expect(parseDashboardSortMode("recent")).toBe("recent");
    expect(parseDashboardSortMode("hours-desc")).toBe("hours-desc");
    expect(parseDashboardSortMode("unexpected")).toBe("custom");
  });

  it("uses explicit custom order by default", () => {
    expect(transformPublicDashboardToSkills(payload).map((skill) => skill.id)).toEqual(["beta", "alpha"]);
  });

  it("sorts by recent activity and includes active elapsed time in hour ranking", () => {
    expect(transformPublicDashboardToSkills(payload, "recent").map((skill) => skill.id)).toEqual(["beta", "alpha"]);
    expect(transformPublicDashboardToSkills(payload, "hours-desc").map((skill) => skill.id)).toEqual(["beta", "alpha"]);
    expect(transformPublicDashboardToSkills(payload, "hours-asc").map((skill) => skill.id)).toEqual(["alpha", "beta"]);
  });

  it("counts active sessions without inventing dashboard data", () => {
    expect(hasUsefulPublicDashboardData(payload)).toBe(true);
    expect(getPublicActiveSessionCount(payload)).toBe(1);
    expect(hasUsefulPublicDashboardData(null)).toBe(false);
    expect(getPublicActiveSessionCount(null)).toBe(0);
  });
});
