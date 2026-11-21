import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { formatTimeCompact12h } from "@/lib/dosebridge-utils";
import type { TranslationDict } from "@/lib/i18n";

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

interface TimeParts {
  hour12: number;
  minute: number;
  period: "AM" | "PM";
}

function parseTime24(time24: string): TimeParts {
  const [hStr, mStr] = time24.split(":");
  let hour = Number(hStr);
  let minute = Number(mStr);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) hour = 8;
  if (Number.isNaN(minute) || minute < 0 || minute > 59) minute = 0;
  // Snap to the nearest 5-minute interval so the picker always shows a valid value.
  minute = Math.round(minute / 5) * 5;
  if (minute === 60) {
    minute = 0;
    hour = (hour + 1) % 24;
  }
  const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return { hour12, minute, period };
}

function toTime24(parts: TimeParts): string {
  let hour = parts.hour12 % 12;
  if (parts.period === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

interface TimePickerPopoverProps {
  id?: string;
  value: string; // "HH:MM" 24-hour
  onChange: (time24: string) => void;
  t: TranslationDict;
}

export function TimePickerPopover({ id, value, onChange, t }: TimePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<TimeParts>(() => parseTime24(value));
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the popover in sync if the value changes externally (e.g. form reset).
  useEffect(() => {
    if (!open) setParts(parseTime24(value));
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function apply(next: TimeParts, close = false) {
    setParts(next);
    onChange(toTime24(next));
    if (close) setOpen(false);
  }

  const presets: { label: string; time: string }[] = [
    { label: t.timePresetMorning, time: "08:00" },
    { label: t.timePresetNoon, time: "12:00" },
    { label: t.timePresetEvening, time: "18:00" },
    { label: t.timePresetBedtime, time: "21:00" },
  ];

  return (
    <div ref={rootRef} className="relative sm:w-44">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-base font-medium text-foreground shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>{formatTimeCompact12h(value)}</span>
        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t.timeLabel}
          className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-border bg-popover p-3 shadow-lg"
        >
          {/* Quick-select routine presets */}
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.time}
                type="button"
                onClick={() => apply(parseTime24(preset.time), true)}
                className={`min-h-9 rounded-lg border px-2 text-sm font-bold transition-colors ${
                  value === preset.time
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary hover:bg-accent"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="my-3 border-t border-border" />

          {/* Hour / Minute / AM-PM selectors */}
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t.timeHourLabel}
              </p>
              <div className="grid max-h-36 grid-cols-3 gap-1 overflow-y-auto pr-0.5">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => apply({ ...parts, hour12: h })}
                    aria-pressed={parts.hour12 === h}
                    className={`min-h-8 rounded-md text-sm font-bold transition-colors ${
                      parts.hour12 === h
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <p className="mb-1 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t.timeMinuteLabel}
              </p>
              <div className="grid max-h-36 grid-cols-3 gap-1 overflow-y-auto pr-0.5">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => apply({ ...parts, minute: m })}
                    aria-pressed={parts.minute === m}
                    className={`min-h-8 rounded-md text-sm font-bold transition-colors ${
                      parts.minute === m
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex w-14 flex-col gap-1.5 pt-5">
              {(["AM", "PM"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => apply({ ...parts, period })}
                  aria-pressed={parts.period === period}
                  className={`min-h-11 rounded-md border text-sm font-bold transition-colors ${
                    parts.period === period
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 h-10 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.timeDone}
          </button>
        </div>
      )}
    </div>
  );
}
