export interface MedicationSuggestion {
  name: string;
  form?: string;
  strengths: string[];
  source: "local" | "rxterms";
}

const RAW_LOCAL_MEDS: readonly [string, readonly string[]][] = [
  ["Metformin", ["500 mg Tab", "850 mg Tab", "1,000 mg Tab"]],
  ["Lisinopril", ["5 mg Tab", "10 mg Tab", "20 mg Tab", "40 mg Tab"]],
  ["Atorvastatin", ["10 mg Tab", "20 mg Tab", "40 mg Tab", "80 mg Tab"]],
  ["Amoxicillin", ["250 mg Cap", "500 mg Cap", "875 mg Tab"]],
  ["Levothyroxine", ["25 mcg Tab", "50 mcg Tab", "75 mcg Tab", "100 mcg Tab"]],
  ["Amlodipine", ["2.5 mg Tab", "5 mg Tab", "10 mg Tab"]],
  ["Omeprazole", ["20 mg Cap", "40 mg Cap"]],
  ["Losartan", ["25 mg Tab", "50 mg Tab", "100 mg Tab"]],
  ["Gabapentin", ["100 mg Cap", "300 mg Cap", "600 mg Tab"]],
  ["Albuterol", ["90 mcg Inhaler", "2 mg Tab"]],
  ["Hydrochlorothiazide", ["12.5 mg Cap", "25 mg Tab", "50 mg Tab"]],
  ["Sertraline", ["25 mg Tab", "50 mg Tab", "100 mg Tab"]],
  ["Simvastatin", ["10 mg Tab", "20 mg Tab", "40 mg Tab"]],
  ["Montelukast", ["10 mg Tab", "5 mg Chewable"]],
  ["Escitalopram", ["5 mg Tab", "10 mg Tab", "20 mg Tab"]],
  ["Rosuvastatin", ["5 mg Tab", "10 mg Tab", "20 mg Tab", "40 mg Tab"]],
  ["Bupropion", ["150 mg XL Tab", "300 mg XL Tab"]],
  ["Furosemide", ["20 mg Tab", "40 mg Tab", "80 mg Tab"]],
  ["Pantoprazole", ["20 mg Tab", "40 mg Tab"]],
  ["Trazodone", ["50 mg Tab", "100 mg Tab"]],
  ["Fluticasone", ["50 mcg Nasal Spray"]],
  ["Tamsulosin", ["0.4 mg Cap"]],
  ["Meloxicam", ["7.5 mg Tab", "15 mg Tab"]],
  ["Apixaban", ["2.5 mg Tab", "5 mg Tab"]],
  ["Clopidogrel", ["75 mg Tab"]],
  ["Prednisone", ["5 mg Tab", "10 mg Tab", "20 mg Tab"]],
  ["Citalopram", ["10 mg Tab", "20 mg Tab", "40 mg Tab"]],
  ["Duloxetine", ["20 mg Cap", "30 mg Cap", "60 mg Cap"]],
  ["Carvedilol", ["3.125 mg Tab", "6.25 mg Tab", "12.5 mg Tab", "25 mg Tab"]],
  ["Metoprolol", ["25 mg Tab", "50 mg Tab", "100 mg Tab"]],
  ["Pravastatin", ["10 mg Tab", "20 mg Tab", "40 mg Tab"]],
  ["Potassium Chloride", ["10 mEq Tab", "20 mEq Tab"]],
  ["Venlafaxine", ["37.5 mg Cap", "75 mg Cap", "150 mg Cap"]],
  ["Tramadol", ["50 mg Tab"]],
  ["Warfarin", ["1 mg Tab", "2 mg Tab", "5 mg Tab"]],
  ["Insulin Glargine", ["100 units/mL Pen"]],
  ["Spironolactone", ["25 mg Tab", "50 mg Tab", "100 mg Tab"]],
  ["Allopurinol", ["100 mg Tab", "300 mg Tab"]],
  ["Finasteride", ["1 mg Tab", "5 mg Tab"]],
  ["Famotidine", ["20 mg Tab", "40 mg Tab"]],
  ["Azithromycin", ["250 mg Tab", "500 mg Tab"]],
  ["Ciprofloxacin", ["250 mg Tab", "500 mg Tab"]],
  ["Cephalexin", ["250 mg Cap", "500 mg Cap"]],
  ["Doxycycline", ["50 mg Cap", "100 mg Cap"]],
  ["Cyclobenzaprine", ["5 mg Tab", "10 mg Tab"]],
  ["Alprazolam", ["0.25 mg Tab", "0.5 mg Tab", "1 mg Tab"]],
  ["Lorazepam", ["0.5 mg Tab", "1 mg Tab"]],
  ["Zolpidem", ["5 mg Tab", "10 mg Tab"]],
  ["Hydroxyzine", ["25 mg Tab", "50 mg Tab"]],
  ["Cetirizine", ["10 mg Tab"]],
  ["Loratadine", ["10 mg Tab"]],
  ["Diphenhydramine", ["25 mg Cap", "50 mg Cap"]],
  ["Ibuprofen", ["200 mg Tab", "400 mg Tab", "600 mg Tab"]],
  ["Acetaminophen", ["325 mg Tab", "500 mg Tab"]],
  ["Naproxen", ["220 mg Tab", "500 mg Tab"]],
  ["Aspirin", ["81 mg Tab", "325 mg Tab"]],
  ["Vitamin D3", ["1,000 IU Softgel", "2,000 IU Softgel", "5,000 IU Softgel"]],
  ["Vitamin B12", ["500 mcg Tab", "1,000 mcg Tab"]],
  ["Calcium Carbonate", ["500 mg Tab", "600 mg Tab"]],
  ["Fish Oil", ["1,000 mg Softgel", "1,200 mg Softgel"]],
];

