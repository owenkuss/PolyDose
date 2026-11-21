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

export function formatTimeCompact12h(time24: string): string {
  const parts = time24.split(":");
  const hourNum = Number(parts[0] ?? 8);
  const minNum = Number(parts[1] ?? 0);
  if (Number.isNaN(hourNum) || Number.isNaN(minNum)) return time24;
  const period = hourNum >= 12 ? "PM" : "AM";
  const h12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${h12}:${String(minNum).padStart(2, "0")} ${period}`;
}

// --- Typed time input helpers ---------------------------------------------
// The time field is a plain text box: the user types digits and picks AM/PM.

/** Keep only the digits the user typed, capped at 4 ("1230"). */
export function sanitizeTimeDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

/**
 * Show typed digits the way a person expects while typing:
 * "8" -> "8", "83" -> "8:3", "830" -> "8:30", "1230" -> "12:30".
 */
export function formatTimeDigits(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length <= 2) {
    // Two digits that can't be an hour (e.g. "83") are hour + first minute digit.
    return Number(digits) > 12 ? `${digits[0]}:${digits[1]}` : digits;
  }
  return `${digits.slice(0, digits.length - 2)}:${digits.slice(-2)}`;
}

/**
 * Turn typed digits plus the chosen AM/PM into the stored "HH:MM" 24-hour
 * string, or null when the text isn't a complete, valid time yet.
 */
export function typedTimeTo24(
  digits: string,
  period: "AM" | "PM",
): string | null {
  const d = sanitizeTimeDigits(digits);
  if (!d) return null;
  let hour: number;
  let minute: number;
  if (d.length <= 2 && Number(d) <= 12) {
    hour = Number(d);
    minute = 0;
  } else if (d.length <= 2) {
    hour = Number(d[0]);
    minute = Number(d[1]);
  } else {
    hour = Number(d.slice(0, d.length - 2));
    minute = Number(d.slice(-2));
  }
  if (hour < 1 || hour > 12 || minute > 59) return null;
  let hour24 = hour % 12;
  if (period === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** The stored "HH:MM" 24-hour string as text for the input, e.g. "08:00" -> "8:00". */
export function formatTimeForInput(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const hour = Number(hStr);
  const minute = Number(mStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, "0")}`;
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

export function getMedicationsForDay<
  T extends { days_of_week: number[]; reminder_time: string },
>(medications: readonly T[], dayIndex: number): T[] {
  return medications
    .filter((med) => med.days_of_week.includes(dayIndex))
    .sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));
}

export function countActiveMedicationsByDay(
  medications: readonly { is_active: boolean; days_of_week: number[] }[],
): [number, number, number, number, number, number, number] {
  const counts: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];
  for (const med of medications) {
    if (!med.is_active) continue;
    for (const day of med.days_of_week) {
      if (day >= 0 && day <= 6) {
        counts[day] = (counts[day] ?? 0) + 1;
      }
    }
  }
  return counts;
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

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface LocalDateParts {
  dateKey: string;
  weekday: number;
  hour: number;
  minute: number;
  minutesOfDay: number;
}

export function getLocalDateParts(date: Date, timezone: string): LocalDateParts {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = fmt.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const year = get("year");
    const month = get("month");
    const day = get("day");
    const weekday = WEEKDAY_MAP[get("weekday")] ?? date.getDay();
    const hour = Number(get("hour")) % 24;
    const minute = Number(get("minute"));
    return {
      dateKey: `${year}-${month}-${day}`,
      weekday,
      hour,
      minute,
      minutesOfDay: hour * 60 + minute,
    };
  } catch {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return {
      dateKey: `${y}-${m}-${d}`,
      weekday: date.getDay(),
      hour,
      minute,
      minutesOfDay: hour * 60 + minute,
    };
  }
}

export function getDueScheduledKey(
  med: {
    is_active: boolean;
    days_of_week: number[];
    reminder_time: string;
    last_sent_at?: string | null;
  },
  timezone: string,
  now: Date = new Date(),
  windowMinutes = 1,
): string | null {
  if (!med.is_active || med.days_of_week.length === 0) return null;
  const [hStr, mStr] = med.reminder_time.split(":");
  const schedHour = Number(hStr);
  const schedMin = Number(mStr);
  if (Number.isNaN(schedHour) || Number.isNaN(schedMin)) return null;

  const localNow = getLocalDateParts(now, timezone);
  if (!med.days_of_week.includes(localNow.weekday)) return null;

  const schedMins = schedHour * 60 + schedMin;
  if (localNow.minutesOfDay < schedMins || localNow.minutesOfDay >= schedMins + windowMinutes) {
    return null;
  }

  if (med.last_sent_at) {
    const sentDate = new Date(med.last_sent_at);
    if (!Number.isNaN(sentDate.getTime())) {
      const localSent = getLocalDateParts(sentDate, timezone);
      if (localSent.dateKey === localNow.dateKey && localSent.minutesOfDay >= schedMins) {
        return null;
      }
    }
  }

  return `${localNow.dateKey} ${med.reminder_time}`;
}