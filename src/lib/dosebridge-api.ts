import type { Tables } from "@/integrations/supabase/types";
import type { LanguageCode } from "@/lib/i18n";
import {
  createMedicationRecord,
  deleteMedicationRecord,
  listMedicationsByPatient,
  listReminderLogsByPatient,
  recordReminderLog,
  setMedicationActive,
  updateMedicationRecord,
} from "@/lib/medications.functions";
import {
  getDemoPatient,
  getPatientByPhone,
  savePatientLanguage,
  savePatientProfile,
} from "@/lib/patients.functions";

export type PatientRow = Tables<"patients">;
export type MedicationRow = Tables<"medications">;
export type ReminderLogRow = Tables<"reminder_logs">;

export async function loadPatientByPhone(phoneNumber: string): Promise<PatientRow | null> {
  return getPatientByPhone({ data: { phoneNumber: phoneNumber.trim() } });
}

export async function loadFirstPatient(): Promise<PatientRow | null> {
  return getDemoPatient();
}

export async function upsertPatientProfile(input: {
  phoneNumber: string;
  language: LanguageCode;
  timezone: string;
}): Promise<PatientRow> {
  return savePatientProfile({
    data: {
      phoneNumber: input.phoneNumber.trim(),
      language: input.language,
      timezone: input.timezone,
    },
  });
}

export async function updatePatientLanguage(
  patientId: string,
  language: LanguageCode,
): Promise<PatientRow> {
  return savePatientLanguage({ data: { patientId, language } });
}

export async function fetchMedications(patientId: string): Promise<MedicationRow[]> {
  return listMedicationsByPatient({ data: { patientId } });
}

export async function createMedication(input: {
  patientId: string;
  name: string;
  dosage: string;
  instructions: string;
  daysOfWeek: number[];
  reminderTimes: string[];
}): Promise<MedicationRow> {
  return createMedicationRecord({ data: input });
}

export async function toggleMedicationActive(
  medicationId: string,
  isActive: boolean,
): Promise<MedicationRow> {
  return setMedicationActive({ data: { medicationId, isActive } });
}

export async function updateMedication(
  medicationId: string,
  input: {
    name: string;
    dosage: string;
    instructions: string;
    daysOfWeek: number[];
    reminderTimes: string[];
  },
): Promise<MedicationRow> {
  return updateMedicationRecord({ data: { medicationId, ...input } });
}

export async function deleteMedication(medicationId: string): Promise<void> {
  await deleteMedicationRecord({ data: { medicationId } });
}

export async function fetchReminderLogs(patientId: string): Promise<ReminderLogRow[]> {
  return listReminderLogsByPatient({ data: { patientId } });
}

export async function recordAutomaticReminder(input: {
  patientId: string;
  medicationId: string;
  messageText: string;
  language: LanguageCode;
  scheduledKey: string;
}): Promise<{ log: ReminderLogRow; medication: MedicationRow } | null> {
  return recordReminderLog({ data: input });
}