export const LOCAL_MEDICATIONS: readonly MedicationSuggestion[] = RAW_LOCAL_MEDS.map(
  ([name, strengths]) => ({
    name,
    strengths: [...strengths],
    source: "local",
  }),
);

export function filterLocalMedications(query: string, limit = 8): MedicationSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const prefix: MedicationSuggestion[] = [];
  const contains: MedicationSuggestion[] = [];
  for (const item of LOCAL_MEDICATIONS) {
    const lower = item.name.toLowerCase();
    if (lower.startsWith(q)) {
      prefix.push(item);
    } else if (lower.includes(q)) {
      contains.push(item);
    }
  }
  return [...prefix, ...contains].slice(0, limit);
}

function normalizeDrugTitle(raw: string): string {
  return raw
    .split(/(\s+|\/|-)/)
    .map((part) => {
      if (!part || /^(\s+|\/|-)$/.test(part)) return part;
      if (/^(XR|ER|SR|DR|CR|HCT|HCTZ|IV|IM|OTC|D3|B12)$/i.test(part)) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

export function parseRxTermsResponse(raw: unknown): MedicationSuggestion[] {
  if (!Array.isArray(raw) || raw.length < 3) return [];
  const extra = raw[2] as {
    DISPLAY_NAME?: unknown;
    STRENGTHS_AND_FORMS?: unknown;
  } | null;
  const names = Array.isArray(extra?.DISPLAY_NAME)
    ? extra.DISPLAY_NAME
    : Array.isArray(raw[1])
      ? raw[1]
      : [];
  const strengthsList = Array.isArray(extra?.STRENGTHS_AND_FORMS)
    ? extra.STRENGTHS_AND_FORMS
    : [];

  const results: MedicationSuggestion[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < names.length; i++) {
    const entry = names[i];
    if (typeof entry !== "string" || !entry.trim()) continue;
    const match = /^(.+?)\s*\(([^)]+)\)\s*$/.exec(entry.trim());
    const baseName = normalizeDrugTitle(match?.[1]?.trim() ?? entry.trim());
    const form = match?.[2]?.trim();
    const key = `${baseName.toLowerCase()}|${(form ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const rawStrengths = strengthsList[i];
    const strengths = Array.isArray(rawStrengths)
      ? rawStrengths
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim())
          .slice(0, 6)
      : [];

    results.push({
      name: baseName,
      ...(form ? { form } : {}),
      strengths,
      source: "rxterms",
    });
  }
  return results;
}

export function mergeMedicationSuggestions(
  local: readonly MedicationSuggestion[],
  remote: readonly MedicationSuggestion[],
  limit = 8,
): MedicationSuggestion[] {
  const merged: MedicationSuggestion[] = [];
  const seenNames = new Set<string>();

  for (const item of remote) {
    const key = `${item.name.toLowerCase()}|${(item.form ?? "").toLowerCase()}`;
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    merged.push(item);
  }

  for (const item of local) {
    const hasExactName = merged.some(
      (m) => m.name.toLowerCase() === item.name.toLowerCase(),
    );
    if (hasExactName) continue;
    merged.push(item);
  }

  return merged.slice(0, limit);
}

export async function searchRxTerms(
  query: string,
  signal?: AbortSignal,
): Promise<MedicationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url = `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(
    trimmed,
  )}&maxList=8&ef=DISPLAY_NAME,STRENGTHS_AND_FORMS`;
  const res = await fetch(url, { ...(signal ? { signal } : {}) });
  if (!res.ok) return [];
  const data: unknown = await res.json();
  return parseRxTermsResponse(data);
}