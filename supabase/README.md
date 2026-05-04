# Chronos Supabase Foundation

Chronos uses the shared Supabase project `yk-portfolio`. This repository owns only the `chronos` schema.

Do not create Chronos tables in `public`, and do not alter `axis.*`, `capital.*`, `arcade.*`, `jasiverse.*`, or any other app schema.

## Apply the Migration

1. Open the Supabase dashboard for `yk-portfolio`.
2. Go to SQL Editor.
3. Run `supabase/migrations/20260504120000_chronos_foundation.sql`.
4. Confirm the objects are created under `chronos.*`.

The rollback file `supabase/migrations/20260504120000_chronos_foundation.down.sql` is provided for manual rollback only. It drops the `chronos` schema and should not be run after production data exists unless that data has been backed up.

## Seed the Owner Allowlist

After the migration is applied, copy `supabase/seed_chronos_owner.template.sql` into the SQL Editor, replace `YOUR_LOGIN_EMAIL_HERE`, and run it.

This seed grants bootstrap eligibility only. Supabase Auth remains the identity source, and `auth.users.id` anchors Chronos access.

## Environment Variables

Add these values locally and in Vercel when the frontend is wired to Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit `.env`, `.env.local`, service role keys, or secrets. Service role keys must never be exposed to browser code.

## Custom Schema API Setup

If runtime access to `chronos` is needed through PostgREST/Supabase clients, expose the `chronos` schema in the Supabase API settings for `yk-portfolio`.

The migration grants minimal schema usage plus table privileges for `authenticated`; row-level security policies still control access. Anonymous public reads should use `chronos.get_public_dashboard()` rather than direct table access.

## Auth Redirects For Later

When auth is wired, add redirect URLs for:

- `https://chronos.yuvrajkashyap.com/**`
- `http://localhost:3000/**`

## Security Notes

- Chronos app data lives only in `chronos.*`.
- RLS is enabled on every Chronos table.
- Public dashboard access is filtered through `chronos.get_public_dashboard()`.
- Downtime skills and private sessions are excluded from the public dashboard payload.
- Admin bootstrap is limited to emails in `chronos.allowed_emails`.
- Timer exclusivity is enforced by a partial unique index on active sessions.
