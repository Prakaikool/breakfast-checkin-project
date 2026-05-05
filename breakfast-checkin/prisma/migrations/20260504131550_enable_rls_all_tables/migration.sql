-- Enable Row Level Security on every table in the public schema.
--
-- This app connects to Postgres as the `postgres` superuser via Prisma,
-- which bypasses RLS completely — so the application is unaffected.
--
-- What this blocks: direct access to these tables through Supabase's
-- auto-generated PostgREST API using the `anon` or `authenticated` keys.
-- Without RLS, anyone with the public anon key could read/write all rows.

ALTER TABLE public.staff                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakfast_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruction_sections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations    ENABLE ROW LEVEL SECURITY;
