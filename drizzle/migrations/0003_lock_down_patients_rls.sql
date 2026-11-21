DROP POLICY IF EXISTS "Public read patients" ON public.patients;
DROP POLICY IF EXISTS "Public insert patients" ON public.patients;
DROP POLICY IF EXISTS "Public update patients" ON public.patients;
DROP POLICY IF EXISTS "Public delete patients" ON public.patients;

REVOKE ALL ON public.patients FROM anon, authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;