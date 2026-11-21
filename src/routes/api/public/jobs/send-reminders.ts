import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { getDueScheduledKey } from "@/lib/dosebridge-utils";
import { isLanguageCode, type LanguageCode } from "@/lib/i18n";

const JobBodySchema = z.object({
  windowMinutes: z.number().int().min(1).max(60).optional(),
});

export const Route = createFileRoute("/api/public/jobs/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        let windowMinutes = 15;
        try {
          const raw = await request.text();
          if (raw.trim()) {
            const parsed = JobBodySchema.safeParse(JSON.parse(raw));
            if (parsed.success && parsed.data.windowMinutes) {
              windowMinutes = parsed.data.windowMinutes;
            }
          }
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { generateSmsReminderText } = await import("@/lib/gemini.server");
        const { data: meds, error } = await supabaseAdmin
          .from("medications")
          .select(
            "id, patient_id, name, dosage, instructions, days_of_week, reminder_time, reminder_times, is_active, last_sent_at, patients(language, timezone)",
          )
          .eq("is_active", true);

        if (error) {
          console.error("Failed to fetch active medications:", error);
          return Response.json({ error: "Database query failed" }, { status: 500 });
        }

        const now = new Date();
        let sent = 0;

        for (const med of meds ?? []) {
          const patient = Array.isArray(med.patients) ? med.patients[0] : med.patients;
          const tz = patient?.timezone || "America/New_York";
          const lang: LanguageCode =
            patient?.language && isLanguageCode(patient.language) ? patient.language : "en";

          const scheduledKey = getDueScheduledKey(med, tz, now, windowMinutes);
          if (!scheduledKey) continue;

          const messageText = await generateSmsReminderText({
            language: lang,
            name: med.name,
            dosage: med.dosage,
            instructions: med.instructions,
          });

          const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("reminder_logs")
            .insert({
              patient_id: med.patient_id,
              medication_id: med.id,
              message_text: messageText,
              language: lang,
              scheduled_key: scheduledKey,
            })
            .select("sent_at")
            .single();

          if (insertErr) {
            if (insertErr.code !== "23505") {
              console.error("Failed to insert reminder log:", insertErr);
            }
            continue;
          }

          await supabaseAdmin
            .from("medications")
            .update({ last_sent_at: inserted.sent_at })
            .eq("id", med.id);
          sent += 1;
        }

        return Response.json({ checked: meds?.length ?? 0, sent });
      },
    },
  },
});