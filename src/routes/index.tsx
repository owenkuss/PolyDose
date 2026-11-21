import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Globe, Phone, Pill, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AddMedicationDialog } from "@/components/dosebridge/AddMedicationDialog";
import { FilterPopover, type StatusFilter } from "@/components/dosebridge/FilterPopover";
import { MedicationList } from "@/components/dosebridge/MedicationList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createMedication,
  deleteMedication,
  fetchMedications,
  loadFirstPatient,
  loadPatientByPhone,
  toggleMedicationActive,
  updateMedication,
  updatePatientLanguage,
  upsertPatientProfile,
  type MedicationRow,
  type PatientRow,
} from "@/lib/dosebridge-api";
import {
  COMMON_TIMEZONES,
  countActiveMedicationsByDay,
  DEFAULT_DEMO_PHONE,
  detectBrowserTimezone,
  getDueScheduledKey,
  getLocalDateParts,
  getMedicationTimes,
  isValidPhoneNumber,
} from "@/lib/dosebridge-utils";
import {
  buildSmsReminderText,
  isLanguageCode,
  LANGUAGES,
  TRANSLATIONS,
  type LanguageCode,
} from "@/lib/i18n";
import { generateSmsReminder } from "@/lib/gemini-reminders.functions";
import { sendReminderSms } from "@/lib/sms.functions";

const PHONE_STORAGE_KEY = "dosebridge_phone";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PolyDose — Multilingual Medication Reminders" },
      {
        name: "description",
        content:
          "Set up simple, translated SMS medication reminders in the top 10 U.S. languages for patients and caregivers.",
      },
      { property: "og:title", content: "PolyDose — Multilingual Medication Reminders" },
      {
        property: "og:description",
        content:
          "Set up simple, translated SMS medication reminders in the top 10 U.S. languages for patients and caregivers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoseBridgePage,
});

