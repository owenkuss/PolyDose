import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";
import { DEFAULT_DEMO_PHONE, isValidPhoneNumber } from "@/lib/dosebridge-utils";
import { isLanguageCode, type LanguageCode } from "@/lib/i18n";

type PatientRow = Tables<"patients">;

const PhoneLookupSchema = z.object({
  phoneNumber: z.string().trim().min(1).max(40),
});

const UpsertPatientSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .refine((value) => isValidPhoneNumber(value), "Invalid phone number"),
  language: z.string().refine((value): value is LanguageCode => isLanguageCode(value), "Unsupported language"),
  timezone: z.string().trim().min(1).max(64),
});

const UpdateLanguageSchema = z.object({
  patientId: z.string().uuid(),
  language: z.string().refine((value): value is LanguageCode => isLanguageCode(value), "Unsupported language"),
});

export const getPatientByPhone = createServerFn({ method: "POST" })
  .inputValidator((data) => PhoneLookupSchema.parse(data))
  .handler(async ({ data }): Promise<PatientRow | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("phone_number", data.phoneNumber)
      .maybeSingle();
    if (error) {
      console.error("Failed to look up patient:", error);
      throw new Error("Failed to load patient profile");
    }
    return patient;
  });

export const getDemoPatient = createServerFn({ method: "GET" }).handler(
  async (): Promise<PatientRow | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("phone_number", DEFAULT_DEMO_PHONE)
      .maybeSingle();
    if (error) {
      console.error("Failed to load demo patient:", error);
      throw new Error("Failed to load demo profile");
    }
    return patient;
  },
);

export const savePatientProfile = createServerFn({ method: "POST" })
  .inputValidator((data) => UpsertPatientSchema.parse(data))
  .handler(async ({ data }): Promise<PatientRow> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .upsert(
        {
          phone_number: data.phoneNumber,
          language: data.language,
          timezone: data.timezone,
        },
        { onConflict: "phone_number" },
      )
      .select("*")
      .single();
    if (error || !patient) {
      console.error("Failed to save patient profile:", error);
      throw new Error("Failed to save patient profile");
    }
    return patient;
  });

export const savePatientLanguage = createServerFn({ method: "POST" })
  .inputValidator((data) => UpdateLanguageSchema.parse(data))
  .handler(async ({ data }): Promise<PatientRow> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .update({ language: data.language })
      .eq("id", data.patientId)
      .select("*")
      .single();
    if (error || !patient) {
      console.error("Failed to update patient language:", error);
      throw new Error("Failed to update language preference");
    }
    return patient;
  });