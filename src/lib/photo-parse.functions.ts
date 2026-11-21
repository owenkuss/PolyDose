import { createServerFn } from "@tanstack/react-start";

export interface ParsedMedicationLabel {
  name: string;
  dosage: string;
  instructions: string;
  reminderTimes: string[];
}

const MAX_IMAGE_BASE64_LENGTH = 7_000_000; // ~5 MB image
const TIME_24_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_PARSED_REMINDER_TIMES = 8;

// Tried in order; a model that is retired (404) or overloaded (503) falls through to the next.
const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash-lite"];

export const parseMedicationPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: { imageBase64: string; mimeType: string }) => {
    if (!data || typeof data.imageBase64 !== "string" || data.imageBase64.length === 0) {
      throw new Error("A photo is required.");
    }
    if (data.imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      throw new Error("The photo is too large.");
    }
    const mimeType =
      typeof data.mimeType === "string" && data.mimeType.startsWith("image/")
        ? data.mimeType
        : "image/jpeg";
    return { imageBase64: data.imageBase64, mimeType };
  })
  .handler(async ({ data }): Promise<ParsedMedicationLabel> => {
    const apiKey = process.env["GOOGLE_API_KEY"];
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not configured.");
    }

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: [
                "This is a photo of a prescription bottle or medication label.",
                "Extract the medication details and respond with ONLY a JSON object:",
                '{"name":"","dosage":"","instructions":"","reminderTimes":[]}',
                "- name: the medication name (e.g. Metformin).",
                '- dosage: strength and form (e.g. "500mg", "10mg tablet").',
                '- instructions: short dosing directions (e.g. "Take 1 tablet twice daily with food").',
                '- reminderTimes: array of 24-hour "HH:MM" strings for a practical waking-hours daily schedule inferred from the dosing instructions (start around "08:00" and keep doses within waking hours up to "22:00").',
                'Examples: "every 4 hours" or "every 4-6 hours" -> ["08:00","12:00","16:00","20:00"]; "every 6 hours" or "every 8 hours" or "3 times daily" -> ["08:00","14:00","20:00"]; "twice daily" or "every 12 hours" -> ["08:00","20:00"]; "once daily at bedtime" -> ["21:00"]; "once daily" -> ["08:00"].',
                "Use empty strings (and [] for reminderTimes) for anything you cannot read. No markdown, no extra text.",
              ].join(" "),
            },
            { inline_data: { mime_type: data.mimeType, data: data.imageBase64 } },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    });

    let response: Response | null = null;
    let lastError = "";
    for (const model of GEMINI_MODELS) {
      const attempt = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          redirect: "manual",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: requestBody,
        },
      );
      if (attempt.ok) {
        response = attempt;
        break;
      }
      lastError = `${model} [${attempt.status}]: ${(await attempt.text()).slice(0, 300)}`;
      console.error(`Gemini request failed — ${lastError}`);
      if (attempt.status !== 404 && attempt.status !== 503 && attempt.status !== 429) break;
    }

    if (!response) {
      throw new Error(`Gemini request failed — ${lastError}`);
    }

    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const empty: ParsedMedicationLabel = {
      name: "",
      dosage: "",
      instructions: "",
      reminderTimes: [],
    };
    try {
      const obj = JSON.parse(text) as Record<string, unknown>;
      const name = obj["name"];
      const dosage = obj["dosage"];
      const instructions = obj["instructions"];
      const rawTimes = obj["reminderTimes"];
      const validTimes = new Set<string>();
      if (Array.isArray(rawTimes)) {
        for (const entry of rawTimes) {
          if (typeof entry === "string") {
            const trimmed = entry.trim();
            if (TIME_24_PATTERN.test(trimmed)) {
              validTimes.add(trimmed);
            }
          }
        }
      }
      const reminderTimes = [...validTimes]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, MAX_PARSED_REMINDER_TIMES);
      return {
        name: typeof name === "string" ? name.trim() : "",
        dosage: typeof dosage === "string" ? dosage.trim() : "",
        instructions: typeof instructions === "string" ? instructions.trim() : "",
        reminderTimes,
      };
    } catch {
      console.error(`Gemini returned non-JSON text: ${text.slice(0, 200)}`);
      return empty;
    }
  });
