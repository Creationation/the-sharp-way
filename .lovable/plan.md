# Admin Manual / Help Center

Add an admin-only **Manual / Handbuch** tab that documents every section of the admin dashboard in plain language. Strictly bilingual **EN / DE** based on the admin's selected language — no French anywhere in the UI or copy.

## Where it lives

- New tab in `AdminDashboard.tsx` burger menu, with a `BookOpen` (lucide) icon, placed at the **top** of the menu so admins find it first.
- Label: `"Manual"` (EN) / `"Handbuch"` (DE).
- New component: `src/components/admin/ManualTab.tsx`.
- All copy added to `src/lib/translations.ts` under `admin.manualTab` (EN + DE only).

## Layout (mobile-first, dark/copper style consistent with other admin tabs)

- Header: title + short intro
  - EN: "Welcome to the admin manual · Find what each section does and how every action works."
  - DE: "Willkommen im Admin-Handbuch · Hier findest du, wofür jeder Bereich da ist und wie jede Aktion funktioniert."
- Search input that filters sections by keyword (client-side, case-insensitive).
- Accordion list (`@/components/ui/accordion`) — one item per admin section, copper accent on the active item.
- Each entry shows the matching tab icon + title, then a structured body:
  - **What it's for** / **Wofür**: 1–2 lines.
  - **What you see** / **Was du siehst**: bullet list of UI elements.
  - **What happens when you click…** / **Was passiert, wenn du klickst…**: Q&A list of every important button/action.
  - **How to…** / **So geht's**: 2–3 short step-by-step mini-guides.

## Sections covered (one per existing admin tab)

1. **Bookings / Buchungen** — barber filter chips, search, advanced filters (date from/to), calendar density colors (green/orange/red), CSV export, reset, status changes (confirm/cancel/delete), attendance (attended / no-show → loyalty stamps, 5€ fee).
2. **Schedule / Zeitplan** — visual calendar view of appointments.
3. **Stats / Statistiken** — key figures (revenue, bookings, top barber, etc.).
4. **Availability / Verfügbarkeit** — pick barber + date, block slots, mark day off, save.
5. **Users / Kunden** — view all clients, their bookings, loyalty.
6. **Promotions / Aktionen** — marquee banner + dynamic promo cards (title EN/DE, image, link).
7. **Barbers / Barbiere** — add/edit/delete barbers, photo, specialty, calendar color.
8. **Services / Dienstleistungen** — manage services (price, duration, category, active).
9. **Gallery / Galerie** — upload photos by category, ordering, activation.
10. **Promo Codes / Promo-Codes** — create codes (% or €), usage limit, expiry.
11. **Notifications / Benachrichtigungen** — toggle email reminders 24h / 5h / 2h / 7d.
12. **Emails / E-Mails** — sent email log (sent / failed / dlq), Gmail inbox, manual send.
13. **Admins / Admins** — promote a user to admin, remove admin access.

## Cross-cutting topics — extra accordion section "General concepts" / "Allgemeine Konzepte"

- How to switch between client app and admin panel.
- 24h cancellation policy and 5€ fee (Stripe Setup Intent).
- Loyalty system (10 stamps → free cut, admin approval).
- Switching language (DE/EN) — affects the whole UI including this manual.
- Automatic Telegram notifications.

## Out of scope

- No backend changes, no migrations, no new tables.
- No screenshots, no video — text only (can be extended later).
- No technical details exposed (no table names, no routes, no Supabase mentions).
- No third language — strictly EN/DE.

## Technical notes

- File: `src/components/admin/ManualTab.tsx` — pure presentational, reads `useLanguage()` for the current admin language.
- Translations live in `src/lib/translations.ts` → `admin.manualTab` (EN + DE), structured as `{ intro, searchPlaceholder, sections: [{ id, title, purpose, ui: string[], actions: {q,a}[], howTo: {title, steps: string[]}[] }], concepts: [...] }`.
- Wired into `AdminDashboard.tsx`: add `"manual"` to `TabId`, prepend in `ADMIN_TABS`, render `{tab === "manual" && <ManualTab />}`.
