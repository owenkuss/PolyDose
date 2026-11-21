# DoseBridge Care

Build a clean, accessible, single-page web app called "DoseBridge" — a multilingual medication reminder dashboard designed for patients and caregivers.

Design & Aesthetic:
- Calm, modern healthcare UI: crisp white background, soft slate cards, deep teal primary accents, high-contrast typography, and large touch-friendly buttons suitable for elderly users.
- Responsive 2-column desktop layout (main dashboard on the left, live "SMS Phone Preview" mockup on the right; stacks cleanly on mobile).
- No login/password wall. Identify the user simply by their phone number and language preference so anyone can demo it in 10 seconds.

Core Features to Build:
1. Top Header with Instant Language Switcher:
   - Include a prominent language selector supporting 6 languages: English (en), Spanish (es), Mandarin Chinese (zh), French (fr), Vietnamese (vi), and Haitian Creole (ht).
   - Store a complete client-side i18n translation dictionary so switching languages immediately translates EVERY label, button, placeholder, day name, and helper text across the entire dashboard.

2. Patient Profile Bar:
   - Compact top bar for entering Phone Number (with country code, e.g., +1) and auto-detecting the user's browser timezone (editable dropdown).
   - Auto-save or provide a quick "Save Profile" button.

3. Add Medication Card:
   - Medication Name input (include quick-select suggestion chips for common meds like Metformin, Lisinopril, Atorvastatin, Amoxicillin, plus free-text entry).
   - Dosage input (e.g., "500mg — 1 tablet").
   - Special Instructions input (e.g., "Take with food", "Take before bed").
   - Schedule Picker: Interactive day-of-week toggle pills (Sun–Sat) with a one-click "Every Day" toggle, plus a clean Time Picker (e.g., 08:00 AM).
   - Primary CTA button: "Add Reminder".

4. Active Medication Schedule List:
   - Displays all saved medications as clean cards showing: name, dosage, instructions, selected days badges, scheduled time, an Active/Paused toggle, a Delete button, and a prominent "Send Test Reminder" button.

5. Live "Simulated Phone" SMS Preview Panel:
   - A realistic mobile messaging mockup on the right side of the dashboard.
   - Displays the exact medication reminder text translated into the user's currently selected language (under 150 characters, friendly 6th-grade reading level, including medicine name, dosage, instructions, and "Reply 1 to confirm").
   - Clicking "Send Test Reminder" on any medication card immediately pushes a new timestamped SMS bubble into the phone preview with a toast notification ("Test reminder sent").
   - Include a mock "Reply 1 (Taken)" button inside the phone preview so during a demo we can show adherence tracking flipping the medication card status to "Taken Today" (green badge).

Backend / Database (Lovable Cloud):
- Set up two Postgres tables:
  1. `patients`: id (uuid), phone_number (text, unique), language (text, default 'en'), timezone (text), created_at.
  2. `medications`: id (uuid), patient_id (uuid FK), name (text), dosage (text), instructions (text), days_of_week (int array, 0=Sun..6=Sat), reminder_time (text, HH:MM 24h), is_active (boolean, default true), last_sent_at (timestamptz), last_confirmed_at (timestamptz), created_at.
- Connect all UI forms and lists directly to these tables with realistic seed data for 1 sample medication if the table is empty so the dashboard looks great immediately.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/46a93295-f32b-4375-8366-dac18b96c803).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
