import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMMON_MEDICATIONS } from "@/lib/dosebridge-utils";
import type { TranslationDict } from "@/lib/i18n";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface AddMedicationCardProps {
  t: TranslationDict;
  isSubmitting: boolean;
  onAdd: (med: {
    name: string;
    dosage: string;
    instructions: string;
    daysOfWeek: number[];
    reminderTime: string;
  }) => Promise<boolean>;
}

export function AddMedicationCard({ t, isSubmitting, onAdd }: AddMedicationCardProps) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [days, setDays] = useState<number[]>(ALL_DAYS);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [error, setError] = useState<string | null>(null);

  const isEveryDay = days.length === 7;

  function toggleDay(dayIndex: number) {
    setDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort(),
    );
    setError(null);
  }

  function toggleEveryDay() {
    setDays((prev) => (prev.length === 7 ? [] : ALL_DAYS));
    setError(null);
  }

  function handleQuickSelect(preset: (typeof COMMON_MEDICATIONS)[number]) {
    setName(preset.name);
    if (!dosage.trim()) setDosage(preset.dosage);
    if (!instructions.trim()) setInstructions(preset.instructions);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || days.length === 0) {
      setError(t.medValidationError);
      return;
    }
    setError(null);
    const ok = await onAdd({
      name: name.trim(),
      dosage: dosage.trim(),
      instructions: instructions.trim(),
      daysOfWeek: days,
      reminderTime: reminderTime || "08:00",
    });
    if (ok) {
      setName("");
      setDosage("");
      setInstructions("");
      setDays(ALL_DAYS);
      setReminderTime("08:00");
    }
  }

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl font-bold text-foreground">
          {t.addMedTitle}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {t.addMedSubtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="med-name" className="text-sm font-bold">
              {t.medNameLabel}
            </Label>
            <Input
              id="med-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={t.medNamePlaceholder}
              className="h-12 bg-background text-base"
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t.quickSelectLabel}
              </span>
              {COMMON_MEDICATIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleQuickSelect(preset)}
                  className="min-h-9 rounded-full border border-border bg-background px-3.5 py-1 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="med-dosage" className="text-sm font-bold">
                {t.dosageLabel}
              </Label>
              <Input
                id="med-dosage"
                value={dosage}
                onChange={(e) => {
                  setDosage(e.target.value);
                  setError(null);
                }}
                placeholder={t.dosagePlaceholder}
                className="h-12 bg-background text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-instructions" className="text-sm font-bold">
                {t.instructionsLabel}
              </Label>
              <Input
                id="med-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={t.instructionsPlaceholder}
                className="h-12 bg-background text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-sm font-bold">{t.daysLabel}</Label>
                <button
                  type="button"
                  onClick={toggleEveryDay}
                  aria-pressed={isEveryDay}
                  className={`min-h-9 rounded-full border px-3.5 py-1 text-sm font-bold transition-colors ${
                    isEveryDay
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  {t.everyDay}
                </button>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t.daysLabel}>
                {t.daysShort.map((label, idx) => {
                  const active = days.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      aria-pressed={active}
                      className={`min-h-11 min-w-12 rounded-lg border px-3 text-sm font-bold transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="med-time" className="text-sm font-bold">
                {t.timeLabel}
              </Label>
              <Input
                id="med-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="h-11 w-full bg-background text-base font-medium sm:w-40"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm font-bold text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full text-base font-bold sm:w-auto sm:px-8"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {t.addReminderBtn}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}