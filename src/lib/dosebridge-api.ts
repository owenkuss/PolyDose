import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { LanguageCode } from "@/lib/i18n";

export type PatientRow = Tables<"patients">;
export type MedicationRow = Tables<"medications">;
export type ReminderLogRow = Tables<"reminder_logs">;

export async function loadPatientByPhone(phoneNumber: string): Promise<PatientRow | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("phone_number", phoneNumber.trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadFirstPatient(): Promise<PatientRow | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertPatientProfile(input: {
  phoneNumber: string;
  language: LanguageCode;
  timezone: string;
}): Promise<PatientRow> {
  const { data, error } = await supabase
    .from("patients")
    .upsert(
      {
        phone_number: input.phoneNumber.trim(),
        language: input.language,
        timezone: input.timezone,
      },
      { onConflict: "phone_number" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updatePatientLanguage(
  patientId: string,
  language: LanguageCode,
): Promise<PatientRow> {
  const { data, error } = await supabase
    .from("patients")
    .update({ language })
    .eq("id", patientId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMedications(patientId: string): Promise<MedicationRow[]> {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMedication(input: {
  patientId: string;
  name: string;
  dosage: string;
  instructions: string;
  daysOfWeek: number[];
  reminderTime: string;
}): Promise<MedicationRow> {
  const { data, error } = await supabase
    .from("medications")
    .insert({
      patient_id: input.patientId,
      name: input.name.trim(),
      dosage: input.dosage.trim(),
      instructions: input.instructions.trim(),
      days_of_week: [...input.daysOfWeek].sort((a, b) => a - b),
      reminder_time: input.reminderTime,
      is_active: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function toggleMedicationActive(
  medicationId: string,
  isActive: boolean,
): Promise<MedicationRow> {
  const { data, error } = await supabase
    .from("medications")
    .update({ is_active: isActive })
    .eq("id", medicationId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedication(medicationId: string): Promise<void> {
  const { error } = await supabase.from("medications").delete().eq("id", medicationId);
  if (error) throw error;
}

export async function fetchReminderLogs(patientId: string): Promise<ReminderLogRow[]> {
  const { data, error } = await supabase
    .from("reminder_logs")
    .select("*")
    .eq("patient_id", patientId)
    .order("sent_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function recordAutomaticReminder(input: {
  patientId: string;
  medicationId: string;
  messageText: string;
  language: LanguageCode;
  scheduledKey: string;
}): Promise<{ log: ReminderLogRow; medication: MedicationRow } | null> {
  const { data: log, error: logError } = await supabase
    .from("reminder_logs")
    .insert({
      patient_id: input.patientId,
      medication_id: input.medicationId,
      message_text: input.messageText,
      language: input.language,
      scheduled_key: input.scheduledKey,
    })
    .select("*")
    .single();

  if (logError) {
    if (logError.code === "23505") return null;
    throw logError;
  }

  const { data: medication, error: medError } = await supabase
    .from("medications")
    .update({ last_sent_at: log.sent_at })
    .eq("id", input.medicationId)
    .select("*")
    .single();
  if (medError) throw medError;

  return { log, medication };
}