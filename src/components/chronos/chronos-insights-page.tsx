import type { ChronosInsights, InsightDay, InsightIssue, InsightMilestone, InsightRank } from "@/lib/chronos/insights";
import { formatSecondsAsTimer } from "@/lib/chronos/format-time";
import { ChronosShell } from "./chronos-shell";

function compactTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours >= 1000) {
    return `${Math.round(hours / 100) / 10}k h`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${safeSeconds}s`;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function signedTime(seconds: number) {
  if (seconds === 0) {
    return "0m";
  }

  return `${seconds > 0 ? "+" : "-"}${compactTime(Math.abs(seconds))}`;
}

function InsightMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="insight-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function RankList({ ranks }: { ranks: InsightRank[] }) {
  if (ranks.length === 0) {
    return <p className="insight-empty">No data yet.</p>;
  }

  const max = Math.max(...ranks.map((rank) => rank.value), 1);

  return (
    <div className="insight-rank-list">
      {ranks.map((rank) => (
        <div className="insight-rank-row" key={`${rank.label}-${rank.meta}`}>
          <div>
            <strong>{rank.label}</strong>
            <span>{rank.meta}</span>
          </div>
          <div className="insight-rank-bar" aria-hidden="true">
            <span style={{ width: `${Math.max(4, Math.round((rank.value / max) * 100))}%` }} />
          </div>
          <em>{compactTime(rank.value)}</em>
        </div>
      ))}
    </div>
  );
}

function Timeline({ days }: { days: InsightDay[] }) {
  const max = Math.max(...days.map((day) => day.seconds), 1);

  return (
    <div className="insight-timeline">
      {days.map((day) => (
        <div className="insight-day" key={day.key}>
          <span style={{ height: `${Math.max(7, Math.round((day.seconds / max) * 100))}%` }} aria-hidden="true" />
          <strong>{day.label}</strong>
          <em>{compactTime(day.seconds)}</em>
        </div>
      ))}
    </div>
  );
}

function IssueList({ issues }: { issues: InsightIssue[] }) {
  return (
    <div className="insight-issue-list">
      {issues.map((issue) => (
        <article className={`insight-issue is-${issue.tone}`} key={issue.title}>
          <span>{issue.tone}</span>
          <strong>{issue.title}</strong>
          <p>{issue.detail}</p>
        </article>
      ))}
    </div>
  );
}

function Milestones({ milestones }: { milestones: InsightMilestone[] }) {
  if (milestones.length === 0) {
    return <p className="insight-empty">Milestones appear once tracked skills have lifetime totals.</p>;
  }

  return (
    <div className="insight-milestone-list">
      {milestones.map((milestone) => (
        <article className="insight-milestone" key={`${milestone.skill}-${milestone.target_seconds}`}>
          <div>
            <strong>{milestone.skill}</strong>
            <span>{compactTime(milestone.current_seconds)} / {compactTime(milestone.target_seconds)}</span>
          </div>
          <p>{compactTime(milestone.remaining_seconds)} remaining</p>
          <em>{milestone.eta_days === null ? "ETA unknown" : `${milestone.eta_days}d at current pace`}</em>
        </article>
      ))}
    </div>
  );
}

export function ChronosInsightsPage({
  insights,
  isAuthenticated,
}: {
  insights: ChronosInsights;
  isAuthenticated: boolean;
}) {
  const hasPrivateData = insights.mode === "admin";

  return (
    <ChronosShell isAuthenticated={isAuthenticated}>
      <main className="insights-main">
        <section className="insights-hero" aria-labelledby="insights-title">
          <p className="auth-kicker">{hasPrivateData ? "Private Analysis" : "Public Analysis"}</p>
          <h1 id="insights-title">{insights.headline.title}</h1>
          <p>{insights.headline.subtitle}</p>
          {insights.error ? <p className="admin-inline-message is-error">{insights.error}</p> : null}
        </section>

        <section className="insight-metric-grid" aria-label="Core totals">
          <InsightMetric label="Lifetime Capital" value={compactTime(insights.totals.lifetime_seconds)} note="All counted investment across active trackers." />
          <InsightMetric label="This Week" value={compactTime(insights.totals.week_seconds)} note="Rolling 7-day counted pace." />
          <InsightMetric label="Today" value={compactTime(insights.totals.today_seconds)} note={`${signedTime(insights.velocity.yesterday_delta_seconds)} versus yesterday.`} />
          <InsightMetric label="Sessions" value={String(insights.totals.session_count)} note={`${insights.totals.counted_session_count} counted, ${insights.totals.skipped_session_count} skipped.`} />
          <InsightMetric label="Focus Score" value={percent(insights.behavior.focus_score)} note="Higher means time is concentrated into fewer lanes." />
          <InsightMetric label="Consistency" value={percent(insights.behavior.consistency_score)} note={`${insights.behavior.active_day_count} active days in the last 90.`} />
          <InsightMetric label="Current Streak" value={`${insights.behavior.current_streak_days}d`} note={`${insights.behavior.longest_streak_days}d longest observed streak.`} />
          <InsightMetric label="Average Session" value={compactTime(insights.behavior.average_session_seconds)} note={`Median ${compactTime(insights.behavior.median_session_seconds)}.`} />
        </section>

        <section className="insight-section-grid">
          <article className="insight-panel is-wide">
            <div className="insight-panel-heading">
              <span>Momentum</span>
              <h2>Last 14 Days</h2>
            </div>
            <Timeline days={insights.timelines.last_14_days} />
          </article>

          <article className="insight-panel">
            <div className="insight-panel-heading">
              <span>Projection</span>
              <h2>Run Rate</h2>
            </div>
            <div className="insight-projection-grid">
              <InsightMetric label="7d Avg" value={compactTime(insights.velocity.daily_average_7d_seconds)} note="Per day." />
              <InsightMetric label="30d Avg" value={compactTime(insights.velocity.daily_average_30d_seconds)} note="Per day." />
              <InsightMetric label="Year Pace" value={compactTime(insights.velocity.projected_year_seconds)} note="If the 30d pace holds." />
            </div>
          </article>
        </section>

        <section className="insight-section-grid">
          <article className="insight-panel">
            <div className="insight-panel-heading">
              <span>Allocation</span>
              <h2>Lifetime by Skill</h2>
            </div>
            <RankList ranks={insights.rankings.skills_by_lifetime} />
          </article>

          <article className="insight-panel">
            <div className="insight-panel-heading">
              <span>Recent Bias</span>
              <h2>Last 90 Days by Skill</h2>
            </div>
            <RankList ranks={insights.rankings.skills_by_recent} />
          </article>
        </section>

        <section className="insight-section-grid">
          <article className="insight-panel">
            <div className="insight-panel-heading">
              <span>Timing</span>
              <h2>Weekday Heat</h2>
            </div>
            <RankList ranks={insights.rankings.weekday_heatmap} />
          </article>

          <article className="insight-panel">
            <div className="insight-panel-heading">
              <span>Timing</span>
              <h2>Hour Heat</h2>
            </div>
            <RankList ranks={insights.rankings.hourly_heatmap} />
          </article>
        </section>

        <section className="insight-section-grid">
          <article className="insight-panel">
            <div className="insight-panel-heading">
              <span>Behavior</span>
              <h2>Session Extremes</h2>
            </div>
            <RankList ranks={insights.rankings.session_lengths} />
          </article>

          <article className="insight-panel">
            <div className="insight-panel-heading">
              <span>Next Proof</span>
              <h2>Milestone Radar</h2>
            </div>
            <Milestones milestones={insights.milestones} />
          </article>
        </section>

        <section className="insight-section-grid">
          <article className="insight-panel is-wide">
            <div className="insight-panel-heading">
              <span>Long View</span>
              <h2>Last 8 Weeks</h2>
            </div>
            <Timeline days={insights.timelines.last_8_weeks} />
          </article>

          <article className="insight-panel">
            <div className="insight-panel-heading">
              <span>Derived Signals</span>
              <h2>What Chronos Sees</h2>
            </div>
            <IssueList issues={insights.issues} />
          </article>
        </section>

        <section className="insight-metric-grid" aria-label="Audit metrics">
          <InsightMetric label="Public Work" value={compactTime(insights.totals.public_seconds)} note={`${percent(1 - insights.behavior.private_share)} of observed session time.`} />
          <InsightMetric label="Private Work" value={compactTime(insights.totals.private_seconds)} note={`${percent(insights.behavior.private_share)} of observed session time.`} />
          <InsightMetric label="Pending Time" value={compactTime(insights.totals.pending_seconds)} note={`${insights.totals.pending_session_count} sessions need decisions.`} />
          <InsightMetric label="Skipped Time" value={compactTime(insights.totals.skipped_seconds)} note="Recorded but excluded from lifetime capital." />
          <InsightMetric label="Longest Session" value={compactTime(insights.behavior.longest_session_seconds)} note={`Shortest: ${compactTime(insights.behavior.shortest_session_seconds)}.`} />
          <InsightMetric label="Completion Rate" value={percent(insights.behavior.completion_rate)} note="Share of observed sessions counted toward lifetime." />
        </section>

        <p className="insight-generated">Generated {new Date(insights.generated_at).toLocaleString()} · raw timer format {formatSecondsAsTimer(insights.totals.lifetime_seconds)}</p>
      </main>
    </ChronosShell>
  );
}
