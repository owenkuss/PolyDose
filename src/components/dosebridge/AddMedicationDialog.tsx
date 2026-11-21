import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, FileText, Pencil, Plus, Sparkles } from "lucide-react";
import { MedicationAutocomplete } from "@/components/dosebridge/MedicationAutocomplete";
import { TimePickerPopover } from "@/components/dosebridge/TimePickerPopover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MedicationRow } from "@/lib/dosebridge-api";
import type { TranslationDict } from "@/lib/i18n";
import type { MedicationSuggestion } from "@/lib/medication-search";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
type EntryMode = "choose" | "text" | "photo";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: TranslationDict;
  isSubmitting: boolean;
  editing?: MedicationRow | null;
  onAdd: (med: {
    name: string;
    dosage: string;
    instructions: string;
    daysOfWeek: number[];
    reminderTime: string;
  }) => Promise<boolean>;
  onUpdate?: (
    medicationId: string,
    med: {
      name: string;
      dosage: string;
      instructions: string;
      daysOfWeek: number[];
      reminderTime: string;
    },
  ) => Promise<boolean>;
}

export function AddMedicationDialog({
  open,
  onOpenChange,
  t,
  isSubmitting,
  editing = null,
  onAdd,
  onUpdate,
}: AddMedicationDialogProps) {
  const [mode, setMode] = useState<EntryMode>("choose");
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [suggestedStrengths, setSuggestedStrengths] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [days, setDays] = useState<number[]>(ALL_DAYS);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  // Opening the dialog for an existing medication fills the form with its current values.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setMode("text");
      setName(editing.name);
      setDosage(editing.dosage);
      setSuggestedStrengths([]);
      setInstructions(editing.instructions);
      setDays(
        editing.days_of_week.length > 0
          ? [...editing.days_of_week].sort((a, b) => a - b)
          : ALL_DAYS,
      );
      setReminderTime(editing.reminder_time || "08:00");
      setError(null);
    } else {
      resetAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  function resetAll() {
    setMode("choose");
    setName("");
    setDosage("");
    setSuggestedStrengths([]);
    setInstructions("");
    setDays(ALL_DAYS);
    setReminderTime("08:00");
    setError(null);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoName("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetAll();
    onOpenChange(nextOpen);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoName(file.name);
  }

  function handleSelectMedication(suggestion: MedicationSuggestion) {
    setName(suggestion.name);
    setSuggestedStrengths(dosage.trim() ? [] : suggestion.strengths.slice(0, 4));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || days.length === 0) {
      setError(t.medValidationError);
      return;
    }
    setError(null);
    const payload = {
      name: name.trim(),
      dosage: dosage.trim(),
      instructions: instructions.trim(),
      daysOfWeek: days,
      reminderTime: reminderTime || "08:00",
    };
    const ok =
      editing && onUpdate ? await onUpdate(editing.id, payload) : await onAdd(payload);
    if (ok) handleOpenChange(false);
  }

  const isEveryDay = days.length === 7;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          // Opening the edit panel should not jump into the name field and highlight its text.
          if (editing) e.preventDefault();
        }}
        className="max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-popover sm:max-w-lg"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {mode !== "choose" && !editing && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMode("choose")}
                aria-label={t.backToOptions}
                className="h-8 w-8 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <DialogTitle className="font-display text-2xl font-bold text-foreground">
              {editing
                ? t.editMedTitle
                : mode === "text"
                  ? t.addByTextTitle
                  : mode === "photo"
                    ? t.addByPhotoTitle
                    : t.addMedTitle}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {editing
              ? t.addMedSubtitle
              : mode === "text"
              ? t.addMedSubtitle
              : mode === "photo"
                ? t.photoCaptureHint
                : t.addMethodSubtitle}
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("text")}
              className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent/50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">{t.addByTextTitle}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{t.addByTextDesc}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("photo")}
              className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent/50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">{t.addByPhotoTitle}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{t.addByPhotoDesc}</p>
              </div>
            </button>
          </div>
        )}

        {mode === "photo" && (
          <div className="space-y-4 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {photoUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-border bg-card p-2">
                  <img
                    src={photoUrl}
                    alt={photoName || t.addByPhotoTitle}
                    className="mx-auto max-h-60 w-full rounded-lg object-contain"
                  />
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-accent/60 p-3 text-xs font-medium text-accent-foreground">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{t.photoGeminiPending}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 flex-1 font-bold"
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    {t.photoRetakeBtn}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setMode("text")}
                    className="h-11 flex-1 font-bold"
                  >
                    {t.switchToTextBtn}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-card/60 px-6 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
                  <Camera className="h-7 w-7" aria-hidden="true" />
                </span>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 px-6 text-base font-bold"
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                  {t.photoSelectBtn}
                </Button>
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {t.switchToTextBtn}
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "text" && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="med-name" className="text-sm font-bold">
                {t.medNameLabel}
              </Label>
              <MedicationAutocomplete
                id="med-name"
                value={name}
                placeholder={t.medNamePlaceholder}
                onChange={(val) => {
                  setName(val);
                  setSuggestedStrengths([]);
                  setError(null);
                }}
                onSelect={handleSelectMedication}
                onClear={() => {
                  setName("");
                  setSuggestedStrengths([]);
                  setError(null);
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="med-dosage" className="text-sm font-bold">
                  {t.dosageLabel}
                </Label>
                <Input
                  id="med-dosage"
                  value={dosage}
                  onChange={(e) => {
                    setDosage(e.target.value);
                    if (e.target.value.trim()) setSuggestedStrengths([]);
                    setError(null);
                  }}
                  placeholder={t.dosagePlaceholder}
                  className="h-11 bg-background text-base"
                />
                {!dosage.trim() && suggestedStrengths.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {suggestedStrengths.map((strength) => (
                      <button
                        key={strength}
                        type="button"
                        onClick={() => {
                          setDosage(strength);
                          setSuggestedStrengths([]);
                          setError(null);
                        }}
                        className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground"
                      >
                        {strength}
                      </button>
                    ))}
                  </div>
                )}
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
                  className="h-11 bg-background text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-bold">{t.daysLabel}</Label>
                <button
                  type="button"
                  onClick={() => {
                    setDays((prev) => (prev.length === 7 ? [] : ALL_DAYS));
                    setError(null);
                  }}
                  aria-pressed={isEveryDay}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                    isEveryDay
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  {t.everyDay}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1.5" role="group" aria-label={t.daysLabel}>
                {t.daysShort.map((label, idx) => {
                  const active = days.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDays((prev) =>
                          prev.includes(idx)
                            ? prev.filter((d) => d !== idx)
                            : [...prev, idx].sort(),
                        );
                        setError(null);
                      }}
                      aria-pressed={active}
                      className={`min-h-10 rounded-lg border text-xs font-bold transition-colors ${
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

            <div className="space-y-1.5">
              <Label htmlFor="med-time" className="text-sm font-bold">
                {t.timeLabel}
              </Label>
              <TimePickerPopover id="med-time" value={reminderTime} onChange={setReminderTime} t={t} />
            </div>

            {error && (
              <p role="alert" className="text-sm font-bold text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="h-12 w-full text-base font-bold">
              {editing ? (
                <Check className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Plus className="h-5 w-5" aria-hidden="true" />
              )}
              {editing ? t.saveChangesBtn : t.addReminderBtn}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}