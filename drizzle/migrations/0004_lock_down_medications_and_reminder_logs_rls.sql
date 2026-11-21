DROP POLICY IF EXISTS "Public read medications" ON public.medications;
DROP POLICY IF EXISTS "Public insert medications" ON public.medications;
DROP POLICY IF EXISTS "Public update medications" ON public.medications;
DROP POLICY IF EXISTS "Public delete medications" ON public.medications;

REVOKE ALL ON public.medications FROM anon, authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reminder_logs" ON public.reminder_logs;
DROP POLICY IF EXISTS "Public insert reminder_logs" ON public.reminder_logs;
DROP POLICY IF EXISTS "Public delete reminder_logs" ON public.reminder_logs;

REVOKE ALL ON public.reminder_logs FROM anon, authenticated;
GRANT ALL ON public.reminder_logs TO service_role;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;