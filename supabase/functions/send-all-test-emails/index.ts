import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BG = "#0D0D0D";
const CARD = "#1a1a1a";
const BORDER = "#2a2a2a";
const TEXT = "#F5F0E8";
const SUBTLE = "#cfcfcf";
const COPPER = "#C9A46E";
const COPPER_BRIGHT = "#E8C48A";

function shell(inner: string, lang: "de" | "en") {
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#ffffff;">
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:24px auto;background:${BG};color:${TEXT};padding:32px;border-radius:18px;text-align:center;">
      <p style="margin:0 0 18px;letter-spacing:3px;font-size:11px;font-weight:700;color:${COPPER};text-align:center;">SITDOWN VIENNA</p>
      ${inner}
      <p style="color:${COPPER_BRIGHT};font-size:13px;font-weight:600;margin:20px 0 4px;text-align:center;">+43 664 4686073</p>
      <p style="color:${SUBTLE};font-size:12px;margin:0;text-align:center;">📍 Lavaterstrasse 2 · 1220 Wien</p>
      <p style="color:#777;font-size:11px;margin:14px 0 0;text-align:center;">© 2026 Sitdown Wien</p>
    </div>
  </body></html>`;
}

function bookingConfirmHtml(lang: "de" | "en") {
  const isDE = lang === "de";
  const L = isDE
    ? { title: "Dein Termin ist bestätigt ✂️", hello: "Hallo Diego,", line: "Wir freuen uns auf dich!", svc: "Service", brb: "Barbier", dte: "Datum", tim: "Uhrzeit", tot: "Gesamt", policy: "Kostenlose Stornierung bis 24 Std. vor dem Termin · danach werden 5 € Kaution einbehalten (nicht erstattbar).", date: "Mittwoch, 13. Mai" }
    : { title: "Your appointment is confirmed ✂️", hello: "Hi Diego,", line: "We can't wait to see you!", svc: "Service", brb: "Barber", dte: "Date", tim: "Time", tot: "Total", policy: "Free cancellation up to 24h before · after that the €5 deposit is retained (non-refundable).", date: "Wednesday, 13 May" };

  const inner = `
    <h2 style="color:${COPPER};font-size:24px;margin:0 0 8px;font-weight:700;text-align:center;">${L.title}</h2>
    <p style="color:${SUBTLE};margin:0 0 22px;font-size:14px;text-align:center;">${L.hello} ${L.line}</p>
    <div style="background:${CARD};border-radius:12px;padding:20px;border:1px solid ${BORDER};margin-bottom:18px;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;color:${SUBTLE};text-align:center;">${L.svc} · <span style="color:${TEXT};font-weight:600;">Bartdesign</span></p>
      <p style="margin:0 0 8px;font-size:14px;color:${SUBTLE};text-align:center;">${L.brb} · <span style="color:${TEXT};font-weight:600;">Cetin</span></p>
      <p style="margin:0 0 8px;font-size:14px;color:${SUBTLE};text-align:center;">${L.dte} · <span style="color:${TEXT};font-weight:600;">${L.date}</span></p>
      <p style="margin:0 0 14px;font-size:14px;color:${SUBTLE};text-align:center;">${L.tim} · <span style="color:${TEXT};font-weight:600;">09:00</span></p>
      <p style="margin:0;font-size:18px;color:${COPPER_BRIGHT};font-weight:700;text-align:center;">${L.tot} · 25 €</p>
    </div>
    <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:14px 16px;margin-bottom:6px;text-align:center;">
      <p style="margin:0;color:${SUBTLE};font-size:12px;line-height:1.6;text-align:center;">${L.policy}</p>
    </div>`;
  return shell(inner, lang);
}

type ReminderType = "7d" | "24h" | "5h" | "2h";

function reminderHtml(lang: "de" | "en", type: ReminderType) {
  const isDE = lang === "de";
  const titles: Record<ReminderType, { de: string; en: string }> = {
    "7d":  { de: "Dein Termin in 1 Woche ✂️",  en: "Your appointment in 1 week ✂️" },
    "24h": { de: "Dein Termin ist morgen ✂️",  en: "Your appointment is tomorrow ✂️" },
    "5h":  { de: "Dein Termin ist heute ✂️",   en: "Your appointment is today ✂️" },
    "2h":  { de: "Noch 2 Stunden ✂️",          en: "2 hours to go ✂️" },
  };
  const bodies: Record<ReminderType, { de: string; en: string }> = {
    "7d": {
      de: `Kleine Erinnerung · in <strong>1 Woche</strong> · Mittwoch um <strong>09:00</strong> Uhr bei <strong>Cetin</strong> · <em>Bartdesign</em>`,
      en: `Friendly reminder · in <strong>1 week</strong> · Wednesday at <strong>09:00</strong> with <strong>Cetin</strong> · <em>Bartdesign</em>`,
    },
    "24h": {
      de: `Vergiss deinen Termin nicht. Morgen um <strong>09:00</strong> Uhr bei <strong>Cetin</strong> · <em>Bartdesign</em>`,
      en: `Don't forget your appointment. Tomorrow at <strong>09:00</strong> with <strong>Cetin</strong> · <em>Bartdesign</em>`,
    },
    "5h": {
      de: `Heute in 5 Stunden um <strong>09:00</strong> Uhr · <strong>Cetin</strong> erwartet dich für <em>Bartdesign</em>`,
      en: `In 5 hours at <strong>09:00</strong> · <strong>Cetin</strong> is ready for your <em>Bartdesign</em>`,
    },
    "2h": {
      de: `Nur noch 2 Stunden. Um <strong>09:00</strong> Uhr bei <strong>Cetin</strong> · <em>Bartdesign</em>. Wir sehen uns!`,
      en: `Only 2 hours left. At <strong>09:00</strong> with <strong>Cetin</strong> · <em>Bartdesign</em>. See you soon!`,
    },
  };
  const stillFree = type === "7d" || type === "24h";
  const policyDE = stillFree
    ? "Kostenlose Stornierung bis 24 Std. vor dem Termin · danach werden 5 € Kaution einbehalten (nicht erstattbar)."
    : "Stornierung jetzt nicht mehr kostenlos · die 5 € Kaution wird einbehalten und ist nicht erstattbar.";
  const policyEN = stillFree
    ? "Free cancellation up to 24h before · after that the €5 deposit is retained (non-refundable)."
    : "Cancellation is no longer free · the €5 deposit is retained and non-refundable.";

  const title = isDE ? titles[type].de : titles[type].en;
  const hello = isDE ? "Hallo Diego," : "Hi Diego,";
  const body = isDE ? bodies[type].de : bodies[type].en;
  const policyLabel = isDE ? "Stornierungsbedingungen" : "Cancellation policy";
  const policy = isDE ? policyDE : policyEN;

  const inner = `
    <h2 style="color:${COPPER};font-size:24px;margin:0 0 8px;font-weight:700;text-align:center;">${title}</h2>
    <p style="color:${SUBTLE};margin:0 0 20px;font-size:14px;text-align:center;">${hello}</p>
    <div style="background:${CARD};border-radius:12px;padding:20px;border:1px solid ${BORDER};margin-bottom:18px;text-align:center;">
      <p style="margin:0;line-height:1.7;font-size:15px;color:${TEXT};text-align:center;">${body}</p>
    </div>
    <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:14px 16px;margin-bottom:6px;text-align:center;">
      <p style="margin:0;color:${COPPER};font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;text-align:center;">${policyLabel}</p>
      <p style="margin:8px 0 0;color:${SUBTLE};font-size:12px;line-height:1.6;text-align:center;">${policy}</p>
    </div>`;
  return shell(inner, lang);
}

