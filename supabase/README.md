# Chronos Supabase schema

Chronos uses a dedicated `chronos` schema inside a shared Supabase project. This repository owns only that schema.

Do not create Chronos tables in `public`, and do not alter schemas owned by other applications in the shared project.

## Before applying anything

Chronos contains real production data. Never assume the deployed schema matches every migration file in the repository.

1. Confirm the intended Supabase project.
2. Inspect the current `chronos` tables, functions, grants, policies, and migration state.
3. Back up affected data.
4. Review the exact SQL delta and any destructive operations.
5. Apply only the missing files from `supabase/migrations/` in timestamp order.
6. Verify anonymous public reads, authenticated owner reads, and a full start/stop/count timer flow.

The file `20260504120000_chronos_foundation.down.sql` is a manual emergency rollback only. It drops the entire `chronos` schema and must not be run against production unless the data has been backed up and destruction is explicitly intended.

## Bootstrap the owner

After the foundation migration is applied, copy `seed_chronos_owner.template.sql` into the SQL Editor, replace `YOUR_LOGIN_EMAIL_HERE`, and run the resulting statement.

This grants bootstrap eligibility only. Supabase Auth remains the identity source, and `auth.users.id` anchors Chronos access.

## Environment variables

Use the Supabase publishable key for new configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Existing deployments may use `NEXT_PUBLIC_SUPABASE_ANON_KEY` as a temporary fallback. Do not commit `.env`, `.env.local`, service-role keys, access tokens, or production exports. A service-role key must never be exposed to browser code.

## Custom schema API setup

If the runtime needs PostgREST access to `chronos`, expose that schema in the target project’s API settings. Supabase project defaults can change, so verify this explicitly rather than relying on automatic exposure.

Migrations grant minimal schema usage and table privileges for authenticated users; row-level security still controls row access. Anonymous visitors should use `chronos.get_public_dashboard()` rather than direct table reads.

## Auth redirects

Configure the exact production host and local development callback patterns in Supabase Auth. The current public deployment is:

- `https://chronos.yuvrajkashyap.com/**`
- `http://localhost:3000/**`

If a custom domain is added later, add it only after ownership and TLS are verified.

## Security invariants

- Chronos data lives only in `chronos.*`.
- RLS is enabled on application tables.
- Public dashboard access is filtered through `chronos.get_public_dashboard()`.
- Downtime skills, private skills, and private sessions are excluded from the public payload.
- Admin bootstrap is limited to emails in `chronos.allowed_emails`.
- Timer exclusivity is enforced by a partial unique index on active sessions.
- SECURITY DEFINER functions use a fixed search path and explicit execution grants.
