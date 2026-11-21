export const DEFAULT_DEMO_PHONE = "+1 (555) 234-5678";

export const COMMON_MEDICATIONS = [
  { name: "Metformin", dosage: "500mg — 1 tablet", instructions: "Take with food" },
  { name: "Lisinopril", dosage: "10mg — 1 tablet", instructions: "Take in the morning" },
  { name: "Atorvastatin", dosage: "20mg — 1 tablet", instructions: "Take before bed" },
  { name: "Amoxicillin", dosage: "500mg — 1 capsule", instructions: "Take with water" },
] as const;

export const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Mexico_City",
  "America/Port-au-Prince",
  "Europe/London",
  "Europe/Paris",
  "Asia/Ho_Chi_Minh",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "UTC",
] as const;

export function detectBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

export function isValidPhoneNumber(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function formatTime12h(time24: string): string {
  const parts = time24.split(":");
  const hourNum = Number(parts[0] ?? 8);
  const minNum = Number(parts[1] ?? 0);
  if (Number.isNaN(hourNum) || Number.isNaN(minNum)) return time24;
  const period = hourNum >= 12 ? "PM" : "AM";
  const h12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${String(h12).padStart(2, "0")}:${String(minNum).padStart(2, "0")} ${period}`;
}

export function formatClockTime(date: Date, timezone?: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
}

export function isTakenToday(
  lastConfirmedAt: string | null | undefined,
  timezone?: string,
  now: Date = new Date(),
): boolean {
  if (!lastConfirmedAt) return false;
  const confirmed = new Date(lastConfirmedAt);
  if (Number.isNaN(confirmed.getTime())) return false;
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(timezone ? { timeZone: timezone } : {}),
    });
    return fmt.format(confirmed) === fmt.format(now);
  } catch {
    return confirmed.toDateString() === now.toDateString();
  }
}