function DoseBridgePage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [phoneInput, setPhoneInput] = useState(DEFAULT_DEMO_PHONE);
  const [timezone, setTimezone] = useState("America/New_York");
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [todayIdx, setTodayIdx] = useState<number>(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicationRow | null>(null);
  const [phonePopoverOpen, setPhonePopoverOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingMed, setIsAddingMed] = useState(false);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    let cancelled = false;
    const browserTz = detectBrowserTimezone();

    async function init() {
      try {
        const savedPhone = window.localStorage.getItem(PHONE_STORAGE_KEY);
        let found: PatientRow | null = null;
        if (savedPhone) {
          found = await loadPatientByPhone(savedPhone);
        }
        if (!found) {
          found = await loadFirstPatient();
        }
        if (cancelled) return;

        if (found) {
          setPatient(found);
          setPhoneInput(found.phone_number);
          setTimezone(found.timezone || browserTz);
          if (isLanguageCode(found.language)) {
            setLanguage(found.language);
          }
          const meds = await fetchMedications(found.id);
          if (cancelled) return;
          setMedications(meds);
        } else {
          setTimezone(browserTz);
        }
      } catch (err) {
        console.error("Failed to load DoseBridge data:", err);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setTodayIdx(getLocalDateParts(new Date(), timezone).weekday);
  }, [timezone]);

  useEffect(() => {
    if (!patient || medications.length === 0) return;
    let active = true;

    async function checkDueReminders() {
      if (!patient) return;
      const now = new Date();
      for (const med of medications) {
        const scheduledKey = getDueScheduledKey(med, timezone, now, 1);
        if (!scheduledKey) continue;
        const messageText = buildSmsReminderText(language, {
          name: med.name,
          dosage: med.dosage,
          instructions: med.instructions,
        });
        try {
          const result = await sendReminderSms({
            data: {
              patientId: patient.id,
              medicationId: med.id,
              messageText,
              language,
              scheduledKey,
            },
          });
          if (!active || !result.logged || !result.medication) continue;
          setMedications((prev) =>
            prev.map((m) => (m.id === med.id ? result.medication! : m)),
          );
          toast.success(`${t.autoSentToast}: ${med.name}`, { description: messageText });
          if (!result.smsSent) {
            toast.error(t.smsDeliveryFailed, { description: result.smsError ?? undefined });
          }
        } catch (err) {
          console.error("Automatic reminder dispatch failed:", err);
        }
      }
    }

    void checkDueReminders();
    const intervalId = window.setInterval(() => {
      void checkDueReminders();
    }, 15_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [patient, medications, timezone, language, t.autoSentToast]);

  async function handleLanguageSwitch(nextLang: LanguageCode) {
    setLanguage(nextLang);
    if (patient) {
      try {
        const updated = await updatePatientLanguage(patient.id, nextLang);
        setPatient(updated);
      } catch (err) {
        console.error("Failed to save language:", err);
      }
    }
  }

  async function handleSaveProfile(nextTimezone?: string) {
    if (!isValidPhoneNumber(phoneInput)) {
      toast.error(t.invalidPhoneError);
      return;
    }
    const tzToSave = nextTimezone ?? timezone;
    setIsSavingProfile(true);
    try {
      const saved = await upsertPatientProfile({
        phoneNumber: phoneInput,
        language,
        timezone: tzToSave,
      });
      setPatient(saved);
      window.localStorage.setItem(PHONE_STORAGE_KEY, saved.phone_number);
      const meds = await fetchMedications(saved.id);
      setMedications(meds);
      setPhonePopoverOpen(false);
      toast.success(t.profileSavedToast);
    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error(err instanceof Error && err.message ? err.message : t.invalidPhoneError);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleTimezoneChange(nextTz: string) {
    setTimezone(nextTz);
    if (isValidPhoneNumber(phoneInput)) {
      await handleSaveProfile(nextTz);
    }
  }

  async function handleAddMedication(input: {
    name: string;
    dosage: string;
    instructions: string;
    daysOfWeek: number[];
    reminderTimes: string[];
  }): Promise<boolean> {
    if (!isValidPhoneNumber(phoneInput)) {
      toast.error(t.invalidPhoneError);
      return false;
    }
    setIsAddingMed(true);
    try {
      let currentPatient = patient;
      if (!currentPatient || currentPatient.phone_number !== phoneInput.trim()) {
        currentPatient = await upsertPatientProfile({
          phoneNumber: phoneInput,
          language,
          timezone,
        });
        setPatient(currentPatient);
        window.localStorage.setItem(PHONE_STORAGE_KEY, currentPatient.phone_number);
      }
      const created = await createMedication({
        patientId: currentPatient.id,
        ...input,
      });
      setMedications((prev) => [created, ...prev]);
      toast.success(t.medAddedToast);
      return true;
    } catch (err) {
      console.error("Add medication failed:", err);
      toast.error(err instanceof Error && err.message ? err.message : t.medValidationError);
      return false;
    } finally {
      setIsAddingMed(false);
    }
  }

  function handleEditMedication(med: MedicationRow) {
    setEditingMed(med);
    setAddDialogOpen(true);
  }

  async function handleUpdateMedication(
    medicationId: string,
    input: {
      name: string;
      dosage: string;
      instructions: string;
      daysOfWeek: number[];
      reminderTimes: string[];
    },
  ): Promise<boolean> {
    setIsAddingMed(true);
    try {
      const updated = await updateMedication(medicationId, input);
      setMedications((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      toast.success(t.medUpdatedToast);
      return true;
    } catch (err) {
      console.error("Update medication failed:", err);
      toast.error(err instanceof Error && err.message ? err.message : t.medValidationError);
      return false;
    } finally {
      setIsAddingMed(false);
    }
  }

  async function handleToggleActive(med: MedicationRow, nextActive: boolean) {
    setMedications((prev) =>
      prev.map((m) => (m.id === med.id ? { ...m, is_active: nextActive } : m)),
    );
    try {
      const updated = await toggleMedicationActive(med.id, nextActive);
      setMedications((prev) => prev.map((m) => (m.id === med.id ? updated : m)));
    } catch (err) {
      console.error("Toggle active failed:", err);
      setMedications((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, is_active: med.is_active } : m)),
      );
    }
  }

  async function handleDeleteMedication(med: MedicationRow) {
    try {
      await deleteMedication(med.id);
      setMedications((prev) => prev.filter((m) => m.id !== med.id));
      toast.success(t.medDeletedToast);
    } catch (err) {
      console.error("Delete medication failed:", err);
    }
  }

  async function handleSendTestReminder(med: MedicationRow) {
    if (!patient) return;
    let messageText = buildSmsReminderText(language, {
      name: med.name,
      dosage: med.dosage,
      instructions: med.instructions,
    });
    try {
      const generated = await generateSmsReminder({
        data: {
          language,
          name: med.name,
          dosage: med.dosage,
          instructions: med.instructions,
        },
      });
      if (generated.messageText) {
        messageText = generated.messageText;
      }
    } catch (err) {
      console.error("Gemini SMS generation failed, using template:", err);
    }
    try {
      const result = await sendReminderSms({
        data: {
          patientId: patient.id,
          medicationId: med.id,
          messageText,
          language,
          scheduledKey: `test-${Date.now()}`,
        },
      });
      if (result.medication) {
        setMedications((prev) =>
          prev.map((m) => (m.id === med.id ? result.medication! : m)),
        );
      }
      if (result.smsSent) {
        toast.success(t.testSentToast, { description: messageText });
      } else {
        toast.error(t.smsDeliveryFailed, { description: result.smsError ?? undefined });
      }
    } catch (err) {
      console.error("Send test reminder failed:", err);
    }
  }

  const timezoneOptions = useMemo(() => {
    const list: string[] = [...COMMON_TIMEZONES];
    if (timezone && !list.includes(timezone)) {
      list.unshift(timezone);
    }
    return list;
  }, [timezone]);

  const activeCounts = useMemo(
    () => countActiveMedicationsByDay(medications),
    [medications],
  );

  const visibleMedications = useMemo(() => {
    return medications
      .filter((med) => (selectedDay === null ? true : med.days_of_week.includes(selectedDay)))
      .filter((med) =>
        statusFilter === "all" ? true : statusFilter === "active" ? med.is_active : !med.is_active,
      )
      .sort((a, b) => {
        const firstA = getMedicationTimes(a)[0] ?? a.reminder_time;
        const firstB = getMedicationTimes(b)[0] ?? b.reminder_time;
        return firstA.localeCompare(firstB);
      });
  }, [medications, selectedDay, statusFilter]);

  const isFiltered = selectedDay !== null || statusFilter !== "all";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5 px-4 pb-1 pt-3.5 sm:px-6">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Pill className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-bold leading-none tracking-tight text-foreground">
            PolyDose
          </span>
          <span className="hidden truncate text-xs font-medium text-muted-foreground sm:inline">
            · {t.tagline}
          </span>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-2.5 px-4 pb-3.5 pt-2 sm:grid-cols-3 sm:gap-3 sm:px-6">
          <div className="flex items-center">
            <Select
              value={language}
              onValueChange={(val) => {
                if (isLanguageCode(val)) void handleLanguageSwitch(val);
              }}
            >
              <SelectTrigger
                aria-label={t.languageLabel}
                className="h-11 w-full rounded-xl border-border bg-card px-3.5 text-sm font-bold text-foreground shadow-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">
                    <SelectValue />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-sm font-medium">
                    {lang.nativeLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            <Popover open={phonePopoverOpen} onOpenChange={setPhonePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-start gap-2 rounded-xl border-border bg-card px-3.5 text-sm font-bold text-foreground shadow-xs hover:border-primary hover:bg-accent"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">{phoneInput || t.phoneShortLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-80 rounded-xl border-border bg-popover p-4 shadow-lg">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSaveProfile();
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="patient-phone" className="text-sm font-bold">
                      {t.phoneLabel}
                    </Label>
                    <Input
                      id="patient-phone"
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className="h-11 bg-background text-base"
                      autoComplete="tel"
                    />
                  </div>
                  <Button type="submit" disabled={isSavingProfile} className="h-10 w-full font-bold">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {isSavingProfile ? t.saving : t.saveProfile}
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center">
            <Select value={timezone} onValueChange={(val) => void handleTimezoneChange(val)}>
              <SelectTrigger
                aria-label={t.timezoneLabel}
                className="h-11 w-full rounded-xl border-border bg-card px-3.5 text-sm font-bold text-foreground shadow-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">
                    <SelectValue />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-sm">
                    {tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            onClick={() => {
              setEditingMed(null);
              setAddDialogOpen(true);
            }}
            className="h-11 gap-2 rounded-xl px-5 text-base font-bold shadow-xs"
          >
            <span>{t.addNewBtn}</span>
            <Plus className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <span className="inline-flex h-9 items-center rounded-full border border-primary/30 bg-accent px-3 text-xs font-bold text-accent-foreground">
                {[
                  selectedDay !== null ? t.daysShort[selectedDay] : null,
                  statusFilter === "active"
                    ? t.activeBadge
                    : statusFilter === "paused"
                      ? t.pausedBadge
                      : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isFiltered}
              onClick={() => {
                setSelectedDay(null);
                setStatusFilter("all");
              }}
              className="h-9 gap-1.5 rounded-xl border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-xs hover:border-primary hover:bg-accent disabled:opacity-45"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>{t.filterReset}</span>
            </Button>
            <FilterPopover
              t={t}
              selectedDay={selectedDay}
              todayIdx={todayIdx}
              activeCounts={activeCounts}
              statusFilter={statusFilter}
              onSelectDay={setSelectedDay}
              onSelectStatus={setStatusFilter}
              onReset={() => {
                setSelectedDay(null);
                setStatusFilter("all");
              }}
            />
          </div>
        </div>

        <MedicationList
          t={t}
          medications={visibleMedications}
          timezone={timezone}
          isFiltered={isFiltered}
          onToggleActive={handleToggleActive}
          onEdit={handleEditMedication}
          onDelete={handleDeleteMedication}
          onSendTest={handleSendTestReminder}
        />

        <AddMedicationDialog
          open={addDialogOpen}
          onOpenChange={(nextOpen) => {
            setAddDialogOpen(nextOpen);
            if (!nextOpen) setEditingMed(null);
          }}
          t={t}
          isSubmitting={isAddingMed}
          editing={editingMed}
          onAdd={handleAddMedication}
          onUpdate={handleUpdateMedication}
        />
      </main>
    </div>
  );
}
