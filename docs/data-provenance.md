# Data provenance

Chronos presents real production totals, but not every number has the same evidentiary strength. This document makes that boundary explicit.

## Data classes

| Class | Source | Strength | Public behavior |
| --- | --- | --- | --- |
| Completed timer session | Start and stop timestamps stored in PostgreSQL | Strongest; reconstructable from a session record | Contributes only after the owner chooses count |
| Active timer | Stored start timestamp plus current server/client time | Live, time-dependent | Displayed as elapsed time when its skill is public |
| Manual lifetime adjustment | Explicit owner mutation recorded against a skill | Intentional but not session-reconstructable | Included in the skill lifetime total |
| Historical baseline estimate | Pre-Chronos activity carried into a lifetime total | Approximate | Included with a visible product-level estimation disclosure |
| Skipped session | Completed session classified not to count | Auditable exclusion | Does not increase lifetime investment |
| Pending session | Completed session awaiting count/skip choice | Unresolved | Does not silently become lifetime investment |

## Public projection

Anonymous visitors do not receive raw session history, owner identity records, private skills, or downtime activity. The database function `chronos.get_public_dashboard()` produces the public-safe payload. The application transforms that payload for sorting and display but does not replace it with local sample data.

An unavailable payload renders an availability notice. This matters for evidence quality: an outage should look like an outage, not a convincing set of invented numbers.

## What a lifetime total means

A skill lifetime total is the owner-accepted cumulative investment for that skill. It can combine counted sessions, manual adjustments, and an acknowledged historical baseline. It should not be interpreted as an independently verified payroll or attendance record.

The public interface discloses that most structured tracking began when the owner was 21 and that some earlier totals are estimated. The current schema does not tag each historical estimated segment individually, so Chronos does not claim more precision than it can prove.

## Derived metrics

Insight calculations derive from the fields available to the current request. They distinguish counted, skipped, and pending sessions; public and private time; and timer, manual, and system sources. Missing optional analytics fields contribute zero or an unavailable state rather than guessed values.

See [methodology.md](methodology.md) for formulas and thresholds.

## Repository boundary

This repository contains application code and schema migrations only. It does not contain:

- Production rows or database exports
- Authentication cookies or user records
- Supabase service-role credentials
- Fabricated recruiter/demo datasets
- Claims about usage by people other than the owner

Screenshots committed to the repository are captures of the public production-safe dashboard and contain only information already visible at the live URL.
