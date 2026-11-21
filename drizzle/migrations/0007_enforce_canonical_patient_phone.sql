CREATE OR REPLACE FUNCTION public.normalize_patient_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  digits text;
BEGIN
  digits := regexp_replace(COALESCE(NEW.phone_number, ''), '\D', '', 'g');
  IF length(digits) = 10 THEN
    NEW.phone_number := '+1' || digits;
  ELSIF length(digits) = 11 AND left(digits, 1) = '1' THEN
    NEW.phone_number := '+' || digits;
  ELSIF length(digits) > 0 THEN
    NEW.phone_number := '+' || digits;
  END IF;
  RETURN NEW;
END;
$$;

WITH normalized AS (
  SELECT
    id,
    created_at,
    CASE
      WHEN length(regexp_replace(phone_number, '\D', '', 'g')) = 10
        THEN '+1' || regexp_replace(phone_number, '\D', '', 'g')
      WHEN length(regexp_replace(phone_number, '\D', '', 'g')) = 11
        AND left(regexp_replace(phone_number, '\D', '', 'g'), 1) = '1'
        THEN '+' || regexp_replace(phone_number, '\D', '', 'g')
      ELSE '+' || regexp_replace(phone_number, '\D', '', 'g')
    END AS canonical_phone
  FROM public.patients
),
ranked AS (
  SELECT
    id,
    canonical_phone,
    first_value(id) OVER (
      PARTITION BY canonical_phone
      ORDER BY created_at DESC, id DESC
    ) AS keep_id
  FROM normalized
),
dupes AS (
  SELECT id AS old_id, keep_id
  FROM ranked
  WHERE id <> keep_id
),
move_meds AS (
  UPDATE public.medications m
  SET patient_id = d.keep_id
  FROM dupes d
  WHERE m.patient_id = d.old_id
),
move_logs AS (
  UPDATE public.reminder_logs r
  SET patient_id = d.keep_id
  FROM dupes d
  WHERE r.patient_id = d.old_id
)
DELETE FROM public.patients p
USING dupes d
WHERE p.id = d.old_id;

UPDATE public.patients
SET phone_number = CASE
  WHEN length(regexp_replace(phone_number, '\D', '', 'g')) = 10
    THEN '+1' || regexp_replace(phone_number, '\D', '', 'g')
  WHEN length(regexp_replace(phone_number, '\D', '', 'g')) = 11
    AND left(regexp_replace(phone_number, '\D', '', 'g'), 1) = '1'
    THEN '+' || regexp_replace(phone_number, '\D', '', 'g')
  ELSE '+' || regexp_replace(phone_number, '\D', '', 'g')
END
WHERE phone_number <> CASE
  WHEN length(regexp_replace(phone_number, '\D', '', 'g')) = 10
    THEN '+1' || regexp_replace(phone_number, '\D', '', 'g')
  WHEN length(regexp_replace(phone_number, '\D', '', 'g')) = 11
    AND left(regexp_replace(phone_number, '\D', '', 'g'), 1) = '1'
    THEN '+' || regexp_replace(phone_number, '\D', '', 'g')
  ELSE '+' || regexp_replace(phone_number, '\D', '', 'g')
END;

DROP TRIGGER IF EXISTS trg_normalize_patient_phone ON public.patients;
CREATE TRIGGER trg_normalize_patient_phone
BEFORE INSERT OR UPDATE OF phone_number ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.normalize_patient_phone();