CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO anon, authenticated;
GRANT ALL ON public.patients TO service_role;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read patients"
  ON public.patients FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert patients"
  ON public.patients FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update patients"
  ON public.patients FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete patients"
  ON public.patients FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
  reminder_time TEXT NOT NULL DEFAULT '08:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  last_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medications_patient_id ON public.medications(patient_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO anon, authenticated;
GRANT ALL ON public.medications TO service_role;

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read medications"
  ON public.medications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert medications"
  ON public.medications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update medications"
  ON public.medications FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete medications"
  ON public.medications FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO public.patients (id, phone_number, language, timezone)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  '+1 (555) 234-5678',
  'en',
  'America/New_York'
)
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO public.medications (
  id,
  patient_id,
  name,
  dosage,
  instructions,
  days_of_week,
  reminder_time,
  is_active
)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Metformin',
  '500mg — 1 tablet',
  'Take with food',
  ARRAY[0, 1, 2, 3, 4, 5, 6],
  '08:00',
  true
)
ON CONFLICT (id) DO NOTHING;