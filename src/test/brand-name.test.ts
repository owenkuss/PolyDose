import { describe, expect, it } from "vitest";
import { enforceAppBrand } from "@/lib/gemini.server";
import { LANGUAGES, TRANSLATIONS } from "@/lib/i18n";

describe("PolyDose brand name", () => {
  it("rewrites the old app name in generated reminder text", () => {
    expect(enforceAppBrand("DoseBridge: Time for Metformin (500 mg).")).toBe(
      "PolyDose: Time for Metformin (500 mg).",
    );
  });

  it("rewrites spaced, hyphenated, lowercase and previous-name variants", () => {
    expect(enforceAppBrand("dose bridge reminder from dose-bridge or PillPing")).toBe(
      "PolyDose reminder from PolyDose or PolyDose",
    );
  });

  it("leaves correctly named text untouched", () => {
    expect(enforceAppBrand("PolyDose: Time for Lisinopril (10 mg).")).toBe(
      "PolyDose: Time for Lisinopril (10 mg).",
    );
  });

  it("names every language's SMS prefix and header PolyDose", () => {
    expect(LANGUAGES.length).toBeGreaterThan(0);
    for (const lang of LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      expect(dict.smsPrefix).toContain("PolyDose");
      expect(dict.smsHeaderSub).toContain("PolyDose");
      expect(dict.smsPrefix.toLowerCase()).not.toContain("dosebridge");
    }
  });
});
