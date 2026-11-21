import { buildSmsReminderText, LANGUAGES, type LanguageCode } from "@/lib/i18n";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_ATTEMPT_TIMEOUT_MS = 10_000;

// Fast model for SMS reminder generation; falls back if unavailable or overloaded.
export const GEMINI_SMS_MODELS = ["gemini-3.5-flash-lite"] as const;

// Multimodal + search-grounded model for pill-bottle scanning and drug checks.
export const GEMINI_MULTIMODAL_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
] as const;

export interface GeminiGroundingSource {
  title: string;
  uri: string;
}

export interface GeminiGenerateResult {
  text: string;
  model: string;
  sources: GeminiGroundingSource[];
}

export function getGeminiApiKey(): string {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return apiKey;
}

export async function callGeminiGenerateContent(options: {
  models: readonly string[];
  body: Record<string, unknown>;
}): Promise<GeminiGenerateResult> {
  const apiKey = getGeminiApiKey();
  const requestBody = JSON.stringify(options.body);

  let response: Response | null = null;
  let usedModel = options.models[0] ?? "gemini-3.8-flash";
  let lastError = "";

  for (const model of options.models) {
    let attempt: Response;
    try {
      attempt = await fetch(`${GEMINI_API_BASE}/${model}:generateContent`, {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(GEMINI_ATTEMPT_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: requestBody,
      });
    } catch (err) {
      lastError = `${model} [timeout/network]: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`Gemini request failed — ${lastError}`);
      continue;
    }

    if (attempt.ok) {
      response = attempt;
      usedModel = model;
      break;
    }

    lastError = `${model} [${attempt.status}]: ${(await attempt.text()).slice(0, 300)}`;
    console.error(`Gemini request failed — ${lastError}`);
    if (attempt.status !== 404 && attempt.status !== 503 && attempt.status !== 429) {
      break;
    }
  }

  if (!response) {
    throw new Error(`Gemini request failed — ${lastError}`);
  }

  const json = (await response.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      groundingMetadata?: {
        groundingChunks?: { web?: { title?: string; uri?: string } }[];
      };
    }[];
  };

  const candidate = json.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  const sources: GeminiGroundingSource[] = [];
  for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
    if (chunk.web?.uri) {
      sources.push({
        title: chunk.web.title?.trim() || chunk.web.uri,
        uri: chunk.web.uri,
      });
    }
  }

  return { text, model: usedModel, sources };
}

export async function generateSmsReminderText(input: {
  language: LanguageCode;
  name: string;
  dosage: string;
  instructions: string;
}): Promise<string> {
  const fallback = buildSmsReminderText(input.language, input);
  const langName =
    LANGUAGES.find((l) => l.code === input.language)?.englishLabel ?? "English";

  try {
    const { text } = await callGeminiGenerateContent({
      models: GEMINI_SMS_MODELS,
      body: {
        contents: [
          {
            parts: [
              {
                text: [
                  `Write one short, warm SMS medication reminder in ${langName} (language code: ${input.language}).`,
                  "Keep it strictly under 145 characters, plain text only, no quotes, no emojis, no reply instructions.",
                  `Medication: ${input.name}`,
                  `Dosage: ${input.dosage}`,
                  input.instructions ? `Instructions: ${input.instructions}` : "",
                ]
                  .filter(Boolean)
                  .join("\n"),
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
      },
    });

    const cleaned = text.replace(/\s+/g, " ").trim();
    if (cleaned.length > 0 && cleaned.length < 150) {
      return cleaned;
    }
    return fallback;
  } catch (err) {
    console.error("Falling back to template SMS reminder:", err);
    return fallback;
  }
}

export async function runDrugInteractionCheck(input: {
  medications: { name: string; dosage: string; instructions: string }[];
  language: LanguageCode;
}): Promise<{ summary: string; sources: GeminiGroundingSource[]; model: string }> {
  const langName =
    LANGUAGES.find((l) => l.code === input.language)?.englishLabel ?? "English";
  const medLines = input.medications
    .map((m) => `- ${m.name} (${m.dosage})${m.instructions ? `: ${m.instructions}` : ""}`)
    .join("\n");

  const result = await callGeminiGenerateContent({
    models: GEMINI_MULTIMODAL_MODELS,
    body: {
      contents: [
        {
          parts: [
            {
              text: [
                `Review this patient's medication list and provide a brief, plain-language safety & interaction check in ${langName}.`,
                "Highlight any notable drug interactions, timing conflicts, or common precautions. Remind them to confirm with a pharmacist or doctor.",
                medLines,
              ].join("\n"),
            },
          ],
        },
      ],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2 },
    },
  });

  return {
    summary: result.text,
    sources: result.sources,
    model: result.model,
  };
}