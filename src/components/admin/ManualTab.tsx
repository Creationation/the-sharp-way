import { useMemo, useState } from "react";
import {
  BookOpen, Search, X, Calendar as CalendarIcon, LayoutGrid, BarChart3,
  Clock, User, Tag, Scissors, Bell, Mail, Shield, Sparkles,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

type QA = { q: string; a: string };
type HowTo = { title: string; steps: string[] };
type Section = {
  id: string;
  Icon: React.ElementType;
  title: string;
  purpose: string;
  ui: string[];
  actions: QA[];
  howTo: HowTo[];
};

type Copy = {
  pageTitle: string;
  intro: string;
  searchPlaceholder: string;
  noResults: string;
  labels: { purpose: string; ui: string; actions: string; howTo: string };
  sections: Section[];
  conceptsTitle: string;
  concepts: { id: string; title: string; body: string }[];
};

const EN: Copy = {
  pageTitle: "Manual",
  intro: "Welcome to the admin manual · Find what each section does and how every action works.",
  searchPlaceholder: "Search the manual…",
  noResults: "No section matches your search.",
  labels: {
    purpose: "What it's for",
    ui: "What you see",
    actions: "What happens when you click…",
    howTo: "How to…",
  },
  sections: [
    {
      id: "bookings", Icon: CalendarIcon, title: "Bookings",
      purpose: "Central list of every appointment. Filter, search, change status and track attendance.",
      ui: [
        "Barber filter chips at the top (All / one barber).",
        "Search bar to find a booking by client name, email, phone, barber, service or notes.",
        "Advanced filters with date from / date to.",
        "Calendar with colored dots: green = light day, orange = busy, red = very busy.",
        "Action buttons on each booking card.",
      ],
      actions: [
        { q: "Confirm", a: "Marks the booking as confirmed. The client is notified." },
        { q: "Cancel", a: "Cancels the booking. Status becomes cancelled and the slot opens up again." },
        { q: "Delete (trash icon)", a: "Permanently removes the booking from the list. There is no undo." },
        { q: "Attended", a: "Marks the client as attended and adds one loyalty stamp to their card." },
        { q: "No-show", a: "Marks the client as no-show. The 5€ fee is charged according to the cancellation policy." },
        { q: "Export CSV", a: "Downloads the currently filtered list as a CSV file." },
        { q: "Reset", a: "Clears all filters and shows every booking again." },
      ],
      howTo: [
        { title: "Find a specific client's bookings", steps: [
          "Type the client's name, email or phone in the search bar.",
          "Optionally pick a date or date range to narrow further.",
        ]},
        { title: "Mark attendance after a haircut", steps: [
          "Open the booking card for that day.",
          "Tap Attended to add a loyalty stamp, or No-show to charge the fee.",
        ]},
      ],
    },
    {
      id: "schedule", Icon: LayoutGrid, title: "Schedule",
      purpose: "Visual day-by-day view of every appointment per barber.",
      ui: [
        "Day header with date.",
        "Time grid with each booking placed on its slot.",
        "Barber columns or filter to focus on one barber.",
      ],
      actions: [
        { q: "A booking block", a: "Shows the client, service and time of that appointment." },
        { q: "Date arrows", a: "Navigates to the previous or next day." },
      ],
      howTo: [
        { title: "Plan tomorrow", steps: [
          "Open Schedule.",
          "Move to tomorrow's date.",
          "Check gaps and busy hours at a glance.",
        ]},
      ],
    },
    {
      id: "stats", Icon: BarChart3, title: "Statistics",
      purpose: "Key business numbers in one place.",
      ui: [
        "Revenue card.",
        "Bookings count.",
        "Top barber and top service.",
        "Trends over time.",
      ],
      actions: [
        { q: "A period selector", a: "Recomputes every figure for the chosen period." },
      ],
      howTo: [
        { title: "Compare months", steps: [
          "Open Statistics.",
          "Switch the period to compare values.",
        ]},
      ],
    },
    {
      id: "availability", Icon: Clock, title: "Availability",
      purpose: "Block individual time slots or full days off for a barber.",
      ui: [
        "Barber selector.",
        "Date picker.",
        "Day off toggle.",
        "Grid of 30-minute slots: available, blocked, or already booked.",
        "Save button.",
      ],
      actions: [
        { q: "A slot", a: "Toggles between available and blocked. Booked slots are read-only." },
        { q: "Day off", a: "Marks the entire day as unavailable for that barber." },
        { q: "Save", a: "Persists the changes. Clients will not be able to book blocked slots." },
      ],
      howTo: [
        { title: "Give a barber a day off", steps: [
          "Pick the barber and the date.",
          "Turn on Day off.",
          "Tap Save.",
        ]},
      ],
    },
    {
      id: "users", Icon: User, title: "Customers",
      purpose: "Browse every registered client, see their bookings and loyalty status.",
      ui: [
        "Search and list of clients.",
        "Profile details: name, email, phone.",
        "Loyalty stamps and history.",
      ],
      actions: [
        { q: "A client row", a: "Opens the client's details and history." },
        { q: "Adjust loyalty", a: "Manually changes stamps or points for that client." },
      ],
      howTo: [
        { title: "Reward a loyal client", steps: [
          "Open the client.",
          "Adjust loyalty to add or remove stamps.",
        ]},
      ],
    },
    {
      id: "promotions", Icon: Tag, title: "Promotions",
      purpose: "Manage the announcement banner and the promo cards shown on the home screen.",
      ui: [
        "Marquee announcement editor (EN / DE).",
        "List of promo cards with title, image and link.",
      ],
      actions: [
        { q: "Add promo", a: "Creates a new promo card visible on the client home." },
        { q: "Edit / Delete", a: "Updates or removes a card." },
        { q: "Activate toggle", a: "Shows or hides the promo without deleting it." },
      ],
      howTo: [
        { title: "Run a weekend promo", steps: [
          "Add a promo card with title and image.",
          "Activate it.",
          "Deactivate it after the weekend.",
        ]},
      ],
    },
    {
      id: "barbers", Icon: Scissors, title: "Barbers",
      purpose: "Add, edit or remove barbers shown to clients.",
      ui: [
        "List of barbers with photo and specialty.",
        "Add barber form.",
        "Edit and delete buttons.",
        "Calendar color per barber.",
      ],
      actions: [
        { q: "Add barber", a: "Adds a new barber. They become bookable immediately." },
        { q: "Edit", a: "Updates name, photo, specialty or color." },
        { q: "Delete", a: "Removes the barber. Existing bookings stay in history." },
      ],
      howTo: [
        { title: "Onboard a new barber", steps: [
          "Tap Add barber.",
          "Fill in name, photo and specialty.",
          "Save.",
        ]},
      ],
    },
    {
      id: "services", Icon: Scissors, title: "Services",
      purpose: "Manage the catalog of services clients can book.",
      ui: [
        "List of services with price, duration and category.",
        "Active toggle.",
        "Add / edit / delete buttons.",
      ],
      actions: [
        { q: "Active toggle", a: "Shows or hides a service from the booking flow without deleting it." },
        { q: "Edit", a: "Updates price, duration, name or category." },
      ],
      howTo: [
        { title: "Add a new service", steps: [
          "Tap Add service.",
          "Set name, price, duration and category.",
          "Save and activate it.",
        ]},
      ],
    },
    {
      id: "gallery", Icon: LayoutGrid, title: "Gallery",
      purpose: "Manage the photos shown in the client gallery.",
      ui: [
        "Categories.",
        "Upload area.",
        "Order and active toggle per photo.",
      ],
      actions: [
        { q: "Upload", a: "Adds a new photo to the chosen category." },
        { q: "Active toggle", a: "Shows or hides the photo without deleting it." },
        { q: "Delete", a: "Permanently removes the photo." },
      ],
      howTo: [
        { title: "Add a new haircut photo", steps: [
          "Pick the category.",
          "Upload the photo.",
          "Activate it.",
        ]},
      ],
    },
    {
      id: "codes", Icon: Tag, title: "Promo codes",
      purpose: "Create discount codes clients can apply during booking.",
      ui: [
        "List of codes with type (% or €), limit, expiry and uses.",
        "Add code form.",
        "Active toggle.",
      ],
      actions: [
        { q: "Add code", a: "Creates a new promo code." },
        { q: "Active toggle", a: "Enables or disables the code." },
        { q: "Delete", a: "Permanently removes the code." },
      ],
      howTo: [
        { title: "Launch a -10% campaign", steps: [
          "Tap Add code.",
          "Set the value to 10%, the usage limit and the expiry date.",
          "Activate the code and share it.",
        ]},
      ],
    },
    {
      id: "notifications", Icon: Bell, title: "Notifications",
      purpose: "Choose which automatic email reminders are sent to clients.",
      ui: [
        "Toggles for 7 days, 24 hours, 5 hours and 2 hours before the appointment.",
      ],
      actions: [
        { q: "A toggle", a: "Turns the corresponding reminder on or off for all clients." },
      ],
      howTo: [
        { title: "Reduce email volume", steps: [
          "Keep only the 24h reminder on.",
          "Turn the others off.",
        ]},
      ],
    },
    {
      id: "emails", Icon: Mail, title: "Emails",
      purpose: "Inspect every email sent by the system and send manual emails.",
      ui: [
        "Log of sent emails with status: sent, failed or dead-letter.",
        "Inbox view.",
        "Manual send form.",
      ],
      actions: [
        { q: "An email row", a: "Shows recipient, subject and full content." },
        { q: "Send", a: "Sends a new email immediately to the address you typed." },
        { q: "Retry failed", a: "Re-attempts delivery of a failed email." },
      ],
      howTo: [
        { title: "Send a one-off email", steps: [
          "Open Emails.",
          "Fill the manual send form (to, subject, body).",
          "Tap Send.",
        ]},
      ],
    },
    {
      id: "admins", Icon: Shield, title: "Admins",
      purpose: "Decide who has access to this admin panel.",
      ui: [
        "Searchable list of users.",
        "Promote and remove buttons.",
      ],
      actions: [
        { q: "Promote", a: "Gives the user full admin access. They can see this panel on next login." },
        { q: "Remove admin", a: "Revokes admin access. The user keeps their normal account." },
      ],
      howTo: [
        { title: "Grant admin to a colleague", steps: [
          "Search for their name or email.",
          "Tap Promote.",
        ]},
      ],
    },
  ],
  conceptsTitle: "General concepts",
  concepts: [
    { id: "switch", title: "Switching between client app and admin panel",
      body: "The admin panel is opened from your profile when your account has the admin role. Clients never see it." },
    { id: "cancel", title: "24-hour cancellation policy and 5€ fee",
      body: "When a client books, a 5€ payment method is securely held. Cancelling more than 24 hours in advance is free. Cancelling later or not showing up triggers the 5€ fee." },
    { id: "loyalty", title: "Loyalty system",
      body: "Each attended visit awards one stamp. After 10 stamps the client can request a free cut, which an admin must approve from the Customers tab." },
    { id: "language", title: "Switching language (EN / DE)",
      body: "Changing the language updates the whole interface, including this manual. Clients can pick their own language independently." },
    { id: "telegram", title: "Telegram notifications",
      body: "New bookings, cancellations and important events are sent automatically to the team's Telegram chat. Nothing to configure on your side." },
  ],
};

const DE: Copy = {
  pageTitle: "Handbuch",
  intro: "Willkommen im Admin-Handbuch · Hier findest du, wofür jeder Bereich da ist und wie jede Aktion funktioniert.",
  searchPlaceholder: "Im Handbuch suchen…",
  noResults: "Keine Sektion entspricht deiner Suche.",
  labels: {
    purpose: "Wofür",
    ui: "Was du siehst",
    actions: "Was passiert, wenn du klickst…",
    howTo: "So geht's",
  },
  sections: [
    {
      id: "bookings", Icon: CalendarIcon, title: "Buchungen",
      purpose: "Zentrale Liste aller Termine. Filtern, suchen, Status ändern und Anwesenheit verfolgen.",
      ui: [
        "Barbier-Filter-Chips oben (Alle / einzelner Barbier).",
        "Suchleiste, um eine Buchung nach Kundenname, E-Mail, Telefon, Barbier, Dienstleistung oder Notizen zu finden.",
        "Erweiterte Filter mit Datum von / Datum bis.",
        "Kalender mit farbigen Punkten: grün = wenig, orange = belegt, rot = sehr belegt.",
        "Aktions-Buttons auf jeder Buchungskarte.",
      ],
      actions: [
        { q: "Bestätigen", a: "Markiert die Buchung als bestätigt. Der Kunde wird benachrichtigt." },
        { q: "Stornieren", a: "Storniert die Buchung. Der Slot wird wieder frei." },
        { q: "Löschen (Mülleimer)", a: "Entfernt die Buchung dauerhaft. Kann nicht rückgängig gemacht werden." },
        { q: "Anwesend", a: "Markiert den Kunden als anwesend und vergibt einen Treuestempel." },
        { q: "Nicht erschienen", a: "Markiert als No-Show. Die 5 €-Gebühr wird gemäß Stornorichtlinie eingezogen." },
        { q: "CSV exportieren", a: "Lädt die aktuell gefilterte Liste als CSV-Datei herunter." },
        { q: "Zurücksetzen", a: "Entfernt alle Filter und zeigt alle Buchungen wieder." },
      ],
      howTo: [
        { title: "Buchungen eines Kunden finden", steps: [
          "Name, E-Mail oder Telefon des Kunden in die Suche eingeben.",
          "Optional Datum oder Zeitraum eingrenzen.",
        ]},
        { title: "Anwesenheit nach dem Schnitt erfassen", steps: [
          "Buchungskarte des Tages öffnen.",
          "Auf Anwesend tippen für einen Stempel, oder Nicht erschienen für die Gebühr.",
        ]},
      ],
    },
    {
      id: "schedule", Icon: LayoutGrid, title: "Zeitplan",
      purpose: "Visuelle Tagesübersicht aller Termine pro Barbier.",
      ui: [
        "Tageskopf mit Datum.",
        "Zeitraster mit jeder Buchung an ihrem Slot.",
        "Spalten pro Barbier oder Filter auf einen Barbier.",
      ],
      actions: [
        { q: "Ein Buchungs-Block", a: "Zeigt Kunde, Dienstleistung und Uhrzeit des Termins." },
        { q: "Datums-Pfeile", a: "Wechselt zum vorherigen oder nächsten Tag." },
      ],
      howTo: [
        { title: "Morgen planen", steps: [
          "Zeitplan öffnen.",
          "Zum morgigen Datum wechseln.",
          "Lücken und Stoßzeiten auf einen Blick prüfen.",
        ]},
      ],
    },
    {
      id: "stats", Icon: BarChart3, title: "Statistiken",
      purpose: "Wichtige Geschäftszahlen an einem Ort.",
      ui: [
        "Umsatz-Karte.",
        "Anzahl der Buchungen.",
        "Top-Barbier und Top-Dienstleistung.",
        "Trends über die Zeit.",
      ],
      actions: [
        { q: "Zeitraum-Auswahl", a: "Berechnet alle Werte für den gewählten Zeitraum neu." },
      ],
      howTo: [
        { title: "Monate vergleichen", steps: [
          "Statistiken öffnen.",
          "Zeitraum wechseln, um die Werte zu vergleichen.",
        ]},
      ],
    },
    {
      id: "availability", Icon: Clock, title: "Verfügbarkeit",
      purpose: "Einzelne Slots blockieren oder ganze freie Tage für einen Barbier festlegen.",
      ui: [
        "Barbier-Auswahl.",
        "Datums-Auswahl.",
        "Schalter Freier Tag.",
        "Raster von 30-Minuten-Slots: verfügbar, blockiert oder bereits gebucht.",
        "Speichern-Button.",
      ],
      actions: [
        { q: "Ein Slot", a: "Wechselt zwischen verfügbar und blockiert. Gebuchte Slots sind nur lesbar." },
        { q: "Freier Tag", a: "Markiert den ganzen Tag als nicht verfügbar." },
        { q: "Speichern", a: "Speichert die Änderungen. Kunden können blockierte Slots nicht buchen." },
      ],
      howTo: [
        { title: "Einem Barbier einen freien Tag geben", steps: [
          "Barbier und Datum auswählen.",
          "Freier Tag aktivieren.",
          "Auf Speichern tippen.",
        ]},
      ],
    },
    {
      id: "users", Icon: User, title: "Kunden",
      purpose: "Alle registrierten Kunden, ihre Buchungen und ihren Treue-Status durchsuchen.",
      ui: [
        "Suche und Liste der Kunden.",
        "Profildetails: Name, E-Mail, Telefon.",
        "Treuestempel und Verlauf.",
      ],
      actions: [
        { q: "Eine Kundenzeile", a: "Öffnet die Details und den Verlauf des Kunden." },
        { q: "Treue anpassen", a: "Ändert manuell Stempel oder Punkte für den Kunden." },
      ],
      howTo: [
        { title: "Treuen Kunden belohnen", steps: [
          "Kunden öffnen.",
          "Treue anpassen, um Stempel hinzuzufügen oder zu entfernen.",
        ]},
      ],
    },
    {
      id: "promotions", Icon: Tag, title: "Aktionen",
      purpose: "Banner und Promo-Karten verwalten, die auf dem Startbildschirm angezeigt werden.",
      ui: [
        "Editor für die Lauftext-Ankündigung (EN / DE).",
        "Liste der Promo-Karten mit Titel, Bild und Link.",
      ],
      actions: [
        { q: "Aktion hinzufügen", a: "Erstellt eine neue Promo-Karte, sichtbar auf dem Kunden-Home." },
        { q: "Bearbeiten / Löschen", a: "Aktualisiert oder entfernt eine Karte." },
        { q: "Aktiv-Schalter", a: "Blendet die Aktion ein oder aus, ohne sie zu löschen." },
      ],
      howTo: [
        { title: "Wochenend-Aktion starten", steps: [
          "Promo-Karte mit Titel und Bild hinzufügen.",
          "Aktivieren.",
          "Nach dem Wochenende deaktivieren.",
        ]},
      ],
    },
    {
      id: "barbers", Icon: Scissors, title: "Barbiere",
      purpose: "Barbiere hinzufügen, bearbeiten oder entfernen, die Kunden sehen.",
      ui: [
        "Liste der Barbiere mit Foto und Spezialität.",
        "Formular Barbier hinzufügen.",
        "Buttons Bearbeiten und Löschen.",
        "Kalenderfarbe pro Barbier.",
      ],
      actions: [
        { q: "Barbier hinzufügen", a: "Fügt einen neuen Barbier hinzu. Sofort buchbar." },
        { q: "Bearbeiten", a: "Aktualisiert Name, Foto, Spezialität oder Farbe." },
        { q: "Löschen", a: "Entfernt den Barbier. Bestehende Buchungen bleiben im Verlauf." },
      ],
      howTo: [
        { title: "Neuen Barbier einarbeiten", steps: [
          "Auf Barbier hinzufügen tippen.",
          "Name, Foto und Spezialität eintragen.",
          "Speichern.",
        ]},
      ],
    },
    {
      id: "services", Icon: Scissors, title: "Dienstleistungen",
      purpose: "Den Katalog der buchbaren Dienstleistungen verwalten.",
      ui: [
        "Liste der Dienstleistungen mit Preis, Dauer und Kategorie.",
        "Aktiv-Schalter.",
        "Buttons Hinzufügen / Bearbeiten / Löschen.",
      ],
      actions: [
        { q: "Aktiv-Schalter", a: "Blendet eine Dienstleistung im Buchungsablauf ein oder aus, ohne sie zu löschen." },
        { q: "Bearbeiten", a: "Aktualisiert Preis, Dauer, Name oder Kategorie." },
      ],
      howTo: [
        { title: "Neue Dienstleistung hinzufügen", steps: [
          "Auf Dienstleistung hinzufügen tippen.",
          "Name, Preis, Dauer und Kategorie festlegen.",
          "Speichern und aktivieren.",
        ]},
      ],
    },
    {
      id: "gallery", Icon: LayoutGrid, title: "Galerie",
      purpose: "Die Fotos in der Kunden-Galerie verwalten.",
      ui: [
        "Kategorien.",
        "Upload-Bereich.",
        "Reihenfolge und Aktiv-Schalter pro Foto.",
      ],
      actions: [
        { q: "Hochladen", a: "Fügt der gewählten Kategorie ein neues Foto hinzu." },
        { q: "Aktiv-Schalter", a: "Blendet das Foto ein oder aus, ohne es zu löschen." },
        { q: "Löschen", a: "Entfernt das Foto dauerhaft." },
      ],
      howTo: [
        { title: "Neues Frisuren-Foto hinzufügen", steps: [
          "Kategorie wählen.",
          "Foto hochladen.",
          "Aktivieren.",
        ]},
      ],
    },
    {
      id: "codes", Icon: Tag, title: "Promo-Codes",
      purpose: "Rabattcodes erstellen, die Kunden bei der Buchung einlösen können.",
      ui: [
        "Liste der Codes mit Typ (% oder €), Limit, Ablauf und Nutzungen.",
        "Formular Code hinzufügen.",
        "Aktiv-Schalter.",
      ],
      actions: [
        { q: "Code hinzufügen", a: "Erstellt einen neuen Promo-Code." },
        { q: "Aktiv-Schalter", a: "Aktiviert oder deaktiviert den Code." },
        { q: "Löschen", a: "Entfernt den Code dauerhaft." },
      ],
      howTo: [
        { title: "-10 % Kampagne starten", steps: [
          "Auf Code hinzufügen tippen.",
          "Wert auf 10 %, Nutzungslimit und Ablaufdatum festlegen.",
          "Aktivieren und teilen.",
        ]},
      ],
    },
    {
      id: "notifications", Icon: Bell, title: "Benachrichtigungen",
      purpose: "Festlegen, welche automatischen E-Mail-Erinnerungen an Kunden gesendet werden.",
      ui: [
        "Schalter für 7 Tage, 24 Stunden, 5 Stunden und 2 Stunden vor dem Termin.",
      ],
      actions: [
        { q: "Ein Schalter", a: "Schaltet die jeweilige Erinnerung für alle Kunden ein oder aus." },
      ],
      howTo: [
        { title: "E-Mail-Volumen reduzieren", steps: [
          "Nur die 24h-Erinnerung aktiv lassen.",
          "Die anderen ausschalten.",
        ]},
      ],
    },
    {
      id: "emails", Icon: Mail, title: "E-Mails",
      purpose: "Alle vom System gesendeten E-Mails einsehen und manuelle E-Mails versenden.",
      ui: [
        "Log der gesendeten E-Mails mit Status: gesendet, fehlgeschlagen oder Dead-Letter.",
        "Posteingang.",
        "Formular zum manuellen Versand.",
      ],
      actions: [
        { q: "Eine E-Mail-Zeile", a: "Zeigt Empfänger, Betreff und vollständigen Inhalt." },
        { q: "Senden", a: "Sendet sofort eine neue E-Mail an die eingegebene Adresse." },
        { q: "Erneut versuchen", a: "Versucht die Zustellung einer fehlgeschlagenen E-Mail erneut." },
      ],
      howTo: [
        { title: "Einmalige E-Mail senden", steps: [
          "E-Mails öffnen.",
          "Manuelles Formular ausfüllen (An, Betreff, Inhalt).",
          "Auf Senden tippen.",
        ]},
      ],
    },
    {
      id: "admins", Icon: Shield, title: "Admins",
      purpose: "Festlegen, wer Zugriff auf das Admin-Panel hat.",
      ui: [
        "Durchsuchbare Liste der Nutzer.",
        "Buttons Befördern und Entfernen.",
      ],
      actions: [
        { q: "Befördern", a: "Gibt dem Nutzer vollen Admin-Zugriff. Beim nächsten Login sichtbar." },
        { q: "Admin entfernen", a: "Entzieht den Admin-Zugriff. Das Konto bleibt bestehen." },
      ],
      howTo: [
        { title: "Kollegen zum Admin machen", steps: [
          "Nach Name oder E-Mail suchen.",
          "Auf Befördern tippen.",
        ]},
      ],
    },
  ],
  conceptsTitle: "Allgemeine Konzepte",
  concepts: [
    { id: "switch", title: "Wechsel zwischen Kunden-App und Admin-Panel",
      body: "Das Admin-Panel wird über dein Profil geöffnet, sobald dein Konto die Admin-Rolle hat. Kunden sehen es nie." },
    { id: "cancel", title: "24-Stunden-Stornorichtlinie und 5 €-Gebühr",
      body: "Bei der Buchung wird eine Zahlungsmethode für 5 € sicher hinterlegt. Stornierung mehr als 24 Stunden vorher ist kostenlos. Spätere Stornos oder Nichterscheinen lösen die 5 €-Gebühr aus." },
    { id: "loyalty", title: "Treuesystem",
      body: "Jeder wahrgenommene Termin gibt einen Stempel. Nach 10 Stempeln kann der Kunde einen Gratisschnitt anfragen, der von einem Admin im Bereich Kunden bestätigt werden muss." },
    { id: "language", title: "Sprache wechseln (EN / DE)",
      body: "Die Sprache ändert die gesamte Oberfläche, einschließlich dieses Handbuchs. Kunden wählen ihre Sprache unabhängig davon." },
    { id: "telegram", title: "Telegram-Benachrichtigungen",
      body: "Neue Buchungen, Stornos und wichtige Ereignisse werden automatisch an den Telegram-Chat des Teams gesendet. Keine Konfiguration nötig." },
  ],
};

const ManualTab = () => {
  const { lang } = useLanguage();
  const copy: Copy = lang === "de" ? DE : EN;
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return copy.sections;
    return copy.sections.filter(s => {
      const haystack = [
        s.title, s.purpose,
        ...s.ui,
        ...s.actions.flatMap(a => [a.q, a.a]),
        ...s.howTo.flatMap(h => [h.title, ...h.steps]),
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [copy, query]);

  return (
    <div className="px-5 pb-10">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={18} className="text-copper" />
        <h2 className="font-heading text-xl text-foreground">{copy.pageTitle}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{copy.intro}</p>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.searchPlaceholder}
          className="w-full pl-9 pr-9 py-2.5 rounded-full bg-surface border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-copper/50"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {matches.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">{copy.noResults}</p>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {matches.map((s) => (
            <AccordionItem
              key={s.id}
              value={s.id}
              className="border border-border rounded-2xl bg-surface px-4 data-[state=open]:border-copper/40"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <s.Icon size={16} className="text-copper" />
                  <span className="text-sm font-semibold text-foreground">{s.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4 text-xs leading-relaxed">
                  <Block label={copy.labels.purpose}>
                    <p className="text-muted-foreground">{s.purpose}</p>
                  </Block>
                  <Block label={copy.labels.ui}>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {s.ui.map((u, i) => <li key={i}>{u}</li>)}
                    </ul>
                  </Block>
                  <Block label={copy.labels.actions}>
                    <ul className="space-y-2">
                      {s.actions.map((a, i) => (
                        <li key={i} className="bg-background/40 rounded-lg p-2.5 border border-border/60">
                          <div className="text-foreground font-medium">{a.q}</div>
                          <div className="text-muted-foreground mt-0.5">{a.a}</div>
                        </li>
                      ))}
                    </ul>
                  </Block>
                  <Block label={copy.labels.howTo}>
                    <div className="space-y-3">
                      {s.howTo.map((h, i) => (
                        <div key={i} className="bg-background/40 rounded-lg p-2.5 border border-border/60">
                          <div className="text-foreground font-medium mb-1">{h.title}</div>
                          <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
                            {h.steps.map((st, j) => <li key={j}>{st}</li>)}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </Block>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-copper" />
          <h3 className="font-heading text-base text-foreground">{copy.conceptsTitle}</h3>
        </div>
        <Accordion type="multiple" className="space-y-2">
          {copy.concepts.map(c => (
            <AccordionItem
              key={c.id}
              value={c.id}
              className="border border-border rounded-2xl bg-surface px-4 data-[state=open]:border-copper/40"
            >
              <AccordionTrigger className="hover:no-underline py-3 text-sm font-semibold text-foreground">
                {c.title}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-xs text-muted-foreground leading-relaxed">
                {c.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

const Block = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-copper font-semibold mb-1.5">{label}</div>
    {children}
  </div>
);

export default ManualTab;
