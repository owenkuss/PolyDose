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
import { formatTimeCompact12h, isTakenToday } from "@/lib/dosebridge-utils";
import type { TranslationDict } from "@/lib/i18n";

interface MedicationListProps {
  t: TranslationDict;
  medications: MedicationRow[];
  timezone: string;
  isFiltered: boolean;
  onToggleActive: (med: MedicationRow, nextActive: boolean) => void;
  onDelete: (med: MedicationRow) => void;
  onSendTest: (med: MedicationRow) => void;
}

export function MedicationList({
  t,
  medications,
  timezone,
  isFiltered,
  onToggleActive,
  onDelete,
  onSendTest,
}: MedicationListProps) {
  return (
    <section
      aria-label={t.scheduleTitle}
      className="min-h-[420px] rounded-2xl border-2 border-foreground/80 bg-background p-3 shadow-xs sm:p-4"
    >
      {medications.length === 0 ? (
        <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 text-center text-sm font-medium text-muted-foreground">
          {isFiltered ? t.dayEmptyState : t.scheduleEmpty}
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="space-y-2">
            {medications.map((med) => {
              const takenToday = isTakenToday(med.last_confirmed_at, timezone);
              return (
                <div
                  key={med.id}
                  className={`flex min-h-14 flex-col gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 transition-colors hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between ${
                    !med.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="shrink-0 rounded-md bg-background px-2.5 py-1 text-xs font-bold text-foreground tabular-nums ring-1 ring-border">
                      {formatTimeCompact12h(med.reminder_time)}
                    </span>
                    <div className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden">
                      <h3 className="truncate text-sm font-bold text-foreground">{med.name}</h3>
                      <span className="shrink-0 truncate text-xs font-medium text-muted-foreground">
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

                  <div className="flex shrink-0 items-center justify-end gap-2">
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