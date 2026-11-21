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