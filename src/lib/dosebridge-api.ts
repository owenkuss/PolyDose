import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { LanguageCode } from "@/lib/i18n";

export type PatientRow = Tables<"patients">;
export type MedicationRow = Tables<"medications">;

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

export async function markReminderSent(medicationId: string): Promise<MedicationRow> {
  const { data, error } = await supabase
    .from("medications")
    .update({ last_sent_at: new Date().toISOString() })
    .eq("id", medicationId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function markMedicationTaken(medicationId: string): Promise<MedicationRow> {
  const { data, error } = await supabase
    .from("medications")
    .update({ last_confirmed_at: new Date().toISOString() })
    .eq("id", medicationId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}