CREATE TABLE public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  scheduled_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (medication_id, scheduled_key)
);

CREATE INDEX idx_reminder_logs_patient_sent ON public.reminder_logs(patient_id, sent_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_logs TO anon, authenticated;
GRANT ALL ON public.reminder_logs TO service_role;

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reminder_logs"
  ON public.reminder_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert reminder_logs"
  ON public.reminder_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public delete reminder_logs"
  ON public.reminder_logs FOR DELETE
  TO anon, authenticated
  USING (true);