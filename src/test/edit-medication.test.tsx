import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddMedicationDialog } from "@/components/dosebridge/AddMedicationDialog";
import { MedicationList } from "@/components/dosebridge/MedicationList";
import type { MedicationRow } from "@/lib/dosebridge-api";
import { TRANSLATIONS } from "@/lib/i18n";

const t = TRANSLATIONS.en;

const savedMed: MedicationRow = {
  id: "med-1",
  patient_id: "patient-1",
  name: "Metformin",
  dosage: "500mg — 1 tablet",
  instructions: "Take with food",
  days_of_week: [1, 3, 5],
  reminder_time: "20:30",
  is_active: true,
  last_sent_at: null,
  last_confirmed_at: null,
  created_at: "2026-11-01T00:00:00Z",
};

beforeEach(() => {
  // Keep the medication name typeahead from calling the NIH API during tests.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => [0, [], {}] }),
  );
});

describe("Editing a saved medication", () => {
  it("fills the form with the saved values and sends the edits back", async () => {
    const onUpdate = vi.fn().mockResolvedValue(true);
    const onAdd = vi.fn();

    render(
      <AddMedicationDialog
        open
        onOpenChange={() => {}}
        t={t}
        isSubmitting={false}
        editing={savedMed}
        onAdd={onAdd}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByRole("heading", { name: "Edit Medication" })).toBeInTheDocument();
    expect(screen.getByLabelText("Medication Name")).toHaveValue("Metformin");
    expect(screen.getByLabelText("Dosage")).toHaveValue("500mg — 1 tablet");
    expect(screen.getByLabelText("Special Instructions")).toHaveValue("Take with food");
    expect(
      screen.getByLabelText("Reminder Time", { selector: "input" }),
    ).toHaveValue("8:30");
    expect(screen.getByRole("button", { name: "PM" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Mon / Wed / Fri are the saved days; Tue is not.
    expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tue" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.change(screen.getByLabelText("Medication Name"), {
      target: { value: "Metformin XR" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledWith("med-1", {
      name: "Metformin XR",
      dosage: "500mg — 1 tablet",
      instructions: "Take with food",
      daysOfWeek: [1, 3, 5],
      reminderTime: "20:30",
    });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("shows an Edit button on each listed medication that opens that medication", () => {
    const onEdit = vi.fn();

    render(
      <MedicationList
        t={t}
        medications={[savedMed]}
        timezone="America/New_York"
        isFiltered={false}
        onToggleActive={() => {}}
        onEdit={onEdit}
        onDelete={() => {}}
        onSendTest={() => {}}
      />,
    );

    const editButton = screen.getByRole("button", { name: "Edit Metformin" });
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(savedMed);
  });

  it("keeps every language able to label the edit controls", () => {
    for (const lang of ["en", "es", "zh", "fr", "vi", "ht"] as const) {
      const dict = TRANSLATIONS[lang];
      expect(dict.editBtn.length).toBeGreaterThan(0);
      expect(dict.editMedTitle.length).toBeGreaterThan(0);
      expect(dict.saveChangesBtn.length).toBeGreaterThan(0);
      expect(dict.medUpdatedToast.length).toBeGreaterThan(0);
    }
  });
});
