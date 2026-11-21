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