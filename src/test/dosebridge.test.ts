import { describe, expect, it } from "vitest";
import { buildSmsReminderText, LANGUAGES, TRANSLATIONS } from "@/lib/i18n";
import { formatTime12h, getDueScheduledKey, isValidPhoneNumber } from "@/lib/dosebridge-utils";

describe("DoseBridge i18n and SMS rules", () => {
  it("supports all 6 requested languages with 7 day names", () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(["en", "es", "zh", "fr", "vi", "ht"]);
    for (const lang of LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      expect(dict.daysShort).toHaveLength(7);
      expect(dict.addReminderBtn.length).toBeGreaterThan(0);
      expect(dict.autoSendNote.length).toBeGreaterThan(0);
    }
  });

  it("builds translated SMS reminders under 150 characters without a Reply 1 prompt", () => {
    for (const lang of LANGUAGES) {
      const msg = buildSmsReminderText(lang.code, {
        name: "Metformin",
        dosage: "500mg — 1 tablet",
        instructions: "Take with food",
      });
      expect(msg.length).toBeLessThan(150);
      expect(msg).toContain("Metformin");
      expect(msg).toContain("500mg");
      expect(msg.toLowerCase()).not.toContain("reply 1");
    }
  });

  it("caps long custom instructions strictly under 150 characters", () => {
    const longMsg = buildSmsReminderText("en", {
      name: "Atorvastatin Calcium",
      dosage: "20mg — 1 film-coated tablet",
      instructions:
        "Take one tablet by mouth every evening after dinner with a full glass of water and avoid grapefruit juice",
    });
    expect(longMsg.length).toBeLessThan(150);
    expect(longMsg).toContain("Atorvastatin Calcium");
  });

  it("triggers automatic reminders only when active, on the right day and time, and not yet sent", () => {
    // 2026-11-21 is Saturday (weekday 6). 13:00Z = 08:00 America/New_York (EST, UTC-5).
    const sat8am = new Date("2026-11-21T13:00:00Z");
    const med = {
      is_active: true,
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      reminder_time: "08:00",
      last_sent_at: null as string | null,
    };
    expect(getDueScheduledKey(med, "America/New_York", sat8am, 1)).toBe("2026-11-21 08:00");
    expect(getDueScheduledKey({ ...med, is_active: false }, "America/New_York", sat8am, 1)).toBe(
      null,
    );
    expect(
      getDueScheduledKey({ ...med, days_of_week: [1, 2, 3] }, "America/New_York", sat8am, 1),
    ).toBe(null);
    expect(
      getDueScheduledKey(
        { ...med, last_sent_at: "2026-11-21T13:00:10Z" },
        "America/New_York",
        sat8am,
        1,
      ),
    ).toBe(null);
  });

  it("validates phone numbers and formats 24h times to 12h", () => {
    expect(isValidPhoneNumber("+1 (555) 234-5678")).toBe(true);
    expect(isValidPhoneNumber("")).toBe(false);
    expect(isValidPhoneNumber("123")).toBe(false);
    expect(formatTime12h("08:00")).toBe("08:00 AM");
    expect(formatTime12h("21:30")).toBe("09:30 PM");
  });
});