update public.reminder_logs set message_text = regexp_replace(message_text, '(?i)dose[\s_-]?bridge', 'PolyDose', 'g') where message_text ~* 'dose[\s_-]?bridge';

update public.reminder_logs set message_text = regexp_replace(message_text, '(?i)pillping', 'PolyDose', 'g') where message_text ~* 'pillping';