function cancellationHtml(lang: "de" | "en", charged: boolean) {
  const isDE = lang === "de";
  const L = isDE
    ? {
        title: "Dein Termin wurde storniert",
        hello: "Hallo Diego,",
        body: "Dein Termin am <strong>Mittwoch um 09:00</strong> Uhr bei <strong>Cetin</strong> · <em>Bartdesign</em> wurde erfolgreich storniert.",
        chargedLabel: "Stornogebühr",
        chargedTxt: "Da die Stornierung weniger als 24 Std. vor dem Termin erfolgte, wurden <strong>5 €</strong> Kaution einbehalten.",
        freeTxt: "Stornierung kostenlos · es wurde nichts abgebucht.",
      }
    : {
        title: "Your appointment was cancelled",
        hello: "Hi Diego,",
        body: "Your appointment on <strong>Wednesday at 09:00</strong> with <strong>Cetin</strong> · <em>Bartdesign</em> was successfully cancelled.",
        chargedLabel: "Cancellation fee",
        chargedTxt: "Cancellation occurred less than 24h before · the <strong>€5</strong> deposit was retained.",
        freeTxt: "Free cancellation · nothing was charged.",
      };
  const inner = `
    <h2 style="color:${COPPER};font-size:24px;margin:0 0 8px;font-weight:700;text-align:center;">${L.title}</h2>
    <p style="color:${SUBTLE};margin:0 0 20px;font-size:14px;text-align:center;">${L.hello}</p>
    <div style="background:${CARD};border-radius:12px;padding:20px;border:1px solid ${BORDER};margin-bottom:18px;text-align:center;">
      <p style="margin:0;line-height:1.7;font-size:15px;color:${TEXT};text-align:center;">${L.body}</p>
    </div>
    <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:14px 16px;margin-bottom:6px;text-align:center;">
      <p style="margin:0;color:${COPPER};font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;text-align:center;">${L.chargedLabel}</p>
      <p style="margin:8px 0 0;color:${SUBTLE};font-size:13px;line-height:1.6;text-align:center;">${charged ? L.chargedTxt : L.freeTxt}</p>
    </div>`;
  return shell(inner, lang);
}

