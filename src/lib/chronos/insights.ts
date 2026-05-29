import { getAdminTimerState, type AdminRecentSession, type AdminSkill, type AdminTimerState } from "@/lib/chronos/admin-dashboard";
import { getPublicDashboard, type PublicDashboardPayload, type PublicDashboardSkill } from "@/lib/chronos/public-dashboard";
import { hasChronosSupabaseEnv } from "@/lib/supabase/env";
import { createChronosServerClient } from "@/lib/supabase/server";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_SECONDS = 60 * 60;
const MILESTONES_SECONDS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000].map((hours) => hours * HOUR_SECONDS);

type RawSessionRow = {
  id: string;
  skill_id: string;
  started_at: string;
  ended_at?: string | null;
  source: "timer" | "manual" | "system";
  is_private: boolean;
  counts_toward_lifetime?: boolean | null;
  planned_seconds?: number | null;
  quality_score?: number | null;
  energy_score?: number | null;
  focus_score?: number | null;
  outcome?: string | null;
  project_key?: string | null;
  tag_names?: string[] | null;
  interruption_count?: number | null;
  paused_seconds?: number | null;
};

export type InsightSession = AdminRecentSession;

export type InsightSkill = {
  id: string;
  name: string;
  visibility: "public" | "private";
  is_downtime: boolean;
  lifetime_seconds: number;
  weekly_target_seconds: number;
  target_sessions_per_week: number;
  priority_weight: number;
  goal_note: string | null;
  active_seconds: number;
  session_count: number;
  last_session_at: string | null;
};

export type InsightRank = {
  label: string;
  value: number;
  share: number;
  meta: string;
};

export type InsightDay = {
  key: string;
  label: string;
  seconds: number;
  sessions: number;
};

export type InsightMilestone = {
  skill: string;
  current_seconds: number;
  target_seconds: number;
  remaining_seconds: number;
  eta_days: number | null;
};

export type InsightDataHealth = {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "warn" | "neutral";
};

export type InsightIssue = {
  title: string;
  detail: string;
  tone: "good" | "warn" | "neutral";
};

