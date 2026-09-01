import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

type Tab = "impressum" | "datenschutz" | "agb";

const LegalScreen = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const initial = (searchParams.get("tab") as Tab) || "impressum";
  const [tab, setTab] = useState<Tab>(initial);

  const tabs: { key: Tab; labelDe: string; labelEn: string }[] = [
    { key: "impressum", labelDe: "Impressum", labelEn: "Legal Notice" },
    { key: "datenschutz", labelDe: "Datenschutz", labelEn: "Privacy" },
    { key: "agb", labelDe: "AGB", labelEn: "Terms" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-surface flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">
          {lang === "de" ? "Rechtliches" : "Legal"}
        </h1>
      </div>

      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-xs font-medium flex-shrink-0 transition-all ${
                tab === t.key
                  ? "gradient-copper text-primary-foreground"
                  : "bg-surface border border-border text-muted-foreground"
              }`}
            >
              {lang === "de" ? t.labelDe : t.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        {tab === "impressum" && <Impressum lang={lang} />}
        {tab === "datenschutz" && <Datenschutz lang={lang} />}
        {tab === "agb" && <AGB lang={lang} />}
      </div>
    </div>
  );
};

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground text-sm leading-relaxed mb-3">{children}</p>
);
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-foreground font-heading text-lg mt-6 mb-2">{children}</h2>
);
const Placeholder = ({ children }: { children: React.ReactNode }) => (
  <span className="text-copper font-medium">[{children}]</span>
);

/* --- IMPRESSUM (§ 5 ECG / § 25 MedienG, Austria) --- */
const Impressum = ({ lang }: { lang: "de" | "en" }) => {
  if (lang === "de") {
    return (
      <div className="card-app p-5">
        <P>Angaben gemäß § 5 E-Commerce-Gesetz (ECG) und § 25 Mediengesetz.</P>

        <H>Diensteanbieter</H>
        <P>
          Immotime Immobilienverwertungs GmbH<br />
          Betrieb: Sitdown Gentlemens Barber<br />
          Erzherzog-Karl-Straße 7A/DG<br />
          1220 Wien<br />
          Österreich
        </P>

        <H>Kontakt</H>
        <P>
          E-Mail: hello@sitdownvienna.app<br />
          Telefon: +43 664 8515753<br />
          Web: www.sitdownvienna.app
        </P>

        <H>Unternehmensgegenstand</H>
        <P>Friseur- und Barbier-Dienstleistungen.</P>

        <H>Rechtsform & Registrierung</H>
        <P>
          Rechtsform: Gesellschaft mit beschränkter Haftung (GmbH)<br />
          Firmenbuchnummer: FN 543898 a<br />
          Firmenbuchgericht: Handelsgericht Wien<br />
          Steuernummer: 09 386/7604<br />
          UID-Nummer: ATU77119823
        </P>

        <H>Aufsichtsbehörde / Kammer</H>
        <P>
          Wirtschaftskammer Wien · Fachgruppe Friseure<br />
          Anwendbare Rechtsvorschriften: Gewerbeordnung (GewO), abrufbar unter www.ris.bka.gv.at
        </P>

        <H>Online-Streitbeilegung</H>
        <P>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr" className="text-copper underline">
            ec.europa.eu/consumers/odr
          </a>
          . Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </P>

        <H>Haftungsausschluss</H>
        <P>
          Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
          externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber
          verantwortlich.
        </P>
      </div>
    );
  }
  return (
    <div className="card-app p-5">
      <P>Information according to § 5 E-Commerce Act (ECG) and § 25 Media Act (Austria).</P>
      <H>Provider</H>
      <P>
        Immotime Immobilienverwertungs GmbH<br />
        Trading as: Sitdown Gentlemens Barber<br />
        Erzherzog-Karl-Straße 7A/DG<br />
        1220 Vienna<br />
        Austria
      </P>
      <H>Contact</H>
      <P>
        Email: hello@sitdownvienna.app<br />
        Phone: +43 664 8515753<br />
        Web: www.sitdownvienna.app
      </P>
      <H>Business</H>
      <P>Hairdressing and barber services.</P>
      <H>Legal form & registration</H>
      <P>
        Legal form: Limited liability company (GmbH)<br />
        Commercial register no.: FN 543898 a<br />
        Court: Commercial Court Vienna<br />
        Tax number: 09 386/7604<br />
        VAT ID: ATU77119823
      </P>
      <H>Supervisory authority</H>
      <P>
        Vienna Economic Chamber · Hairdressers division<br />
        Applicable law: Austrian Trade Act (GewO), available at www.ris.bka.gv.at
      </P>
      <H>Online dispute resolution</H>
      <P>
        The European Commission provides an ODR platform:{" "}
        <a href="https://ec.europa.eu/consumers/odr" className="text-copper underline">
          ec.europa.eu/consumers/odr
        </a>
        . We are neither obliged nor willing to participate in dispute-resolution proceedings before
        a consumer arbitration board.
      </P>
      <H>Disclaimer</H>
      <P>
        Despite careful review, we assume no liability for the content of external links. The
        operators of the linked pages are solely responsible for their content.
      </P>
    </div>
  );
};

/* --- DATENSCHUTZ (GDPR / DSGVO) --- */
const Datenschutz = ({ lang }: { lang: "de" | "en" }) => {
  if (lang === "de") {
    return (
      <div className="card-app p-5">
        <H>1. Verantwortlicher</H>
        <P>
          Immotime Immobilienverwertungs GmbH (Sitdown Gentlemens Barber), Erzherzog-Karl-Straße 7A/DG,
          1220 Wien, Österreich. Kontakt: hello@sitdownvienna.app.
        </P>

        <H>2. Verarbeitete Daten</H>
        <P>
          Bei der Nutzung unserer Buchungs-App verarbeiten wir folgende Daten: Name, E-Mail-Adresse,
          Telefonnummer, Termindaten (Datum, Uhrzeit, gewählte Leistung, Barber), Zahlungs-Token
          (Stripe), gespeicherte Sprache. Passwörter werden ausschließlich verschlüsselt gespeichert.
        </P>

        <H>3. Zwecke & Rechtsgrundlagen</H>
        <P>
          Terminverwaltung und Vertragsabwicklung (Art. 6 Abs. 1 lit. b DSGVO), Erinnerungs- und
          Bestätigungs-E-Mails (Art. 6 Abs. 1 lit. b DSGVO), Kautionsabwicklung bei
          kurzfristiger Stornierung/No-Show (Art. 6 Abs. 1 lit. b DSGVO), Erfüllung gesetzlicher
          Aufbewahrungspflichten (Art. 6 Abs. 1 lit. c DSGVO).
        </P>

        <H>4. Auftragsverarbeiter & Empfänger</H>
        <P>
          Wir setzen folgende Dienste ein, die Zugriff auf personenbezogene Daten haben können:
          Supabase (Hosting & Datenbank, EU), Stripe Payments Europe Ltd (Zahlungsabwicklung, IE),
          Google Workspace (E-Mail-Versand über hello@sitdownvienna.app), Telegram
          (Benachrichtigungen an das Salon-Team, nur Termindaten).
        </P>

        <H>4a. Übermittlung in Drittländer</H>
        <P>
          Beim E-Mail-Versand über Google Workspace sowie bei Telegram-Benachrichtigungen kann eine
          Verarbeitung in den USA stattfinden. Diese Übermittlung erfolgt auf Basis der
          EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO) bzw. des EU-US Data Privacy
          Framework. Schriftarten werden lokal von unserem Server ausgeliefert — es erfolgt keine
          Verbindung zu Google Fonts oder anderen externen CDNs.
        </P>

        <H>5. Speicherdauer</H>
        <P>
          Termindaten: bis zu 3 Jahre nach dem letzten Termin. Buchhaltungsrelevante Daten: 7 Jahre
          (BAO). Konto-Daten: bis zur Löschung des Kontos durch den Nutzer.
        </P>

        <H>6. Ihre Rechte</H>
        <P>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertrag­
          barkeit und Widerspruch. Anfragen an: hello@sitdownvienna.app. Sie können sich zudem bei
          der österreichischen Datenschutzbehörde beschweren (www.dsb.gv.at).
        </P>
        <P>
          Im Bereich „Profil" können Sie jederzeit selbst Ihre Daten als Datei exportieren
          (Datenübertragbarkeit, Art. 20 DSGVO) und Ihr Konto samt aller personenbezogenen Daten
          endgültig löschen (Recht auf Löschung, Art. 17 DSGVO).
        </P>

        <H>7. Cookies & lokale Speicherung</H>
        <P>
          Wir verwenden ausschließlich technisch notwendige Speicher — keine Tracking-, Analyse-
          oder Werbe-Cookies, keine externen Schriftarten, keine Social-Media-Pixel:
        </P>
        <P>
          · <strong className="text-copper">sb-…-auth-token</strong> (Local Storage) — Login-Sitzung,
          gültig bis zum Abmelden.<br />
          · <strong className="text-copper">lang</strong> (Local Storage) — gewählte Sprache,
          dauerhaft bis zum Löschen der App-Daten.<br />
          · <strong className="text-copper">sitdown_visited</strong> (Local Storage) — Erkennung des
          Erststarts für den Intro-Bildschirm, dauerhaft.
        </P>
        <P>
          Da keine nicht notwendigen Cookies gesetzt werden, ist kein Cookie-Einwilligungsbanner
          erforderlich (§ 165 Abs. 3 TKG 2021).
        </P>

      </div>
    );
  }
  return (
    <div className="card-app p-5">
      <H>1. Controller</H>
      <P>
        Immotime Immobilienverwertungs GmbH (Sitdown Gentlemens Barber), Erzherzog-Karl-Straße 7A/DG,
        1220 Vienna, Austria. Contact: hello@sitdownvienna.app.
      </P>
      <H>2. Data we process</H>
      <P>
        When you use our booking app we process: name, email, phone, appointment data (date, time,
        service, barber), payment token (Stripe), stored language. Passwords are stored encrypted only.
      </P>
      <H>3. Purposes & legal basis</H>
      <P>
        Appointment management and contract fulfilment (Art. 6 (1)(b) GDPR), confirmation and
        reminder emails (Art. 6 (1)(b)), deposit handling on short-notice cancellation / no-show
        (Art. 6 (1)(b)), legal retention duties (Art. 6 (1)(c)).
      </P>
      <H>4. Processors & recipients</H>
      <P>
        Services with potential access to personal data: Supabase (hosting & database, EU), Stripe
        Payments Europe Ltd (payments, IE), Google Workspace (email delivery via
        hello@sitdownvienna.app), Telegram (staff notifications, appointment data only).
      </P>
      <H>5. Retention</H>
      <P>
        Appointment data: up to 3 years after the last visit. Accounting data: 7 years (Austrian
        Federal Fiscal Code). Account data: until deletion by the user.
      </P>
      <H>6. Your rights</H>
      <P>
        You have the right to access, rectification, erasure, restriction, portability and
        objection. Requests: hello@sitdownvienna.app. You may also lodge a complaint with the
        Austrian Data Protection Authority (www.dsb.gv.at).
      </P>
      <H>7. Cookies</H>
      <P>
        We use strictly necessary storage only (login session, language preference). No tracking or
        advertising cookies are set.
      </P>
    </div>
  );
};

/* --- AGB (Allgemeine Geschäftsbedingungen) --- */
const AGB = ({ lang }: { lang: "de" | "en" }) => {
  if (lang === "de") {
    return (
      <div className="card-app p-5">
        <H>1. Geltungsbereich</H>
        <P>
          Diese Allgemeinen Geschäftsbedingungen gelten für alle über die App oder Website{" "}
          sitdownvienna.app gebuchten Dienstleistungen von{" "}
          Immotime Immobilienverwertungs GmbH, betrieben als Sitdown Gentlemens Barber (nachfolgend „Salon").
        </P>

        <H>2. Terminbuchung</H>
        <P>
          Die Buchung erfolgt digital über die App. Eine verbindliche Buchung entsteht mit der
          E-Mail-Bestätigung. Der Salon behält sich vor, Termine bei begründeten Anlässen
          (Krankheit, technische Störung) zu verschieben.
        </P>

        <H>3. Stornierung & Ausbleiben</H>
        <P>
          Stornierungen sind bis 24 Stunden vor dem Termin kostenlos möglich. Bei Stornierung
          weniger als 24 Stunden vor dem Termin oder bei Nichterscheinen (No-Show) wird eine
          Ausfallgebühr von <strong className="text-copper">€ 5,00</strong> über die bei der
          Buchung hinterlegte Zahlungsmethode eingezogen.
        </P>

        <H>4. Preise & Zahlung</H>
        <P>
          Es gelten die in der App angezeigten Preise inkl. gesetzlicher Umsatzsteuer. Die Bezahlung
          der Leistung erfolgt vor Ort. Die Zahlungsdaten für die Ausfallgebühr werden über den
          Zahlungsdienstleister Stripe sicher gespeichert (Setup Intent).
        </P>

        <H>5. Treueprogramm</H>
        <P>
          Das digitale Treueprogramm (10 Stempel = 1 Gratis-Haarschnitt) ist an das Nutzerkonto
          gebunden, nicht übertragbar und nicht in bar auszahlbar. Missbrauch führt zum Ausschluss.
        </P>

        <H>6. Haftung</H>
        <P>
          Der Salon haftet für Schäden nur im Rahmen der gesetzlichen Bestimmungen. Für Schäden an
          mitgebrachten Wertgegenständen wird keine Haftung übernommen.
        </P>

        <H>7. Anwendbares Recht & Gerichtsstand</H>
        <P>
          Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist Wien,
          sofern der Kunde Unternehmer ist; für Verbraucher gelten die gesetzlichen
          Gerichtsstände.
        </P>
      </div>
    );
  }
  return (
    <div className="card-app p-5">
      <H>1. Scope</H>
      <P>
        These Terms apply to all services booked through the app or website sitdownvienna.app
        provided by Immotime Immobilienverwertungs GmbH, trading as Sitdown Gentlemens Barber ("the Salon").
      </P>
      <H>2. Booking</H>
      <P>
        Bookings are made through the app. A binding booking is formed upon email confirmation. The
        Salon may reschedule appointments for good cause (illness, technical failure).
      </P>
      <H>3. Cancellation & no-show</H>
      <P>
        Cancellations are free of charge up to 24 hours before the appointment. For cancellations
        less than 24 hours before the appointment or no-shows, a fee of{" "}
        <strong className="text-copper">€ 5.00</strong> is charged via the payment method stored at
        booking.
      </P>
      <H>4. Prices & payment</H>
      <P>
        Prices shown in the app include statutory VAT. Service payment is made on site. Payment
        details for the no-show fee are securely stored via Stripe (Setup Intent).
      </P>
      <H>5. Loyalty programme</H>
      <P>
        The digital loyalty programme (10 stamps = 1 free haircut) is tied to the user account,
        non-transferable and non-refundable in cash. Misuse leads to exclusion.
      </P>
      <H>6. Liability</H>
      <P>
        The Salon is liable only within the limits of statutory provisions. No liability is assumed
        for valuables brought along by customers.
      </P>
      <H>7. Applicable law & venue</H>
      <P>
        Austrian law applies, excluding the UN Sales Convention. Place of jurisdiction is Vienna
        where the customer is a business; for consumers, statutory venues apply.
      </P>
    </div>
  );
};

export default LegalScreen;
