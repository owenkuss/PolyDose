import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizePhoneForSms } from "@/lib/dosebridge-utils";
import { isLanguageCode } from "@/lib/i18n";

const SendReminderSmsSchema = z.object({
  patientId: z.string().uuid(),
  medicationId: z.string().uuid(),
  messageText: z.string().min(1).max(300),
  language: z.string(),
  scheduledKey: z.string().min(1).max(120),
});

export const sendReminderSms = createServerFn({ method: "POST" })
  .inputValidator((data) => SendReminderSmsSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendSmsViaTextbelt } = await import("@/lib/sms.server");

    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("phone_number")
      .eq("id", data.patientId)
      .single();
    if (patientError || !patient) {
      throw new Error("Patient not found");
    }

    const sms = await sendSmsViaTextbelt({
      phone: normalizePhoneForSms(patient.phone_number),
      message: data.messageText,
    });

    const language = isLanguageCode(data.language) ? data.language : "en";
    const { data: log, error: logError } = await supabaseAdmin
      .from("reminder_logs")
      .insert({
        patient_id: data.patientId,
        medication_id: data.medicationId,
        message_text: data.messageText,
        language,
        scheduled_key: data.scheduledKey,
      })
      .select("*")
      .single();

    if (logError) {
      if (logError.code === "23505") {
        return { logged: false, smsSent: sms.success, smsError: sms.error, medication: null };
      }
      console.error("Failed to insert reminder log:", logError);
      throw new Error("Failed to log reminder");
    }

    const { data: medication, error: medError } = await supabaseAdmin
      .from("medications")
      .update({ last_sent_at: log.sent_at })
      .eq("id", data.medicationId)
      .select("*")
      .single();
    if (medError) {
      console.error("Failed to update medication last_sent_at:", medError);
      throw new Error("Failed to update medication");
    }

    return { logged: true, smsSent: sms.success, smsError: sms.error, medication };
  });