export type ChronosInsights = {
  mode: "admin" | "public" | "empty";
  generated_at: string;
  error: string | null;
  headline: {
    title: string;
    subtitle: string;
  };
  totals: {
    lifetime_seconds: number;
    active_seconds: number;
    counted_seconds: number;
    observed_seconds: number;
    today_seconds: number;
    yesterday_seconds: number;
    week_seconds: number;
    month_seconds: number;
    private_seconds: number;
    public_seconds: number;
    skipped_seconds: number;
    pending_seconds: number;
    session_count: number;
    counted_session_count: number;
    skipped_session_count: number;
    pending_session_count: number;
    active_session_count: number;
    skill_count: number;
    deep_work_seconds: number;
    micro_session_seconds: number;
    manual_seconds: number;
    timer_seconds: number;
    system_seconds: number;
    idle_seconds: number;
    planned_seconds: number;
    rated_session_count: number;
    interruption_count: number;
    paused_seconds: number;
  };
  behavior: {
    average_session_seconds: number;
    median_session_seconds: number;
    longest_session_seconds: number;
    shortest_session_seconds: number;
    completion_rate: number;
    private_share: number;
    focus_score: number;
    balance_score: number;
    consistency_score: number;
    current_streak_days: number;
    longest_streak_days: number;
    active_day_count: number;
    observed_span_days: number;
    days_since_last_session: number | null;
    deep_work_session_count: number;
    micro_session_count: number;
    switch_count: number;
    context_switch_rate: number;
    skill_coverage: number;
    entropy_score: number;
    stale_skill_count: number;
    recovery_gap_days: number;
    best_day: InsightDay | null;
    peak_hour: { hour: number; seconds: number } | null;
    peak_weekday: { weekday: string; seconds: number } | null;
    average_quality_score: number;
    average_energy_score: number;
    average_focus_rating: number;
    planned_adherence: number;
    goal_coverage: number;
  };
  velocity: {
    daily_average_7d_seconds: number;
    daily_average_30d_seconds: number;
    projected_week_seconds: number;
    projected_month_seconds: number;
    projected_year_seconds: number;
    yesterday_delta_seconds: number;
    previous_week_seconds: number;
    weekly_delta_seconds: number;
    acceleration_ratio: number;
    lifetime_daily_average_seconds: number;
    days_to_double_lifetime: number | null;
  };
  rankings: {
    skills_by_lifetime: InsightRank[];
    skills_by_recent: InsightRank[];
    skills_by_staleness: InsightRank[];
    session_lengths: InsightRank[];
    weekday_heatmap: InsightRank[];
    hourly_heatmap: InsightRank[];
    source_breakdown: InsightRank[];
    privacy_breakdown: InsightRank[];
    project_breakdown: InsightRank[];
    tag_breakdown: InsightRank[];
    goal_progress: InsightRank[];
  };
  timelines: {
    last_14_days: InsightDay[];
    last_30_days: InsightDay[];
    last_8_weeks: InsightDay[];
  };
  milestones: InsightMilestone[];
  data_health: InsightDataHealth[];
  issues: InsightIssue[];
};

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function dateOrNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function secondsBetween(startedAt: string, endedAt: string | null | undefined, now = new Date()) {
  const started = dateOrNull(startedAt);
  const ended = dateOrNull(endedAt) ?? now;

  if (!started) {
    return 0;
  }

  return Math.max(0, Math.floor((ended.getTime() - started.getTime()) / 1000));
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(key: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${key}T12:00:00.000Z`));
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(date);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function ratio(part: number, whole: number) {
  return whole > 0 ? part / whole : 0;
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);

  return ordered.length % 2 === 0 ? Math.round((ordered[middle - 1] + ordered[middle]) / 2) : ordered[middle];
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(1, value));
}

function rankFromMap(map: Map<string, number>, total: number, meta = "tracked") {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      share: ratio(value, total),
      meta,
    }));
}

function emptyDaySeries(days: number, now = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1 - index)));
    const key = dayKey(date);

    return {
      key,
      label: dayLabel(key),
      seconds: 0,
      sessions: 0,
    };
  });
}

function addToMap(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function computeStreaks(days: InsightDay[]) {
  const activeKeys = new Set(days.filter((day) => day.seconds > 0).map((day) => day.key));
  const orderedKeys = days.map((day) => day.key);
  let longest = 0;
  let currentRun = 0;

  for (const key of orderedKeys) {
    if (activeKeys.has(key)) {
      currentRun += 1;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 0;
    }
  }

  let current = 0;
  for (let index = orderedKeys.length - 1; index >= 0; index -= 1) {
    if (!activeKeys.has(orderedKeys[index])) {
      break;
    }
    current += 1;
  }

  return { current, longest };
}

async function getAdminSessionRows(): Promise<{ sessions: RawSessionRow[]; error: string | null }> {
  if (!hasChronosSupabaseEnv()) {
    return { sessions: [], error: "Supabase environment variables are not configured." };
  }

  try {
    const supabase = await createChronosServerClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("id, skill_id, started_at, ended_at, source, is_private, counts_toward_lifetime, planned_seconds, quality_score, energy_score, focus_score, outcome, project_key, tag_names, interruption_count, paused_seconds")
      .order("started_at", { ascending: false })
      .limit(750);

    if (error) {
      return { sessions: [], error: error.message };
    }

    return { sessions: (data ?? []) as RawSessionRow[], error: null };
  } catch (error) {
    return {
      sessions: [],
      error: error instanceof Error ? error.message : "Unable to load Chronos sessions.",
    };
  }
}

function normalizeAdminSessions(rows: RawSessionRow[], skills: AdminSkill[], fallback: AdminRecentSession[]) {
  const skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
  const downtimeSkillIds = new Set(skills.filter((skill) => skill.is_downtime).map((skill) => skill.id));

  if (rows.length === 0) {
    return fallback;
  }

  return rows.map((row) => ({
    id: row.id,
    skill_id: row.skill_id,
    skill_name: skillNames.get(row.skill_id) ?? "Unknown",
    started_at: row.started_at,
    ended_at: row.ended_at,
    source: row.source,
    is_private: row.is_private,
    is_downtime: downtimeSkillIds.has(row.skill_id),
    counts_toward_lifetime: row.counts_toward_lifetime,
    duration_seconds: secondsBetween(row.started_at, row.ended_at),
    planned_seconds: row.planned_seconds,
    quality_score: row.quality_score,
    energy_score: row.energy_score,
    focus_score: row.focus_score,
    outcome: row.outcome,
    project_key: row.project_key,
    tag_names: row.tag_names,
    interruption_count: row.interruption_count,
    paused_seconds: row.paused_seconds,
  }));
}

async function recordAdminInsightSnapshot(insights: ChronosInsights) {
  if (!hasChronosSupabaseEnv() || insights.mode !== "admin") {
    return;
  }

  try {
    const supabase = await createChronosServerClient();
    await supabase.rpc("record_insight_snapshot", {
      p_payload: insights,
    });
  } catch {
    // Snapshot recording should never block the Insights page.
  }
}

function buildSkillSummaries(skills: AdminSkill[], sessions: InsightSession[]) {
  return skills.map((skill) => {
    const skillSessions = sessions.filter((session) => session.skill_id === skill.id);
    const lastSession = skillSessions
      .map((session) => session.started_at)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

    return {
      id: skill.id,
      name: skill.name,
      visibility: skill.visibility,
      is_downtime: skill.is_downtime,
      lifetime_seconds: asNumber(skill.lifetime_seconds),
      weekly_target_seconds: asNumber(skill.weekly_target_seconds),
      target_sessions_per_week: asNumber(skill.target_sessions_per_week),
      priority_weight: asNumber(skill.priority_weight) || 3,
      goal_note: skill.goal_note ?? null,
      active_seconds: asNumber(skill.current_active_elapsed_seconds),
      session_count: skillSessions.length,
      last_session_at: lastSession,
    };
  });
}

function deriveInsights({
  activeSessionCount,
  error,
  generatedAt,
  mode,
  sessions,
  skills,
}: {
  activeSessionCount: number;
  error: string | null;
  generatedAt?: string;
  mode: "admin" | "public" | "empty";
  sessions: InsightSession[];
  skills: InsightSkill[];
}): ChronosInsights {
  const now = new Date();
  const usefulSessions = sessions.filter((session) => session.duration_seconds > 0);
  const countedSessions = usefulSessions.filter((session) => session.counts_toward_lifetime === true || session.ended_at === null);
  const skippedSessions = usefulSessions.filter((session) => session.counts_toward_lifetime === false);
  const pendingSessions = usefulSessions.filter((session) => session.ended_at && session.counts_toward_lifetime === null);
  const privateSessions = usefulSessions.filter((session) => session.is_private);
  const publicSessions = usefulSessions.filter((session) => !session.is_private);
  const manualSessions = usefulSessions.filter((session) => session.source === "manual");
  const timerSessions = usefulSessions.filter((session) => session.source === "timer");
  const systemSessions = usefulSessions.filter((session) => session.source === "system");
  const idleSessions = usefulSessions.filter((session) => session.is_downtime || session.project_key === "downtime");
  const deepWorkSessions = usefulSessions.filter((session) => session.duration_seconds >= 90 * 60);
  const microSessions = usefulSessions.filter((session) => session.duration_seconds > 0 && session.duration_seconds <= 10 * 60);
  const ratedQualitySessions = usefulSessions.filter((session) => asNumber(session.quality_score) > 0);
  const ratedEnergySessions = usefulSessions.filter((session) => asNumber(session.energy_score) > 0);
  const ratedFocusSessions = usefulSessions.filter((session) => asNumber(session.focus_score) > 0);
  const durations = usefulSessions.map((session) => session.duration_seconds);
  const observedSeconds = sum(durations);
  const countedSeconds = sum(countedSessions.map((session) => session.duration_seconds));
  const skippedSeconds = sum(skippedSessions.map((session) => session.duration_seconds));
  const pendingSeconds = sum(pendingSessions.map((session) => session.duration_seconds));
  const privateSeconds = sum(privateSessions.map((session) => session.duration_seconds));
  const publicSeconds = sum(publicSessions.map((session) => session.duration_seconds));
  const manualSeconds = sum(manualSessions.map((session) => session.duration_seconds));
  const timerSeconds = sum(timerSessions.map((session) => session.duration_seconds));
  const systemSeconds = sum(systemSessions.map((session) => session.duration_seconds));
  const idleSeconds = sum(idleSessions.map((session) => session.duration_seconds));
  const deepWorkSeconds = sum(deepWorkSessions.map((session) => session.duration_seconds));
  const microSessionSeconds = sum(microSessions.map((session) => session.duration_seconds));
  const plannedSeconds = sum(usefulSessions.map((session) => asNumber(session.planned_seconds)));
  const interruptionCount = sum(usefulSessions.map((session) => asNumber(session.interruption_count)));
  const pausedSeconds = sum(usefulSessions.map((session) => asNumber(session.paused_seconds)));
  const averageQualityScore = ratedQualitySessions.length > 0
    ? sum(ratedQualitySessions.map((session) => asNumber(session.quality_score))) / ratedQualitySessions.length
    : 0;
  const averageEnergyScore = ratedEnergySessions.length > 0
    ? sum(ratedEnergySessions.map((session) => asNumber(session.energy_score))) / ratedEnergySessions.length
    : 0;
  const averageFocusRating = ratedFocusSessions.length > 0
    ? sum(ratedFocusSessions.map((session) => asNumber(session.focus_score))) / ratedFocusSessions.length
    : 0;
  const lifetimeSeconds = Math.max(sum(skills.map((skill) => skill.lifetime_seconds)), countedSeconds);
  const activeSeconds = sum(skills.map((skill) => skill.active_seconds));
  const daySeries = emptyDaySeries(90, now);
  const dayIndex = new Map(daySeries.map((day) => [day.key, day]));
  const skillRecentMap = new Map<string, number>();
  const skillLifetimeMap = new Map(skills.map((skill) => [skill.name, skill.lifetime_seconds]));
  const weekdayMap = new Map<string, number>();
  const hourlyMap = new Map<string, number>();
  const projectMap = new Map<string, number>();
  const tagMap = new Map<string, number>();

  for (const session of countedSessions) {
    const started = dateOrNull(session.started_at);
    if (!started) {
      continue;
    }

    const key = dayKey(started);
    const day = dayIndex.get(key);
    if (day) {
      day.seconds += session.duration_seconds;
      day.sessions += 1;
      addToMap(skillRecentMap, session.skill_name, session.duration_seconds);
    }

    addToMap(weekdayMap, weekdayLabel(started), session.duration_seconds);
    addToMap(hourlyMap, String(started.getUTCHours()).padStart(2, "0"), session.duration_seconds);

    if (session.project_key) {
      addToMap(projectMap, session.project_key, session.duration_seconds);
    }

    for (const tagName of session.tag_names ?? []) {
      addToMap(tagMap, tagName, session.duration_seconds);
    }
  }

  const today = daySeries.at(-1) ?? null;
  const yesterday = daySeries.at(-2) ?? null;
  const last7 = daySeries.slice(-7);
  const last7Keys = new Set(last7.map((day) => day.key));
  const previous7 = daySeries.slice(-14, -7);
  const last30 = daySeries.slice(-30);
  const last14 = daySeries.slice(-14);
  const sortedSessions = usefulSessions
    .slice()
    .sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)));
  const firstSessionDate = dateOrNull(sortedSessions[0]?.started_at);
  const lastSessionDate = dateOrNull(sortedSessions.at(-1)?.started_at);
  const last8Weeks = Array.from({ length: 8 }, (_, index) => {
    const weekDays = daySeries.slice(Math.max(0, daySeries.length - ((8 - index) * 7)), daySeries.length - ((7 - index) * 7));
    const first = weekDays[0];
    const last = weekDays.at(-1);

    return {
      key: `${first?.key ?? index}`,
      label: first && last ? `${first.label} - ${last.label}` : `Week ${index + 1}`,
      seconds: sum(weekDays.map((day) => day.seconds)),
      sessions: sum(weekDays.map((day) => day.sessions)),
    };
  });
  const weekSeconds = sum(last7.map((day) => day.seconds));
  const previousWeekSeconds = sum(previous7.map((day) => day.seconds));
  const monthSeconds = sum(last30.map((day) => day.seconds));
  const activeDays = daySeries.filter((day) => day.seconds > 0);
  const streaks = computeStreaks(daySeries);
  const bestDay = activeDays.sort((a, b) => b.seconds - a.seconds)[0] ?? null;
  const weekdayRanks = rankFromMap(weekdayMap, countedSeconds, "weekday").slice(0, 7);
  const hourlyRanks = rankFromMap(hourlyMap, countedSeconds, "UTC hour").map((rank) => ({
    ...rank,
    label: `${rank.label}:00`,
  })).slice(0, 8);
  const peakHourRank = hourlyRanks[0];
  const peakWeekdayRank = weekdayRanks[0];
  const skillLifetimeRanks = rankFromMap(skillLifetimeMap, lifetimeSeconds, "lifetime").slice(0, 8);
  const skillRecentRanks = rankFromMap(skillRecentMap, weekSeconds, "last 90 days").slice(0, 8);
  const sourceBreakdown = rankFromMap(
    new Map([
      ["Timer", timerSeconds],
      ["Manual", manualSeconds],
      ["System", systemSeconds],
    ]),
    observedSeconds,
    "source",
  );
  const privacyBreakdown = rankFromMap(
    new Map([
      ["Public", publicSeconds],
      ["Private", privateSeconds],
    ]),
    observedSeconds,
    "visibility",
  );
  const projectBreakdown = rankFromMap(projectMap, countedSeconds, "project").slice(0, 10);
  const tagBreakdown = rankFromMap(tagMap, countedSeconds, "tag").slice(0, 12);
  const skillWeekMap = new Map<string, number>();
  const skillWeekSessionCount = new Map<string, number>();

  for (const session of countedSessions) {
    const started = dateOrNull(session.started_at);
    if (started && last7Keys.has(dayKey(started))) {
      addToMap(skillWeekMap, session.skill_id, session.duration_seconds);
      skillWeekSessionCount.set(session.skill_id, (skillWeekSessionCount.get(session.skill_id) ?? 0) + 1);
    }
  }

  const goalProgress = skills
    .filter((skill) => skill.weekly_target_seconds > 0 || skill.target_sessions_per_week > 0)
    .map((skill) => {
      const recentSeconds = skillWeekMap.get(skill.id) ?? 0;
      const targetSeconds = Math.max(1, skill.weekly_target_seconds);
      const targetSessions = Math.max(1, skill.target_sessions_per_week);
      const recentSessionCount = skillWeekSessionCount.get(skill.id) ?? 0;
      const secondsProgress = skill.weekly_target_seconds > 0 ? ratio(recentSeconds, targetSeconds) : 0;
      const sessionProgress = skill.target_sessions_per_week > 0 ? ratio(recentSessionCount, targetSessions) : 0;
      const score = skill.weekly_target_seconds > 0 && skill.target_sessions_per_week > 0
        ? (secondsProgress + sessionProgress) / 2
        : Math.max(secondsProgress, sessionProgress);

      return {
        label: skill.name,
        value: Math.round(clampPercent(score) * 100),
        share: clampPercent(score),
        meta: skill.weekly_target_seconds > 0
          ? `${Math.round(recentSeconds / HOUR_SECONDS)}h of ${Math.round(skill.weekly_target_seconds / HOUR_SECONDS)}h target`
          : `${recentSessionCount} sessions tracked`,
      };
    })
    .sort((a, b) => a.share - b.share)
    .slice(0, 10);
  const sessionLengthRanks = usefulSessions
    .slice()
    .sort((a, b) => b.duration_seconds - a.duration_seconds)
    .slice(0, 8)
    .map((session) => ({
      label: session.skill_name,
      value: session.duration_seconds,
      share: ratio(session.duration_seconds, observedSeconds),
      meta: dateOrNull(session.started_at)?.toISOString().slice(0, 10) ?? "session",
    }));
  const staleRanks = skills
    .filter((skill) => skill.lifetime_seconds > 0)
    .map((skill) => {
      const last = dateOrNull(skill.last_session_at);
      const daysStale = last ? Math.max(0, Math.floor((now.getTime() - last.getTime()) / DAY_MS)) : 999;

      return {
        label: skill.name,
        value: daysStale,
        share: ratio(daysStale, 90),
        meta: last ? `last ${last.toISOString().slice(0, 10)}` : "no session date",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const focusScore = sum(skillLifetimeRanks.map((rank) => rank.share * rank.share));
  const consistencyScore = clampPercent(activeDays.length / Math.min(90, daySeries.length));
  const balanceScore = clampPercent(1 - focusScore);
  const entropyScore = clampPercent(
    -sum(skillLifetimeRanks.map((rank) => (rank.share > 0 ? rank.share * Math.log2(rank.share) : 0))) /
      Math.max(1, Math.log2(Math.max(2, skills.filter((skill) => skill.lifetime_seconds > 0).length))),
  );
  const switchCount = sortedSessions.reduce((count, session, index) => {
    if (index === 0) {
      return count;
    }

    return sortedSessions[index - 1].skill_id === session.skill_id ? count : count + 1;
  }, 0);
  const observedSpanDays = firstSessionDate && lastSessionDate
    ? Math.max(1, Math.ceil((lastSessionDate.getTime() - firstSessionDate.getTime()) / DAY_MS) + 1)
    : 0;
  const daysSinceLastSession = lastSessionDate ? Math.max(0, Math.floor((now.getTime() - lastSessionDate.getTime()) / DAY_MS)) : null;
  const lifetimeDailyAverage = observedSpanDays > 0 ? Math.round(lifetimeSeconds / observedSpanDays) : 0;
  const staleSkillCount = staleRanks.filter((rank) => rank.value >= 14).length;
  const skillCoverage = ratio(skills.filter((skill) => skill.session_count > 0 || skill.lifetime_seconds > 0).length, skills.length);
  const goalCoverage = ratio(skills.filter((skill) => skill.weekly_target_seconds > 0 || skill.target_sessions_per_week > 0 || skill.goal_note).length, skills.length);
  const plannedAdherence = plannedSeconds > 0 ? clampPercent(1 - (Math.abs(countedSeconds - plannedSeconds) / plannedSeconds)) : 0;
  const recoveryGapDays = Math.max(0, ...daySeries.map((day, index) => {
    if (day.seconds > 0) {
      return 0;
    }

    let gap = 0;
    for (let cursor = index; cursor >= 0 && daySeries[cursor].seconds === 0; cursor -= 1) {
      gap += 1;
    }

    return gap;
  }));
  const dailyAverage7 = Math.round(weekSeconds / 7);
  const dailyAverage30 = Math.round(monthSeconds / 30);
  const weeklyDelta = weekSeconds - previousWeekSeconds;
  const accelerationRatio = previousWeekSeconds > 0 ? weekSeconds / previousWeekSeconds : weekSeconds > 0 ? 1 : 0;
  const daysToDoubleLifetime = dailyAverage30 > 0 && lifetimeSeconds > 0 ? Math.ceil(lifetimeSeconds / dailyAverage30) : null;
  const milestones = skills
    .filter((skill) => !skill.is_downtime)
    .map((skill) => {
      const target = MILESTONES_SECONDS.find((candidate) => candidate > skill.lifetime_seconds) ?? MILESTONES_SECONDS.at(-1)!;
      const skillRecentSeconds = skillRecentMap.get(skill.name) ?? 0;
      const dailyVelocity = skillRecentSeconds / 90;
      const remaining = Math.max(0, target - skill.lifetime_seconds);

      return {
        skill: skill.name,
        current_seconds: skill.lifetime_seconds,
        target_seconds: target,
        remaining_seconds: remaining,
        eta_days: dailyVelocity > 0 ? Math.ceil(remaining / dailyVelocity) : null,
      };
    })
    .sort((a, b) => a.remaining_seconds - b.remaining_seconds)
    .slice(0, 8);
  const issues: InsightIssue[] = [];
  const topSkill = skillLifetimeRanks[0];
  const neglectedSkill = skills
    .filter((skill) => skill.lifetime_seconds > 0)
    .sort((a, b) => String(a.last_session_at ?? "").localeCompare(String(b.last_session_at ?? "")))[0];
  const dataHealth: InsightDataHealth[] = [
    {
      label: "Lifetime Storage",
      value: lifetimeSeconds > 0 ? "active" : "ready",
      detail: "Lifetime seconds are kept as durable skill totals and can be snapshotted by the new tracking migration.",
      tone: "good",
    },
    {
      label: "Session Completeness",
      value: `${Math.round(ratio(countedSessions.length + skippedSessions.length, usefulSessions.length) * 100)}%`,
      detail: `${pendingSessions.length} sessions are waiting for count/skip decisions.`,
      tone: pendingSessions.length > 0 ? "warn" : "good",
    },
    {
      label: "Coverage",
      value: `${Math.round(skillCoverage * 100)}%`,
      detail: `${skills.filter((skill) => skill.session_count > 0 || skill.lifetime_seconds > 0).length} of ${skills.length} trackers have recorded investment.`,
      tone: skillCoverage < 0.5 && skills.length > 0 ? "warn" : "neutral",
    },
    {
      label: "Manual Adjustment Share",
      value: `${Math.round(ratio(manualSeconds, observedSeconds) * 100)}%`,
      detail: "High manual share is useful, but should stay intentional so the ledger remains trustworthy.",
      tone: ratio(manualSeconds, observedSeconds) > 0.35 ? "warn" : "neutral",
    },
    {
      label: "Intent Coverage",
      value: `${Math.round(goalCoverage * 100)}%`,
      detail: `${skills.filter((skill) => skill.weekly_target_seconds > 0 || skill.target_sessions_per_week > 0 || skill.goal_note).length} trackers have goals, cadence, or priority intent.`,
      tone: goalCoverage < 0.5 && skills.length > 0 ? "warn" : "good",
    },
    {
      label: "Quality Coverage",
      value: `${Math.round(ratio(ratedQualitySessions.length, usefulSessions.length) * 100)}%`,
      detail: `${ratedQualitySessions.length} sessions include a quality score.`,
      tone: ratedQualitySessions.length === 0 && usefulSessions.length > 0 ? "warn" : "neutral",
    },
  ];

  if (topSkill) {
    issues.push({
      title: "Dominant investment lane",
      detail: `${topSkill.label} holds ${Math.round(topSkill.share * 100)}% of visible lifetime allocation.`,
      tone: topSkill.share > 0.55 ? "warn" : "good",
    });
  }

  if (dailyAverage7 > dailyAverage30 && dailyAverage30 > 0) {
    issues.push({
      title: "Momentum is accelerating",
      detail: "The 7-day daily pace is ahead of the 30-day baseline.",
      tone: "good",
    });
  } else if (dailyAverage30 > 0) {
    issues.push({
      title: "Momentum needs a restart",
      detail: "The 7-day daily pace is at or below the 30-day baseline.",
      tone: "warn",
    });
  }

  if (pendingSessions.length > 0) {
    issues.push({
      title: "Pending lifetime decisions",
      detail: `${pendingSessions.length} stopped timer${pendingSessions.length === 1 ? "" : "s"} still need count/skip decisions.`,
      tone: "warn",
    });
  }

  if (neglectedSkill?.last_session_at) {
    issues.push({
      title: "Longest neglected lane",
      detail: `${neglectedSkill.name} has the oldest last-session timestamp among active tracked skills.`,
      tone: "neutral",
    });
  }

  if (deepWorkSessions.length > 0) {
    issues.push({
      title: "Deep work is present",
      detail: `${deepWorkSessions.length} sessions cleared the 90-minute threshold.`,
      tone: "good",
    });
  }

  if (staleSkillCount > 0) {
    issues.push({
      title: "Stale trackers detected",
      detail: `${staleSkillCount} invested trackers have gone 14+ days without a counted session.`,
      tone: "warn",
    });
  }

  if (goalCoverage < 1 && skills.length > 0) {
    issues.push({
      title: "Intent data can improve",
      detail: "Trackers without weekly targets, cadence, or priority are harder to judge against actual goals.",
      tone: goalCoverage < 0.5 ? "warn" : "neutral",
    });
  }

  if (ratedQualitySessions.length > 0) {
    issues.push({
      title: "Quality signal is active",
      detail: `Average quality is ${averageQualityScore.toFixed(1)} out of 5 across rated sessions.`,
      tone: averageQualityScore >= 4 ? "good" : "neutral",
    });
  }

  if (interruptionCount > 0) {
    issues.push({
      title: "Interruptions are being captured",
      detail: `${interruptionCount} interruptions are recorded across observed sessions.`,
      tone: ratio(interruptionCount, usefulSessions.length) > 1 ? "warn" : "neutral",
    });
  }

  if (usefulSessions.length === 0) {
    issues.push({
      title: "No session history yet",
      detail: "Insights will sharpen once timers have completed sessions to analyze.",
      tone: "neutral",
    });
  }

  return {
    mode,
    generated_at: generatedAt ?? now.toISOString(),
    error,
    headline: {
      title: mode === "admin" ? "Private Time Intelligence" : "Public Proof-of-Work Intelligence",
      subtitle:
        mode === "admin"
          ? "A full control-room readout of allocation, behavior, momentum, proof, risk, and next milestones."
          : "A public-safe readout derived only from visible Chronos dashboard totals.",
    },
    totals: {
      lifetime_seconds: lifetimeSeconds,
      active_seconds: activeSeconds,
      counted_seconds: countedSeconds,
      observed_seconds: observedSeconds,
      today_seconds: today?.seconds ?? 0,
      yesterday_seconds: yesterday?.seconds ?? 0,
      week_seconds: weekSeconds,
      month_seconds: monthSeconds,
      private_seconds: privateSeconds,
      public_seconds: publicSeconds,
      skipped_seconds: skippedSeconds,
      pending_seconds: pendingSeconds,
      session_count: usefulSessions.length,
      counted_session_count: countedSessions.length,
      skipped_session_count: skippedSessions.length,
      pending_session_count: pendingSessions.length,
      active_session_count: activeSessionCount,
      skill_count: skills.length,
      deep_work_seconds: deepWorkSeconds,
      micro_session_seconds: microSessionSeconds,
      manual_seconds: manualSeconds,
      timer_seconds: timerSeconds,
      system_seconds: systemSeconds,
      idle_seconds: idleSeconds,
      planned_seconds: plannedSeconds,
      rated_session_count: Math.max(ratedQualitySessions.length, ratedEnergySessions.length, ratedFocusSessions.length),
      interruption_count: interruptionCount,
      paused_seconds: pausedSeconds,
    },
    behavior: {
      average_session_seconds: usefulSessions.length > 0 ? Math.round(observedSeconds / usefulSessions.length) : 0,
      median_session_seconds: median(durations),
      longest_session_seconds: Math.max(0, ...durations),
      shortest_session_seconds: durations.length > 0 ? Math.min(...durations) : 0,
      completion_rate: ratio(countedSessions.length, usefulSessions.length),
      private_share: ratio(privateSeconds, observedSeconds),
      focus_score: clampPercent(focusScore),
      balance_score: clampPercent(balanceScore),
      consistency_score: consistencyScore,
      current_streak_days: streaks.current,
      longest_streak_days: streaks.longest,
      active_day_count: activeDays.length,
      observed_span_days: observedSpanDays,
      days_since_last_session: daysSinceLastSession,
      deep_work_session_count: deepWorkSessions.length,
      micro_session_count: microSessions.length,
      switch_count: switchCount,
      context_switch_rate: ratio(switchCount, Math.max(1, usefulSessions.length - 1)),
      skill_coverage: skillCoverage,
      entropy_score: entropyScore,
      stale_skill_count: staleSkillCount,
      recovery_gap_days: recoveryGapDays,
      best_day: bestDay,
      peak_hour: peakHourRank ? { hour: Number.parseInt(peakHourRank.label, 10), seconds: peakHourRank.value } : null,
      peak_weekday: peakWeekdayRank ? { weekday: peakWeekdayRank.label, seconds: peakWeekdayRank.value } : null,
      average_quality_score: averageQualityScore,
      average_energy_score: averageEnergyScore,
      average_focus_rating: averageFocusRating,
      planned_adherence: plannedAdherence,
      goal_coverage: goalCoverage,
    },
    velocity: {
      daily_average_7d_seconds: dailyAverage7,
      daily_average_30d_seconds: dailyAverage30,
      projected_week_seconds: dailyAverage7 * 7,
      projected_month_seconds: dailyAverage30 * 30,
      projected_year_seconds: dailyAverage30 * 365,
      yesterday_delta_seconds: (today?.seconds ?? 0) - (yesterday?.seconds ?? 0),
      previous_week_seconds: previousWeekSeconds,
      weekly_delta_seconds: weeklyDelta,
      acceleration_ratio: accelerationRatio,
      lifetime_daily_average_seconds: lifetimeDailyAverage,
      days_to_double_lifetime: daysToDoubleLifetime,
    },
    rankings: {
      skills_by_lifetime: skillLifetimeRanks,
      skills_by_recent: skillRecentRanks,
      skills_by_staleness: staleRanks,
      session_lengths: sessionLengthRanks,
      weekday_heatmap: weekdayRanks,
      hourly_heatmap: hourlyRanks,
      source_breakdown: sourceBreakdown,
      privacy_breakdown: privacyBreakdown,
      project_breakdown: projectBreakdown,
      tag_breakdown: tagBreakdown,
      goal_progress: goalProgress,
    },
    timelines: {
      last_14_days: last14,
      last_30_days: last30,
      last_8_weeks: last8Weeks,
    },
    milestones,
    data_health: dataHealth,
    issues,
  };
}

function publicSkills(payload: PublicDashboardPayload | null): InsightSkill[] {
  return (payload?.skills ?? []).map((skill: PublicDashboardSkill) => ({
    id: skill.id ?? skill.slug ?? skill.name ?? "public-skill",
    name: skill.name ?? "Visible skill",
    visibility: "public",
    is_downtime: false,
    lifetime_seconds: asNumber(skill.lifetime_seconds),
    weekly_target_seconds: asNumber(skill.weekly_target_seconds),
    target_sessions_per_week: asNumber(skill.target_sessions_per_week),
    priority_weight: asNumber(skill.priority_weight) || 3,
    goal_note: skill.goal_note ?? null,
    active_seconds: asNumber(skill.current_active_elapsed_seconds),
    session_count: 0,
    last_session_at: null,
  }));
}

function publicSessions(payload: PublicDashboardPayload | null): InsightSession[] {
  const generatedAt = payload?.generated_at ?? new Date().toISOString();

  return (payload?.skills ?? [])
    .filter((skill) => asNumber(skill.today_seconds) > 0)
    .map((skill) => ({
      id: `public-${skill.id ?? skill.slug ?? skill.name}`,
      skill_id: skill.id ?? skill.slug ?? skill.name ?? "public-skill",
      skill_name: skill.name ?? "Visible skill",
      started_at: generatedAt,
      ended_at: generatedAt,
      source: "system",
      is_private: false,
      counts_toward_lifetime: true,
      duration_seconds: asNumber(skill.today_seconds),
    }));
}

export async function getChronosInsights(isAuthenticated: boolean): Promise<ChronosInsights> {
  if (isAuthenticated) {
    const [{ state, error: stateError }, { sessions: sessionRows, error: sessionError }] = await Promise.all([
      getAdminTimerState(),
      getAdminSessionRows(),
    ]);

    if (state) {
      const sessions = normalizeAdminSessions(sessionRows, state.skills, state.recent_sessions ?? []);
      const insights = deriveInsights({
        activeSessionCount: state.active_session ? 1 : 0,
        error: sessionError,
        generatedAt: state.generated_at,
        mode: "admin",
        sessions,
        skills: buildSkillSummaries(state.skills, sessions),
      });

      await recordAdminInsightSnapshot(insights);
      return insights;
    }

    return emptyInsights(stateError ?? sessionError ?? "Chronos admin insight data is unavailable.");
  }

  const { payload, error } = await getPublicDashboard();

  if (payload) {
    const skills = publicSkills(payload);
    return deriveInsights({
      activeSessionCount: payload.active_session ? 1 : 0,
      error,
      generatedAt: payload.generated_at,
      mode: "public",
      sessions: publicSessions(payload),
      skills,
    });
  }

  return emptyInsights(error ?? "Chronos public insight data is unavailable.");
}

function emptyInsights(error: string | null): ChronosInsights {
  return deriveInsights({
    activeSessionCount: 0,
    error,
    mode: "empty",
    sessions: [],
    skills: [],
  });
}
