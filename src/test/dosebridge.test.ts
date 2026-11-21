import { describe, expect, it } from "vitest";
import { buildSmsReminderText, LANGUAGES, TRANSLATIONS } from "@/lib/i18n";
import { formatTime12h, isTakenToday, isValidPhoneNumber } from "@/lib/dosebridge-utils";

describe("DoseBridge i18n and SMS rules", () => {
  it("supports all 6 requested languages with 7 day names", () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(["en", "es", "zh", "fr", "vi", "ht"]);
    for (const lang of LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      expect(dict.daysShort).toHaveLength(7);
      expect(dict.addReminderBtn.length).toBeGreaterThan(0);
      expect(dict.replyTakenBtn.length).toBeGreaterThan(0);
    }
  });

  it("builds translated SMS reminders under 150 characters including medicine, dosage, instructions, and reply 1", () => {
    for (const lang of LANGUAGES) {
      const msg = buildSmsReminderText(lang.code, {
        name: "Metformin",
        dosage: "500mg — 1 tablet",
        instructions: "Take with food",
      });
      expect(msg.length).toBeLessThan(150);
      expect(msg).toContain("Metformin");
      expect(msg).toContain("500mg");
      expect(msg).toContain("1");
    }
  });

  it("caps long custom instructions strictly under 150 characters while preserving the Reply 1 prompt", () => {
    const longMsg = buildSmsReminderText("en", {
      name: "Atorvastatin Calcium",
      dosage: "20mg — 1 film-coated tablet",
      instructions:
        "Take one tablet by mouth every evening after dinner with a full glass of water and avoid grapefruit juice",
    });
    expect(longMsg.length).toBeLessThan(150);
    expect(longMsg).toContain("Reply 1 to confirm.");
  });

  it("detects Taken Today accurately against the given date", () => {
    const now = new Date("2026-11-21T15:00:00Z");
    expect(isTakenToday("2026-11-21T13:30:00Z", "America/New_York", now)).toBe(true);
    expect(isTakenToday("2026-11-20T13:30:00Z", "America/New_York", now)).toBe(false);
    expect(isTakenToday(null, "America/New_York", now)).toBe(false);
  });

  it("validates phone numbers and formats 24h times to 12h", () => {
    expect(isValidPhoneNumber("+1 (555) 234-5678")).toBe(true);
    expect(isValidPhoneNumber("")).toBe(false);
    expect(isValidPhoneNumber("123")).toBe(false);
    expect(formatTime12h("08:00")).toBe("08:00 AM");
    expect(formatTime12h("21:30")).toBe("09:30 PM");
  });
});