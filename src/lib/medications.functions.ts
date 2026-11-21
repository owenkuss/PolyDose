import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";
import { normalizeReminderTimes } from "@/lib/dosebridge-utils";
import { isLanguageCode, type LanguageCode } from "@/lib/i18n";

type MedicationRow = Tables<"medications">;
type ReminderLogRow = Tables<"reminder_logs">;

const PatientIdSchema = z.object({
  patientId: z.string().uuid(),
});

const MedicationIdSchema = z.object({
  medicationId: z.string().uuid(),
});

const MedicationFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  dosage: z.string().trim().min(1).max(200),
  instructions: z.string().trim().max(500).default(""),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  reminderTimes: z.array(z.string()).min(1).max(8),
});

const CreateMedicationSchema = MedicationFieldsSchema.extend({
  patientId: z.string().uuid(),
});

const UpdateMedicationSchema = MedicationFieldsSchema.extend({
  medicationId: z.string().uuid(),
});

const ToggleMedicationSchema = z.object({
  medicationId: z.string().uuid(),
  isActive: z.boolean(),
});

const RecordReminderSchema = z.object({
  patientId: z.string().uuid(),
  medicationId: z.string().uuid(),
  messageText: z.string().trim().min(1).max(500),
  language: z.string().refine((value): value is LanguageCode => isLanguageCode(value), "Unsupported language"),
  scheduledKey: z.string().trim().min(1).max(120),
});

export const listMedicationsByPatient = createServerFn({ method: "POST" })
  .inputValidator((data) => PatientIdSchema.parse(data))
  .handler(async ({ data }): Promise<MedicationRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: meds, error } = await supabaseAdmin
      .from("medications")
      .select("*")
      .eq("patient_id", data.patientId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch medications:", error);
      throw new Error("Failed to load medications");
    }
    return meds ?? [];
  });

export const createMedicationRecord = createServerFn({ method: "POST" })
  .inputValidator((data) => CreateMedicationSchema.parse(data))
  .handler(async ({ data }): Promise<MedicationRow> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const times = normalizeReminderTimes(data.reminderTimes);
    const uniqueDays = [...new Set(data.daysOfWeek)].sort((a, b) => a - b);
    const { data: created, error } = await supabaseAdmin
      .from("medications")
      .insert({
        patient_id: data.patientId,
        name: data.name,
        dosage: data.dosage,
        instructions: data.instructions,
        days_of_week: uniqueDays,
        reminder_time: times[0] ?? "08:00",
        reminder_times: times,
        is_active: true,
      })
      .select("*")
      .single();
    if (error || !created) {
      console.error("Failed to create medication:", error);
      throw new Error("Failed to create medication");
    }
    return created;
  });

export const updateMedicationRecord = createServerFn({ method: "POST" })
  .inputValidator((data) => UpdateMedicationSchema.parse(data))
  .handler(async ({ data }): Promise<MedicationRow> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const times = normalizeReminderTimes(data.reminderTimes);
    const uniqueDays = [...new Set(data.daysOfWeek)].sort((a, b) => a - b);
    const { data: updated, error } = await supabaseAdmin
      .from("medications")
      .update({
        name: data.name,
        dosage: data.dosage,
        instructions: data.instructions,
        days_of_week: uniqueDays,
        reminder_time: times[0] ?? "08:00",
        reminder_times: times,
      })
      .eq("id", data.medicationId)
      .select("*")
      .single();
    if (error || !updated) {
      console.error("Failed to update medication:", error);
      throw new Error("Failed to update medication");
    }
    return updated;
  });

export const setMedicationActive = createServerFn({ method: "POST" })
  .inputValidator((data) => ToggleMedicationSchema.parse(data))
  .handler(async ({ data }): Promise<MedicationRow> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("medications")
      .update({ is_active: data.isActive })
      .eq("id", data.medicationId)
      .select("*")
      .single();
    if (error || !updated) {
      console.error("Failed to toggle medication:", error);
      throw new Error("Failed to update medication status");
    }
    return updated;
  });

export const deleteMedicationRecord = createServerFn({ method: "POST" })
  .inputValidator((data) => MedicationIdSchema.parse(data))
  .handler(async ({ data }): Promise<{ deleted: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("medications").delete().eq("id", data.medicationId);
    if (error) {
      console.error("Failed to delete medication:", error);
      throw new Error("Failed to delete medication");
    }
    return { deleted: true };
  });

export const listReminderLogsByPatient = createServerFn({ method: "POST" })
  .inputValidator((data) => PatientIdSchema.parse(data))
  .handler(async ({ data }): Promise<ReminderLogRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: logs, error } = await supabaseAdmin
      .from("reminder_logs")
      .select("*")
      .eq("patient_id", data.patientId)
      .order("sent_at", { ascending: true })
      .limit(50);
    if (error) {
      console.error("Failed to fetch reminder logs:", error);
      throw new Error("Failed to load reminder logs");
    }
    return logs ?? [];
  });

export const recordReminderLog = createServerFn({ method: "POST" })
  .inputValidator((data) => RecordReminderSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ log: ReminderLogRow; medication: MedicationRow } | null> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: log, error: logError } = await supabaseAdmin
        .from("reminder_logs")
        .insert({
          patient_id: data.patientId,
          medication_id: data.medicationId,
          message_text: data.messageText,
          language: data.language,
          scheduled_key: data.scheduledKey,
        })
        .select("*")
        .single();

      if (logError) {
        if (logError.code === "23505") return null;
        console.error("Failed to record reminder log:", logError);
        throw new Error("Failed to record reminder log");
      }

      const { data: medication, error: medError } = await supabaseAdmin
        .from("medications")
        .update({ last_sent_at: log.sent_at })
        .eq("id", data.medicationId)
        .select("*")
        .single();
      if (medError || !medication) {
        console.error("Failed to update medication last_sent_at:", medError);
        throw new Error("Failed to update medication reminder timestamp");
      }

      return { log, medication };
    },
  );