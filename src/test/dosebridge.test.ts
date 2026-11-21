import { describe, expect, it } from "vitest";
import { buildSmsReminderText, isRtlLanguage, LANGUAGES, TRANSLATIONS } from "@/lib/i18n";
import {
  countActiveMedicationsByDay,
  formatTime12h,
  formatTimeCompact12h,
  formatTimeDigits,
  formatTimeForInput,
  getDueScheduledKey,
  getMedicationsForDay,
  getMedicationTimes,
  isTakenToday,
  isValidPhoneNumber,
  normalizePhoneForSms,
  normalizeReminderTimes,
  sanitizeTimeDigits,
  suggestNextReminderTime,
  typedTimeTo24,
} from "@/lib/dosebridge-utils";
import {
  filterLocalMedications,
  LOCAL_MEDICATIONS,
  mergeMedicationSuggestions,
  parseRxTermsResponse,
} from "@/lib/medication-search";

describe("DoseBridge i18n and SMS rules", () => {
  it("supports the top 10 U.S. languages plus Haitian Creole with 7 day names", () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual([
      "en",
      "es",
      "zh",
      "tl",
      "vi",
      "ar",
      "fr",
      "ko",
      "ru",
      "hi",
      "ht",
    ]);
    for (const lang of LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      expect(dict.daysShort).toHaveLength(7);
      expect(dict.addReminderBtn.length).toBeGreaterThan(0);
      expect(dict.autoSendNote.length).toBeGreaterThan(0);
    }
  });

  it("marks only Arabic as right-to-left", () => {
    expect(isRtlLanguage("ar")).toBe(true);
    for (const lang of LANGUAGES) {
      if (lang.code === "ar") continue;
      expect(isRtlLanguage(lang.code)).toBe(false);
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
    expect(formatTimeCompact12h("08:00")).toBe("8:00 AM");
    expect(formatTimeCompact12h("21:30")).toBe("9:30 PM");
  });

  it("normalizes phone numbers to E.164 for SMS delivery", () => {
    expect(normalizePhoneForSms("+1 (555) 234-5678")).toBe("+15552345678");
    expect(normalizePhoneForSms("(555) 234-5678")).toBe("+15552345678");
    expect(normalizePhoneForSms("5552345678")).toBe("+15552345678");
    expect(normalizePhoneForSms("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhoneForSms("")).toBe("");
  });

  it("filters medications by day sorted chronologically and counts only active medications per day", () => {
    const meds = [
      { name: "Evening", is_active: true, days_of_week: [1, 3], reminder_time: "21:00" },
      { name: "Morning", is_active: true, days_of_week: [1], reminder_time: "08:00" },
      { name: "Paused", is_active: false, days_of_week: [1], reminder_time: "12:00" },
    ];
    const monday = getMedicationsForDay(meds, 1);
    expect(monday.map((m) => m.name)).toEqual(["Morning", "Paused", "Evening"]);
    expect(getMedicationsForDay(meds, 2)).toEqual([]);

    const counts = countActiveMedicationsByDay(meds);
    expect(counts).toEqual([0, 2, 0, 1, 0, 0, 0]);

    const now = new Date("2026-11-21T15:00:00Z");
    expect(isTakenToday("2026-11-21T13:30:00Z", "America/New_York", now)).toBe(true);
    expect(isTakenToday("2026-11-20T13:30:00Z", "America/New_York", now)).toBe(false);
  });

  it("provides 60 local fallback medications and parses/merges NIH RxTerms responses", () => {
    expect(LOCAL_MEDICATIONS.length).toBeGreaterThanOrEqual(60);
    const local = filterLocalMedications("metf");
    expect(local[0]?.name).toBe("Metformin");

    const parsed = parseRxTermsResponse([
      2,
      ["metFORMIN (Oral Pill)", "metFORMIN XR (Oral Pill)"],
      {
        DISPLAY_NAME: ["metFORMIN (Oral Pill)", "metFORMIN XR (Oral Pill)"],
        STRENGTHS_AND_FORMS: [["  500 mg Tab", "  850 mg Tab"], ["  500 mg XR Tab"]],
      },
    ]);
    expect(parsed[0]).toEqual({
      name: "Metformin",
      form: "Oral Pill",
      strengths: ["500 mg Tab", "850 mg Tab"],
      source: "rxterms",
    });
    expect(parsed[1]?.name).toBe("Metformin XR");

    const merged = mergeMedicationSuggestions(local, parsed, 8);
    expect(merged.filter((m) => m.name === "Metformin")).toHaveLength(1);
  });
});

describe("Typed time input", () => {
  it("keeps only typed digits and shows a colon as the person types", () => {
    expect(sanitizeTimeDigits("8:30 AM")).toBe("830");
    expect(sanitizeTimeDigits("abc")).toBe("");
    expect(formatTimeDigits("")).toBe("");
    expect(formatTimeDigits("8")).toBe("8");
    expect(formatTimeDigits("83")).toBe("8:3");
    expect(formatTimeDigits("830")).toBe("8:30");
    expect(formatTimeDigits("1230")).toBe("12:30");
  });

  it("turns typed digits plus AM/PM into the stored 24-hour string", () => {
    expect(typedTimeTo24("8", "AM")).toBe("08:00");
    expect(typedTimeTo24("830", "PM")).toBe("20:30");
    expect(typedTimeTo24("1230", "PM")).toBe("12:30");
    expect(typedTimeTo24("12", "AM")).toBe("00:00");
    expect(typedTimeTo24("1215", "PM")).toBe("12:15");
    expect(typedTimeTo24("83", "AM")).toBe("08:03");
  });

  it("rejects incomplete or impossible times instead of saving them", () => {
    expect(typedTimeTo24("", "AM")).toBeNull();
    expect(typedTimeTo24("0", "AM")).toBeNull();
    expect(typedTimeTo24("1330", "PM")).toBeNull();
    expect(typedTimeTo24("875", "AM")).toBeNull();
  });

  it("shows the stored time in the input without AM/PM", () => {
    expect(formatTimeForInput("08:00")).toBe("8:00");
    expect(formatTimeForInput("21:30")).toBe("9:30");
    expect(formatTimeForInput("00:05")).toBe("12:05");
  });

  it("gives every language a time-entry hint", () => {
    for (const lang of LANGUAGES) {
      expect(TRANSLATIONS[lang.code].timeInputHint.length).toBeGreaterThan(0);
      expect(TRANSLATIONS[lang.code].addAnotherTimeBtn.length).toBeGreaterThan(0);
      expect(TRANSLATIONS[lang.code].removeTimeLabel.length).toBeGreaterThan(0);
    }
  });

  it("normalizes, suggests, and triggers multiple reminder times per medication", () => {
    expect(normalizeReminderTimes(["20:00", "08:00", "12:00", "08:00", "bad"])).toEqual([
      "08:00",
      "12:00",
      "20:00",
    ]);
    expect(suggestNextReminderTime(["08:00"])).toBe("12:00");
    expect(suggestNextReminderTime(["08:00", "12:00"])).toBe("16:00");
    expect(
      getMedicationTimes({
        reminder_time: "08:00",
        reminder_times: ["16:00", "08:00", "12:00"],
      }),
    ).toEqual(["08:00", "12:00", "16:00"]);

    const med = {
      is_active: true,
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      reminder_time: "08:00",
      reminder_times: ["08:00", "12:00", "16:00", "20:00"],
      last_sent_at: "2026-11-21T13:00:10Z", // 08:00 AM EST already sent
    };
    // 17:00Z = 12:00 PM EST — should trigger the 12:00 reminder even though 08:00 was sent.
    expect(
      getDueScheduledKey(med, "America/New_York", new Date("2026-11-21T17:00:00Z"), 1),
    ).toBe("2026-11-21 12:00");
    // 1 minute before (11:59 AM EST) and 1 minute after (12:01 PM EST) must NOT trigger.
    expect(
      getDueScheduledKey(med, "America/New_York", new Date("2026-11-21T16:59:59Z"), 1),
    ).toBeNull();
    expect(
      getDueScheduledKey(med, "America/New_York", new Date("2026-11-21T17:01:00Z"), 1),
    ).toBeNull();
  });

  it("normalizes differently formatted U.S. phone numbers to one canonical profile key", () => {
    const formats = [
      "4849193599",
      "484-919-3599",
      "(484) 919-3599",
      "14849193599",
      "+1 (484) 919-3599",
    ];
    for (const raw of formats) {
      expect(normalizePhoneForSms(raw)).toBe("+14849193599");
    }
  });
});