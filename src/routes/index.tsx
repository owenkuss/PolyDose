import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { AddMedicationCard } from "@/components/dosebridge/AddMedicationCard";
import { MedicationList } from "@/components/dosebridge/MedicationList";
import { PhonePreview } from "@/components/dosebridge/PhonePreview";
import { ProfileBar } from "@/components/dosebridge/ProfileBar";
import {
  createMedication,
  deleteMedication,
  fetchMedications,
  fetchReminderLogs,
  loadFirstPatient,
  loadPatientByPhone,
  recordAutomaticReminder,
  toggleMedicationActive,
  updatePatientLanguage,
  upsertPatientProfile,
  type MedicationRow,
  type PatientRow,
  type ReminderLogRow,
} from "@/lib/dosebridge-api";
import {
  DEFAULT_DEMO_PHONE,
  detectBrowserTimezone,
  getDueScheduledKey,
  isValidPhoneNumber,
} from "@/lib/dosebridge-utils";
import {
  buildSmsReminderText,
  isLanguageCode,
  LANGUAGES,
  TRANSLATIONS,
  type LanguageCode,
} from "@/lib/i18n";

const PHONE_STORAGE_KEY = "dosebridge_phone";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DoseBridge — Multilingual Medication Reminders" },
      {
        name: "description",
        content:
          "Set up simple, translated SMS medication reminders in 6 languages for patients and caregivers.",
      },
      { property: "og:title", content: "DoseBridge — Multilingual Medication Reminders" },
      {
        property: "og:description",
        content:
          "Set up simple, translated SMS medication reminders in 6 languages for patients and caregivers.",
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
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [reminderLogs, setReminderLogs] = useState<ReminderLogRow[]>([]);
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
          const [meds, logs] = await Promise.all([
            fetchMedications(found.id),
            fetchReminderLogs(found.id),
          ]);
          if (cancelled) return;
          setMedications(meds);
          setReminderLogs(logs);
          setSelectedMedId(meds[0]?.id ?? null);
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
          const result = await recordAutomaticReminder({
            patientId: patient.id,
            medicationId: med.id,
            messageText,
            language,
            scheduledKey,
          });
          if (!active || !result) continue;
          setReminderLogs((prev) =>
            prev.some((l) => l.id === result.log.id) ? prev : [...prev, result.log],
          );
          setMedications((prev) =>
            prev.map((m) => (m.id === med.id ? result.medication : m)),
          );
          toast.success(`${t.autoSentToast}: ${med.name}`);
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

  async function handleSaveProfile() {
    if (!isValidPhoneNumber(phoneInput)) {
      toast.error(t.invalidPhoneError);
      return;
    }
    setIsSavingProfile(true);
    try {
      const saved = await upsertPatientProfile({
        phoneNumber: phoneInput,
        language,
        timezone,
      });
      setPatient(saved);
      window.localStorage.setItem(PHONE_STORAGE_KEY, saved.phone_number);
      const [meds, logs] = await Promise.all([
        fetchMedications(saved.id),
        fetchReminderLogs(saved.id),
      ]);
      setMedications(meds);
      setReminderLogs(logs);
      setSelectedMedId(meds[0]?.id ?? null);
      toast.success(t.profileSavedToast);
    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error(t.invalidPhoneError);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleAddMedication(input: {
    name: string;
    dosage: string;
    instructions: string;
    daysOfWeek: number[];
    reminderTime: string;
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
      setSelectedMedId(created.id);
      toast.success(t.medAddedToast);
      return true;
    } catch (err) {
      console.error("Add medication failed:", err);
      toast.error(t.medValidationError);
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
      setMedications((prev) => {
        const next = prev.filter((m) => m.id !== med.id);
        if (selectedMedId === med.id) {
          setSelectedMedId(next[0]?.id ?? null);
        }
        return next;
      });
      setReminderLogs((prev) => prev.filter((l) => l.medication_id !== med.id));
      toast.success(t.medDeletedToast);
    } catch (err) {
      console.error("Delete medication failed:", err);
    }
  }

  const activeMedication =
    medications.find((m) => m.id === selectedMedId) ?? medications[0] ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <HeartPulse className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                DoseBridge
              </h1>
              <p className="text-sm font-medium text-muted-foreground">{t.tagline}</p>
            </div>
          </div>

          <div
            role="group"
            aria-label={t.languageLabel}
            className="flex flex-wrap items-center gap-1.5"
          >
            <Globe className="mr-1 h-4 w-4 text-primary" aria-hidden="true" />
            {LANGUAGES.map((lang) => {
              const active = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSwitch(lang.code)}
                  aria-pressed={active}
                  className={`min-h-10 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-accent"
                  }`}
                >
                  {lang.nativeLabel}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <ProfileBar
          t={t}
          phone={phoneInput}
          timezone={timezone}
          isSaving={isSavingProfile}
          onPhoneChange={setPhoneInput}
          onTimezoneChange={setTimezone}
          onSave={handleSaveProfile}
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <AddMedicationCard
              t={t}
              isSubmitting={isAddingMed}
              onAdd={handleAddMedication}
            />
            <MedicationList
              t={t}
              medications={medications}
              timezone={timezone}
              selectedMedId={activeMedication?.id ?? null}
              onSelect={(med) => setSelectedMedId(med.id)}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteMedication}
            />
          </div>

          <PhonePreview
            t={t}
            language={language}
            phoneNumber={phoneInput}
            timezone={timezone}
            activeMedication={activeMedication}
            logs={reminderLogs}
          />
        </div>
      </main>
    </div>
  );
}
