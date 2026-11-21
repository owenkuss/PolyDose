import { ListFilter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TranslationDict } from "@/lib/i18n";

export type StatusFilter = "all" | "active" | "paused";

interface FilterPopoverProps {
  t: TranslationDict;
  selectedDay: number | null;
  todayIdx: number;
  activeCounts: readonly number[];
  statusFilter: StatusFilter;
  onSelectDay: (day: number | null) => void;
  onSelectStatus: (status: StatusFilter) => void;
  onReset: () => void;
}

export function FilterPopover({
  t,
  selectedDay,
  todayIdx,
  activeCounts,
  statusFilter,
  onSelectDay,
  onSelectStatus,
  onReset,
}: FilterPopoverProps) {
  const activeFilterCount = (selectedDay !== null ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-xl border-border bg-card px-4 text-base font-bold text-foreground shadow-xs hover:border-primary hover:bg-accent"
        >
          <span>{t.filterBtn}</span>
          <ListFilter className="h-4 w-4 text-primary" aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 rounded-xl border-border bg-popover p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{t.daysLabel}</span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              {t.filterReset}
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => onSelectDay(null)}
            aria-pressed={selectedDay === null}
            className={`col-span-4 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
              selectedDay === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-accent"
            }`}
          >
            {t.filterAllDays}
          </button>
          {t.daysShort.map((label, dayIdx) => {
            const active = selectedDay === dayIdx;
            const isToday = dayIdx === todayIdx;
            const count = activeCounts[dayIdx] ?? 0;
            return (
              <button
                key={dayIdx}
                type="button"
                onClick={() => onSelectDay(dayIdx)}
                aria-pressed={active}
                className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {isToday && (
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? "bg-primary-foreground" : "bg-primary"
                    }`}
                  />
                )}
                <span>{label}</span>
                <span className={active ? "opacity-85" : "text-muted-foreground"}>({count})</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <span className="text-sm font-bold text-foreground">{t.filterStatusLabel}</span>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: "all", label: t.filterStatusAll },
                { id: "active", label: t.activeBadge },
                { id: "paused", label: t.pausedBadge },
              ] as const
            ).map((opt) => {
              const active = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectStatus(opt.id)}
                  aria-pressed={active}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}