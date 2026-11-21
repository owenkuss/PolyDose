import { CheckCircle2, Clock, Pill, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { MedicationRow } from "@/lib/dosebridge-api";
import { formatTime12h, isTakenToday } from "@/lib/dosebridge-utils";
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
  return (
    <section aria-labelledby="schedule-heading" className="space-y-4">
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

      {medications.length === 0 ? (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="py-10 text-center text-base text-muted-foreground">
            {t.scheduleEmpty}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {medications.map((med) => {
            const takenToday = isTakenToday(med.last_confirmed_at, timezone);
            const isSelected = med.id === selectedMedId;
            return (
              <Card
                key={med.id}
                onClick={() => onSelect(med)}
                className={`cursor-pointer border transition-colors ${
                  isSelected
                    ? "border-primary bg-card ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/50"
                } ${!med.is_active ? "opacity-75" : ""}`}
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h3 className="text-xl font-bold text-foreground">{med.name}</h3>
                        {takenToday && (
                          <Badge className="gap-1 border border-success/30 bg-success-muted px-2.5 py-0.5 text-sm font-bold text-success hover:bg-success-muted">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            {t.takenTodayBadge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-base font-medium text-foreground">{med.dosage}</p>
                      {med.instructions && (
                        <p className="text-sm text-muted-foreground">{med.instructions}</p>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`text-sm font-bold ${
                          med.is_active ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {med.is_active ? t.activeBadge : t.pausedBadge}
                      </span>
                      <Switch
                        checked={med.is_active}
                        onCheckedChange={(checked) => onToggleActive(med, checked)}
                        aria-label={`${med.name} ${med.is_active ? t.activeBadge : t.pausedBadge}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-sm font-bold text-foreground ring-1 ring-border">
                      <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                      {formatTime12h(med.reminder_time)}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {med.days_of_week.length === 7 ? (
                        <Badge variant="secondary" className="text-xs font-bold">
                          {t.everyDay}
                        </Badge>
                      ) : (
                        med.days_of_week.map((dayIdx) => (
                          <Badge key={dayIdx} variant="secondary" className="text-xs font-bold">
                            {t.daysShort[dayIdx] ?? ""}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      onClick={() => onSendTest(med)}
                      className="h-11 gap-2 px-4 text-base font-bold"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      {t.sendTestBtn}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onDelete(med)}
                      className="h-11 gap-1.5 border-border px-3.5 text-sm font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {t.deleteBtn}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}