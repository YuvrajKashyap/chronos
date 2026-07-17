# Security policy

Chronos is a single-owner application backed by real private session data. Please do not include credentials, user data, or exploit details in a public issue.

## Reporting

Use GitHub’s private vulnerability reporting for this repository when available. Otherwise, contact the maintainer through the linked GitHub profile and request a private channel before sharing technical details.

Include the affected route or function, reproduction conditions, impact, and any suggested mitigation. Do not access, modify, or retain data that is not yours while validating a report.

## Supported version

Only the current `main` branch and current production deployment are supported.

## Security boundaries

- Authentication is provided by Supabase Auth through server-side cookie handling.
- Owner access is independently restricted by the Chronos allowlist and row-level security.
- Anonymous data is exposed only through a filtered public dashboard RPC.
- Service-role keys are never required by the browser application.
- Database mutation functions use explicit grants and fixed search paths.
- A partial unique index prevents overlapping active timer sessions.

Secrets belong in local or deployment environment configuration. `.env`, `.env.local`, production exports, and credentials must never be committed.
