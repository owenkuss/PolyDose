# PolyDose

PolyDose is an accessible, single-page medication reminder app for patients and caregivers. It sends short, friendly SMS reminders in the patient's preferred language at the exact times they choose.

## Features

- **11 languages** — English, Spanish, Chinese, Tagalog, Vietnamese, Arabic (right-to-left), French, Korean, Russian, Hindi, and Haitian Creole.
- **Prescription photo scanning** — snap a pill-bottle label and Google Gemini fills in name, dosage, instructions, and a suggested schedule.
- **Medication autocomplete** — live lookup via the NIH RxTerms API, with a local fallback and free-text entry.
- **Flexible schedules** — up to 8 reminder times per medication on any days of the week.
- **Automatic, deduplicated SMS** — a background job sends each dose reminder exactly once, in the patient's timezone.
- **No sign-up** — enter a phone number and timezone to start.
- **Filtering** — view by day of week or active/paused status, with one-click reset.

## Tech Stack

- TanStack Start v1 (React 19, server functions), Vite 7
- Tailwind CSS v4 and shadcn/ui
- Lovable Cloud (PostgreSQL with row-level security)
- Google Gemini API, NIH Clinical Tables RxTerms API, Textbelt SMS

## Getting Started

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

## Secrets

- `GEMINI_API_KEY` — label scanning and reminder wording
- `TEXTBELT_API_KEY` — outbound SMS

---
