# Methodology

Chronos treats time as an investment ledger. The methodology favors durable accounting and explicit decisions over invisible automatic correction.

## Core workflow

1. Choose a skill or life domain.
2. Start its timer. Database constraints prevent a second active timer.
3. Stop the timer to create a completed, pending session.
4. Count the session toward the skill’s lifetime total or skip it.
5. Use manual adjustments only when reconstructing time outside the timer or establishing a historical baseline.

Downtime tracking describes gaps between deliberate sessions. It is operational context, not a public accomplishment category.

## Time calculations

- A completed session duration is the non-negative whole-second difference between its end and start timestamps.
- An active duration is the non-negative whole-second difference between the current time and stored start timestamp.
- Display formatting permits totals above 24 hours; hours are cumulative and do not wrap by day.
- A skill’s displayed public total is its stored lifetime seconds, except an active card displays the current active elapsed time as such.
- Sorting by hours includes the current active elapsed duration so a running timer is ranked by what the visitor sees.

## Session classifications

- **Counted:** accepted into lifetime investment.
- **Skipped:** retained as observed history but excluded from lifetime investment.
- **Pending:** stopped but awaiting a count/skip decision.
- **Private:** visible only in authenticated analysis.

These are deliberately separate states. Completion rate is `counted sessions / all useful completed sessions`; pending sessions are not silently treated as successes.

## Insight definitions

The insight engine uses deterministic UTC day buckets so server and client locale differences do not change historical aggregation.

| Metric | Definition |
| --- | --- |
| Observed time | Sum of completed useful session durations |
| Counted time | Observed duration whose lifetime decision is true |
| Skipped time | Observed duration whose lifetime decision is false |
| Pending time | Observed duration with no lifetime decision |
| Deep work | Sessions at least 90 minutes long |
| Micro session | Sessions no longer than 10 minutes |
| Current streak | Consecutive active UTC days ending on the latest day in the analysis window |
| Balance score | One minus the sum of squared lifetime allocation shares |
| Skill coverage | Skills with a session or non-zero lifetime total divided by all skills |
| Seven-day pace | Counted duration in the latest seven UTC days divided by seven |
| Thirty-day pace | Counted duration in the latest thirty UTC days divided by thirty |

Quality, energy, focus, planned-time, interruption, project, and tag metrics are calculated only when those optional fields exist in the deployed schema and contain data.

## Estimation policy

Historical time from before structured Chronos sessions may be entered as an approximate baseline. Those baselines are allowed because the product’s purpose is long-horizon allocation, but they are disclosed and must not be represented as second-by-second observed history.

Future schema work should attach provenance metadata to each manual adjustment so observed sessions, reconstructed records, and historical estimates can be separated at the transaction level.

## Validation policy

Changes are checked with:

- Clean dependency installation from the lockfile
- ESLint with zero warnings
- Strict TypeScript without emit
- Unit tests for formatting, dashboard transforms, and insight accounting
- A production Next.js build
- Browser checks at desktop and mobile viewports against real public-safe data
- Read-only production verification before any database migration

Production database changes require a separate reviewed operation because Chronos remains actively used.
