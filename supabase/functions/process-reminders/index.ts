import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendGmail } from "../_shared/gmail-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Booking {
  id: string;
  user_id: string;
  barber_name: string;
  service_name: string;
  service_price: string;
  booking_date: string;
  booking_time: string;
  status: string;
  reminder_sent_7d: boolean;
  reminder_sent_24h: boolean;
  reminder_sent_5h: boolean;
  reminder_sent_2h: boolean;
}

type ReminderType = "7d" | "24h" | "5h" | "2h";

function buildReminderEmail(
  name: string,
  service: string,
  barber: string,
  dateDE: string,
  dateEN: string,
  time: string,
  type: ReminderType,
  lang: "de" | "en"
): { subject: string; html: string } {
  const isDE = lang === "de";

  const titles: Record<ReminderType, { de: string; en: string }> = {
    "7d":  { de: "Dein Termin in 1 Woche ✂️",  en: "Your appointment in 1 week ✂️" },
    "24h": { de: "Dein Termin ist morgen ✂️",  en: "Your appointment is tomorrow ✂️" },
    "5h":  { de: "Dein Termin ist heute ✂️",   en: "Your appointment is today ✂️" },
    "2h":  { de: "Noch 2 Stunden ✂️",          en: "2 hours to go ✂️" },
  };

  const bodies: Record<ReminderType, { de: string; en: string }> = {
    "7d": {
      de: `Kleine Erinnerung · in <strong>1 Woche</strong> · ${dateDE} um <strong>${time}</strong> Uhr bei <strong>${barber}</strong> · <em>${service}</em>`,
      en: `Friendly reminder · in <strong>1 week</strong> · ${dateEN} at <strong>${time}</strong> with <strong>${barber}</strong> · <em>${service}</em>`,
    },
    "24h": {
      de: `Vergiss deinen Termin nicht. Morgen um <strong>${time}</strong> Uhr bei <strong>${barber}</strong> · <em>${service}</em>`,
      en: `Don't forget your appointment. Tomorrow at <strong>${time}</strong> with <strong>${barber}</strong> · <em>${service}</em>`,
    },
    "5h": {
      de: `Heute in 5 Stunden um <strong>${time}</strong> Uhr · <strong>${barber}</strong> erwartet dich für <em>${service}</em>`,
      en: `In 5 hours at <strong>${time}</strong> · <strong>${barber}</strong> is ready for your <em>${service}</em>`,
    },
    "2h": {
      de: `Nur noch 2 Stunden. Um <strong>${time}</strong> Uhr bei <strong>${barber}</strong> · <em>${service}</em>. Wir sehen uns!`,
      en: `Only 2 hours left. At <strong>${time}</strong> with <strong>${barber}</strong> · <em>${service}</em>. See you soon!`,
    },
  };

  const stillFree = type === "7d" || type === "24h";
  const policyDE = stillFree
    ? "Kostenlose Stornierung bis 24 Std. vor dem Termin · danach werden 5 € Kaution einbehalten (nicht erstattbar)."
    : "Stornierung jetzt nicht mehr kostenlos · die 5 € Kaution wird einbehalten und ist nicht erstattbar.";
  const policyEN = stillFree
    ? "Free cancellation up to 24h before · after that the €5 deposit is retained (non-refundable)."
    : "Cancellation is no longer free · the €5 deposit is retained and non-refundable.";

  const L = isDE
    ? {
        title: titles[type].de,
        hello: `Hallo ${name},`,
        body: bodies[type].de,
        address: "📍 Lavaterstrasse 2, 1220 Wien",
        policyLabel: "Stornierungsbedingungen",
        policy: policyDE,
      }
    : {
        title: titles[type].en,
        hello: `Hi ${name},`,
        body: bodies[type].en,
        address: "📍 Lavaterstrasse 2, 1220 Vienna",
        policyLabel: "Cancellation policy",
        policy: policyEN,
      };

  const subject = L.title;

  const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#ffffff;">
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;background:#0f0f0f;color:#f5f0e8;padding:32px;border-radius:16px;text-align:center;">

      <h2 style="color:#C9A46E;font-size:24px;margin:0 0 8px;font-weight:700;text-align:center;">${L.title}</h2>
      <p style="color:#bbb;margin:0 0 20px;font-size:14px;text-align:center;">${L.hello}</p>

      <div style="background:#1a1a1a;border-radius:12px;padding:20px;border:1px solid #2a2a2a;margin-bottom:20px;text-align:center;">
        <p style="margin:0;line-height:1.7;font-size:15px;color:#f5f0e8;text-align:center;">${L.body}</p>
        <p style="color:#bbb;margin:14px 0 0;font-size:13px;text-align:center;">${L.address}</p>
      </div>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:14px 16px;margin-bottom:20px;text-align:center;">
        <p style="margin:0;color:#C9A46E;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;text-align:center;">${L.policyLabel}</p>
        <p style="margin:8px 0 0;color:#cfcfcf;font-size:12px;line-height:1.6;text-align:center;">${L.policy}</p>
      </div>

      <p style="color:#E8C48A;font-size:13px;font-weight:600;margin:0;text-align:center;">+43 664 4686073</p>
      <p style="color:#777;font-size:11px;margin:14px 0 0;text-align:center;">© 2026 Sitdown Wien</p>
    </div>
  </body></html>`;

  return { subject, html };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Allow either service-role (cron) or an authenticated admin user
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  let authorized = false;
  if (token && token === SERVICE_ROLE_KEY) {
    authorized = true;
  } else if (token) {
    try {
      const sbUser = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims } = await sbUser.auth.getClaims(token);
      const uid = claims?.claims?.sub;
      if (uid) {
        const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { data: isAdmin } = await sbAdmin.rpc("has_role", { _user_id: uid, _role: "admin" });
        if (isAdmin === true) authorized = true;
      }
    } catch (_) { /* fall through */ }
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Load settings
  const { data: settings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!settings?.email_reminders) {
    return new Response(JSON.stringify({ skipped: "email reminders disabled" }), { headers: corsHeaders });
  }

  const now = new Date();

  // Fetch all confirmed upcoming bookings (no FK between bookings.user_id and profiles.user_id,
  // so we fetch profiles separately and merge client-side)
  const todayStr = now.toISOString().split("T")[0];
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .gte("booking_date", todayStr);

  if (error || !bookings) {
    return new Response(JSON.stringify({ error: "Failed to fetch bookings" }), { status: 500, headers: corsHeaders });
  }

  const userIds = Array.from(new Set((bookings as Booking[]).map(b => b.user_id).filter(Boolean)));
  const profilesById: Record<string, { email: string | null; full_name: string | null; language: "de" | "en" }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, language")
      .in("user_id", userIds);
    for (const p of profiles || []) {
      profilesById[p.user_id] = {
        email: p.email,
        full_name: p.full_name,
        language: (p.language === "en" ? "en" : "de"),
      };
    }
  }

  let sent = 0;
  const results: string[] = [];

  async function sendEmail(email: string, subject: string, html: string) {
    const r = await sendGmail({ to: email, subject, html });
    return r.ok;
  }

  for (const booking of bookings as Booking[]) {
    const profile = profilesById[booking.user_id];
    const email = profile?.email;
    if (!email) continue;

    const name = profile?.full_name || email.split("@")[0];

    // Build appointment datetime (Vienna timezone offset = +1h or +2h — use simple UTC+1)
    const [h, m] = booking.booking_time.split(":").map(Number);
    const appt = new Date(`${booking.booking_date}T${booking.booking_time}:00+01:00`);
    const diffMs = appt.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const dateDE = new Date(booking.booking_date).toLocaleDateString("de-AT", {
      day: "numeric", month: "long", weekday: "long",
    });
    const dateEN = new Date(booking.booking_date).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", weekday: "long",
    });

    // 7d reminder
    if (settings.reminder_7d && !booking.reminder_sent_7d && diffHours >= 156 && diffHours <= 180) {
      const { subject, html } = buildReminderEmail(name, booking.service_name, booking.barber_name, dateDE, dateEN, booking.booking_time, "7d", profile.language);
      const ok = await sendEmail(email, subject, html);
      if (ok) {
        await supabase.from("bookings").update({ reminder_sent_7d: true }).eq("id", booking.id);
        sent++; results.push(`7d → ${email}`);
      }
    }

    // 24h reminder
    if (settings.reminder_24h && !booking.reminder_sent_24h && diffHours >= 23 && diffHours <= 25) {
      const { subject, html } = buildReminderEmail(name, booking.service_name, booking.barber_name, dateDE, dateEN, booking.booking_time, "24h", profile.language);
      const ok = await sendEmail(email, subject, html);
      if (ok) {
        await supabase.from("bookings").update({ reminder_sent_24h: true }).eq("id", booking.id);
        sent++; results.push(`24h → ${email}`);
      }
    }

    // 5h reminder
    if (settings.reminder_5h && !booking.reminder_sent_5h && diffHours >= 4.5 && diffHours <= 5.5) {
      const { subject, html } = buildReminderEmail(name, booking.service_name, booking.barber_name, dateDE, dateEN, booking.booking_time, "5h", profile.language);
      const ok = await sendEmail(email, subject, html);
      if (ok) {
        await supabase.from("bookings").update({ reminder_sent_5h: true }).eq("id", booking.id);
        sent++; results.push(`5h → ${email}`);
      }
    }

    // 2h reminder
    if (settings.reminder_2h && !booking.reminder_sent_2h && diffHours >= 1.5 && diffHours <= 2.5) {
      const { subject, html } = buildReminderEmail(name, booking.service_name, booking.barber_name, dateDE, dateEN, booking.booking_time, "2h", profile.language);
      const ok = await sendEmail(email, subject, html);
      if (ok) {
        await supabase.from("bookings").update({ reminder_sent_2h: true }).eq("id", booking.id);
        sent++;
        results.push(`2h → ${email}`);
      }
    }
  }

  return new Response(JSON.stringify({ sent, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
