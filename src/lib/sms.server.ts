const TEXTBELT_API_URL = "https://textbelt.com/text";
const TEXTBELT_TIMEOUT_MS = 10_000;

export interface TextbeltResult {
  success: boolean;
  error: string | null;
  quotaRemaining: number | null;
}

export async function sendSmsViaTextbelt(input: {
  phone: string;
  message: string;
}): Promise<TextbeltResult> {
  const apiKey = process.env["TEXTBELT_API_KEY"];
  if (!apiKey) {
    return { success: false, error: "TEXTBELT_API_KEY is not configured.", quotaRemaining: null };
  }
  if (!input.phone) {
    return { success: false, error: "No phone number to text.", quotaRemaining: null };
  }

  let response: Response;
  try {
    response = await fetch(TEXTBELT_API_URL, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(TEXTBELT_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: input.phone, message: input.message, key: apiKey }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Textbelt request failed:", message);
    return { success: false, error: message, quotaRemaining: null };
  }

  try {
    const json = (await response.json()) as {
      success?: boolean;
      error?: string;
      quotaRemaining?: number;
    };
    if (json.success === true) {
      return { success: true, error: null, quotaRemaining: json.quotaRemaining ?? null };
    }
    const error = json.error ?? `Textbelt request failed (${response.status})`;
    console.error("Textbelt send failed:", error);
    return { success: false, error, quotaRemaining: json.quotaRemaining ?? null };
  } catch {
    return {
      success: false,
      error: `Textbelt returned an unreadable response (${response.status})`,
      quotaRemaining: null,
    };
  }
}
