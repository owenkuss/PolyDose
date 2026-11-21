import { createServerFn } from "@tanstack/react-start";
import { isLanguageCode, type LanguageCode } from "@/lib/i18n";

export const generateSmsReminder = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { language: string; name: string; dosage: string; instructions: string }) => {
      const language: LanguageCode = isLanguageCode(data.language) ? data.language : "en";
      return {
        language,
        name: String(data.name ?? "").trim(),
        dosage: String(data.dosage ?? "").trim(),
        instructions: String(data.instructions ?? "").trim(),
      };
    },
  )
  .handler(async ({ data }): Promise<{ messageText: string }> => {
    const { generateSmsReminderText } = await import("./gemini.server");
    const messageText = await generateSmsReminderText(data);
    return { messageText };
  });

export const checkDrugInteractions = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      language: string;
      medications: { name: string; dosage: string; instructions: string }[];
    }) => {
      if (!Array.isArray(data.medications) || data.medications.length === 0) {
        throw new Error("At least one medication is required.");
      }
      const language: LanguageCode = isLanguageCode(data.language) ? data.language : "en";
      return {
        language,
        medications: data.medications.slice(0, 20).map((m) => ({
          name: String(m.name ?? "").trim(),
          dosage: String(m.dosage ?? "").trim(),
          instructions: String(m.instructions ?? "").trim(),
        })),
      };
    },
  )
  .handler(async ({ data }) => {
    const { runDrugInteractionCheck } = await import("./gemini.server");
    return runDrugInteractionCheck(data);
  });