function contactHtml(lang: "de" | "en") {
  const isDE = lang === "de";
  const L = isDE
    ? { title: "Danke für deine Nachricht", hello: "Hallo Diego,", body: "Wir haben deine Nachricht erhalten und melden uns sobald wie möglich bei dir." }
    : { title: "Thanks for your message", hello: "Hi Diego,", body: "We received your message and will get back to you as soon as possible." };
  const inner = `
    <h2 style="color:${COPPER};font-size:24px;margin:0 0 8px;font-weight:700;text-align:center;">${L.title}</h2>
    <p style="color:${SUBTLE};margin:0 0 20px;font-size:14px;text-align:center;">${L.hello}</p>
    <div style="background:${CARD};border-radius:12px;padding:20px;border:1px solid ${BORDER};margin-bottom:6px;text-align:center;">
      <p style="margin:0;line-height:1.7;font-size:15px;color:${TEXT};text-align:center;">${L.body}</p>
    </div>`;
  return shell(inner, lang);
}

function passwordResetHtml(lang: "de" | "en") {
  const isDE = lang === "de";
  const L = isDE
    ? { title: "Passwort zurücksetzen", hello: "Hallo Diego,", body: "Klicke auf den Button unten, um dein Passwort zurückzusetzen. Der Link ist 1 Stunde gültig.", btn: "Passwort zurücksetzen", ignore: "Falls du das nicht angefordert hast, ignoriere diese E-Mail." }
    : { title: "Reset your password", hello: "Hi Diego,", body: "Click the button below to reset your password. The link expires in 1 hour.", btn: "Reset password", ignore: "If you didn't request this, just ignore this email." };
  const inner = `
    <h2 style="color:${COPPER};font-size:24px;margin:0 0 8px;font-weight:700;text-align:center;">${L.title}</h2>
    <p style="color:${SUBTLE};margin:0 0 18px;font-size:14px;text-align:center;">${L.hello}</p>
    <div style="background:${CARD};border-radius:12px;padding:24px 20px;border:1px solid ${BORDER};margin-bottom:18px;text-align:center;">
      <p style="margin:0 0 18px;line-height:1.7;font-size:15px;color:${TEXT};text-align:center;">${L.body}</p>
      <a href="https://sitdownvienna.app" style="display:inline-block;background:${COPPER};color:${BG};font-weight:700;font-size:14px;padding:12px 26px;border-radius:14px;text-decoration:none;">${L.btn}</a>
    </div>
    <p style="margin:0;color:${SUBTLE};font-size:12px;text-align:center;">${L.ignore}</p>`;
  return shell(inner, lang);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Admin-only: verify JWT + admin role
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const sbUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await sbUser.auth.getClaims(token);
    const uid = claims?.claims?.sub;
    if (claimsErr || !uid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: isAdmin } = await sbAdmin.rpc("has_role", { _user_id: uid, _role: "admin" });
    if (isAdmin !== true) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (_) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), { status: 500, headers: corsHeaders });
  }

  let to = "creationation.at@gmail.com";
  let lang: "de" | "en" = "de";
  try {
    const body = await req.json();
    if (body?.to) to = body.to;
    if (body?.lang === "en") lang = "en";
  } catch (_) { /* ok */ }


  const emails: { subject: string; html: string }[] = [
    { subject: lang === "de" ? "[TEST] Buchungsbestätigung" : "[TEST] Booking confirmed", html: bookingConfirmHtml(lang) },
    { subject: "[TEST] Reminder · 7 days",  html: reminderHtml(lang, "7d") },
    { subject: "[TEST] Reminder · 24 hours", html: reminderHtml(lang, "24h") },
    { subject: "[TEST] Reminder · 5 hours",  html: reminderHtml(lang, "5h") },
    { subject: "[TEST] Reminder · 2 hours",  html: reminderHtml(lang, "2h") },
    { subject: lang === "de" ? "[TEST] Stornierung (kostenlos)" : "[TEST] Cancellation (free)",      html: cancellationHtml(lang, false) },
    { subject: lang === "de" ? "[TEST] Stornierung (5 € einbehalten)" : "[TEST] Cancellation (€5 retained)", html: cancellationHtml(lang, true) },
    { subject: lang === "de" ? "[TEST] Kontakt-Bestätigung" : "[TEST] Contact confirmation", html: contactHtml(lang) },
    { subject: lang === "de" ? "[TEST] Passwort zurücksetzen" : "[TEST] Password reset", html: passwordResetHtml(lang) },
  ];

  const results: any[] = [];
  for (const e of emails) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Sitdown Wien <info@ugcpanel.app>",
        to: [to],
        subject: e.subject,
        html: e.html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    results.push({ subject: e.subject, ok: res.ok, status: res.status, data });
    await new Promise(r => setTimeout(r, 250));
  }

  return new Response(JSON.stringify({ to, lang, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
