-- Run this after applying the Chronos foundation migration.
-- Replace the placeholder with the Supabase Auth email Yuvraj will use to administer Chronos.

insert into chronos.allowed_emails (email, note)
values (lower('YOUR_LOGIN_EMAIL_HERE'), 'Chronos owner')
on conflict (email) do nothing;
