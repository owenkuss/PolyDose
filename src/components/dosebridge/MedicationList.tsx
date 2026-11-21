import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MedicationRow } from "@/lib/dosebridge-api";
import {
  countActiveMedicationsByDay,
  formatTimeCompact12h,
  getLocalDateParts,
  getMedicationsForDay,
  isTakenToday,
} from "@/lib/dosebridge-utils";
import type { TranslationDict } from "@/lib/i18n";

interface MedicationListProps {
  t: TranslationDict;
  medications: MedicationRow[];
  timezone: string;
  selectedMedId: string | null;
  onSelect: (med: MedicationRow) => void;
  onToggleActive: (med: MedicationRow, nextActive: boolean) => void;
  onDelete: (med: MedicationRow) => void;
  onSendTest: (med: MedicationRow) => void;
}

export function MedicationList({
  t,
  medications,
  timezone,
  selectedMedId,
  onSelect,
  onToggleActive,
  onDelete,
  onSendTest,
}: MedicationListProps) {
  const [todayIdx, setTodayIdx] = useState<number>(0);
  const [activeDay, setActiveDay] = useState<number>(0);
  const hasPickedDay = useRef(false);

  useEffect(() => {
    const wd = getLocalDateParts(new Date(), timezone).weekday;
    setTodayIdx(wd);
    if (!hasPickedDay.current) {
      setActiveDay(wd);
    }
  }, [timezone]);

  const activeCounts = useMemo(
    () => countActiveMedicationsByDay(medications),
    [medications],
  );
  const dayMeds = useMemo(
    () => getMedicationsForDay(medications, activeDay),
    [medications, activeDay],
  );

  return (
    <section aria-labelledby="schedule-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="schedule-heading"
          className="font-display text-2xl font-bold tracking-tight text-foreground"
        >
          {t.scheduleTitle}
        </h2>
        <Badge variant="secondary" className="px-3 py-1 text-sm font-bold">
          {medications.length}
        </Badge>
      </div>

      <div
        role="tablist"
        aria-label={t.daysLabel}
        className="grid grid-cols-7 gap-1 rounded-xl border border-border bg-muted/60 p-1"
      >
        {t.daysShort.map((label, dayIdx) => {
          const isSelectedDay = dayIdx === activeDay;
          const isToday = dayIdx === todayIdx;
          const count = activeCounts[dayIdx] ?? 0;
          return (
            <button
              key={dayIdx}
              type="button"
              role="tab"
              aria-selected={isSelectedDay}
              aria-label={`${label}${isToday ? ` (${t.todayLabel})` : ""}: ${count}`}
              onClick={() => {
                hasPickedDay.current = true;
                setActiveDay(dayIdx);
              }}
              className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-xs font-bold transition-colors sm:flex-row sm:gap-1.5 sm:text-sm ${
                isSelectedDay
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground hover:bg-background/80"
              }`}
            >
              <span className="flex items-center gap-1">
                {isToday && (
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelectedDay ? "bg-primary-foreground" : "bg-primary"
                    }`}
                  />
                )}
                {label}
              </span>
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums ${
                  isSelectedDay
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground ring-1 ring-border"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {dayMeds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          {t.dayEmptyState}
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="space-y-1.5" role="tabpanel">
            {dayMeds.map((med) => {
              const takenToday = isTakenToday(med.last_confirmed_at, timezone);
              const isSelected = med.id === selectedMedId;
              return (
                <div
                  key={med.id}
                  onClick={() => onSelect(med)}
                  className={`flex min-h-14 cursor-pointer flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors sm:flex-nowrap ${
                    isSelected
                      ? "border-primary bg-card ring-1 ring-primary/25"
                      : "border-border bg-card hover:border-primary/50"
                  } ${!med.is_active ? "opacity-65" : ""}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="shrink-0 rounded-md bg-background px-2.5 py-1 text-xs font-bold text-foreground tabular-nums ring-1 ring-border">
                      {formatTimeCompact12h(med.reminder_time)}
                    </span>
                    <div className="flex min-w-0 flex-1 items-baseline gap-2">
                      <h3 className="shrink-0 text-sm font-bold text-foreground">{med.name}</h3>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {med.dosage}
                      </span>
                      {med.instructions && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="hidden min-w-0 truncate text-xs text-muted-foreground md:inline">
                              · {med.instructions}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            {med.instructions}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {takenToday && (
                      <Badge className="gap-1 border border-success/30 bg-success-muted px-2 py-0.5 text-xs font-bold text-success hover:bg-success-muted">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.takenShortBadge}
                      </Badge>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onSendTest(med)}
                      className="h-8 gap-1 px-2.5 text-xs font-bold"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      {t.testShortBtn}
                    </Button>
                    <Switch
                      checked={med.is_active}
                      onCheckedChange={(checked) => onToggleActive(med, checked)}
                      aria-label={`${med.name} ${med.is_active ? t.activeBadge : t.pausedBadge}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(med)}
                      aria-label={`${t.deleteBtn} ${med.name}`}
                      title={t.deleteBtn}
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </section>
  );
}