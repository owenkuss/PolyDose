import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import {
  formatTimeDigits,
  formatTimeForInput,
  sanitizeTimeDigits,
  typedTimeTo24,
} from "@/lib/dosebridge-utils";
import type { TranslationDict } from "@/lib/i18n";

interface TimePickerPopoverProps {
  id?: string;
  value: string; // "HH:MM" 24-hour
  onChange: (time24: string) => void;
  t: TranslationDict;
}

function periodOf(time24: string): "AM" | "PM" {
  return Number(time24.split(":")[0]) >= 12 ? "PM" : "AM";
}

/**
 * Time field the person fills in by hand: type the time, then tap AM or PM.
 * The value stays the stored 24-hour "HH:MM" string.
 */
export function TimePickerPopover({ id, value, onChange, t }: TimePickerPopoverProps) {
  const [digits, setDigits] = useState(() => sanitizeTimeDigits(formatTimeForInput(value)));
  const [period, setPeriod] = useState<"AM" | "PM">(() => periodOf(value));
  const editingRef = useRef(false);

  // Follow external changes (form reset, preset pick) unless the person is typing.
  useEffect(() => {
    if (editingRef.current) return;
    setDigits(sanitizeTimeDigits(formatTimeForInput(value)));
    setPeriod(periodOf(value));
  }, [value]);

  function commit(nextDigits: string, nextPeriod: "AM" | "PM") {
    const parsed = typedTimeTo24(nextDigits, nextPeriod);
    if (parsed) onChange(parsed);
  }

  function handleTextChange(raw: string) {
    const next = sanitizeTimeDigits(raw);
    setDigits(next);
    commit(next, period);
  }

  function handlePeriodChange(next: "AM" | "PM") {
    setPeriod(next);
    commit(digits, next);
  }

  function handleBlur() {
    editingRef.current = false;
    // Put the field back to the time that is actually saved.
    setDigits(sanitizeTimeDigits(formatTimeForInput(value)));
    setPeriod(periodOf(value));
  }

  const hintId = id ? `${id}-hint` : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="8:00"
            aria-describedby={hintId}
            value={formatTimeDigits(digits)}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => {
              editingRef.current = true;
            }}
            onBlur={handleBlur}
            className="h-11 w-full rounded-md border border-input bg-background px-3 pr-9 text-base font-bold text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Clock
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <div
          role="group"
          aria-label={t.timeLabel}
          className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-background p-1"
        >
          {(["AM", "PM"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={period === option}
              onClick={() => handlePeriodChange(option)}
              className={`min-h-9 min-w-12 rounded-md px-2 text-sm font-bold transition-colors ${
                period === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-accent"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {hintId && (
        <p id={hintId} className="text-xs font-medium text-muted-foreground">
          {t.timeInputHint}
        </p>
      )}
    </div>
  );
}
