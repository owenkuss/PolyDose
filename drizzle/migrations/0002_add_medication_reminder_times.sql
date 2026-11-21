ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS reminder_times text[] NOT NULL DEFAULT ARRAY['08:00']::text[];

UPDATE public.medications
SET reminder_times = ARRAY[reminder_time]
WHERE reminder_times = ARRAY['08:00']::text[]
  AND reminder_time IS NOT NULL
  AND reminder_time <> '08:00';