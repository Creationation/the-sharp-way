import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  date: string,
  time: string,
  type: ReminderType,
  lang: "de" | "en"
): { subject: string; html: string } {
  const isDE = lang === "de";

  const titles: Record<ReminderType, Record<"de" | "en", string>> = {
    "7d":  { de: "Dein Termin in 1 Woche ✂️",  en: "Your appointment in 1 week ✂️" },
    "24h": { de: "Dein Termin ist morgen ✂️",  en: "Your appointment is tomorrow ✂️" },
    "5h":  { de: "Dein Termin ist heute ✂️",   en: "Your appointment is today ✂️" },
    "2h":  { de: "Noch 2 Stunden! ✂️",         en: "2 hours to go! ✂️" },
  };

  const bodies: Record<ReminderType, Record<"de" | "en", string>> = {
    "7d": {
      de: `Kleine Erinnerung: in <strong>1 Woche</strong> · ${date} um <strong>${time}</strong> Uhr bei <strong>${barber}</strong> — <em>${service}</em>`,
      en: `Friendly reminder: in <strong>1 week</strong> · ${date} at <strong>${time}</strong> with <strong>${barber}</strong> — <em>${service}</em>`,
    },
    "24h": {
      de: `Vergiss deinen Termin nicht! Morgen um <strong>${time}</strong> Uhr bist du bei <strong>${barber}</strong> — <em>${service}</em>`,
      en: `Don't forget! Tomorrow at <strong>${time}</strong> with <strong>${barber}</strong> — <em>${service}</em>`,
    },
    "5h": {
      de: `Heute in 5 Stunden um <strong>${time}</strong> Uhr — <strong>${barber}</strong> erwartet dich für <em>${service}</em>`,
      en: `In 5 hours at <strong>${time}</strong> — <strong>${barber}</strong> is ready for your <em>${service}</em>`,
    },
    "2h": {
      de: `Nur noch 2 Stunden! Um <strong>${time}</strong> Uhr bei <strong>${barber}</strong> — <em>${service}</em>. Wir sehen uns!`,
      en: `Just 2 hours left! At <strong>${time}</strong> with <strong>${barber}</strong> — <em>${service}</em>. See you soon!`,
    },
  };

  const subject = titles[type][lang];
  const bodyText = bodies[type][lang];

  // For 7d & 24h, the user can still cancel free (>24h). For 5h & 2h, deposit is non-refundable.
  const stillFree = type === "7d" || type === "24h";
  const policyText = isDE
    ? stillFree
      ? "Kostenlose Stornierung bis 24 Std. vor dem Termin · danach werden 5 € Kaution einbehalten (nicht erstattbar)."
      : "Stornierung jetzt nicht mehr kostenlos möglich · die 5 € Kaution wird einbehalten und ist nicht erstattbar."
    : stillFree
      ? "Free cancellation up to 24h before · after that the €5 deposit is retained (non-refundable)."
      : "Cancellation is no longer free · the €5 deposit is retained and non-refundable.";

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f0f;color:#f5f0e8;padding:32px;border-radius:16px;">
      <h2 style="color:#b8935a;font-size:22px;margin-bottom:4px;">${subject}</h2>
      <p style="color:#888;margin-bottom:20px;">Hi ${name},</p>
      <div style="background:#1a1a1a;border-radius:12px;padding:20px;border:1px solid #2a2a2a;margin-bottom:16px;">
        <p style="margin:0;line-height:1.7;">${bodyText}</p>
        <p style="color:#888;margin:12px 0 0;font-size:13px;">📍 Lavaterstrasse 2, 1220 Wien</p>
      </div>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:14px 16px;margin-bottom:16px;">
        <p style="margin:0;color:#b8935a;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${isDE ? "Stornierungsbedingungen" : "Cancellation policy"}</p>
        <p style="margin:6px 0 0;color:#bbb;font-size:12px;line-height:1.6;">${policyText}</p>
      </div>
      <p style="color:#555;font-size:11px;">+43 664 4686073</p>
      <p style="color:#333;font-size:11px;margin-top:16px;">© 2026 Sitdown Wien</p>
    </div>
  </body></html>`;

  return { subject, html };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
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
  const profilesById: Record<string, { email: string | null; full_name: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);
    for (const p of profiles || []) {
      profilesById[p.user_id] = { email: p.email, full_name: p.full_name };
    }
  }

  let sent = 0;
  const results: string[] = [];

  async function sendEmail(email: string, subject: string, html: string) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Sitdown Wien <info@ugcpanel.app>", to: [email], subject, html }),
    });
    return res.ok;
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

    const dateFormatted = new Date(booking.booking_date).toLocaleDateString("de-AT", {
      day: "numeric", month: "long", weekday: "long",
    });

    // 7d reminder: send when 6.5d < diff < 7.5d (window of 1 day to be safe with cron cadence)
    if (settings.reminder_7d && !booking.reminder_sent_7d && diffHours >= 156 && diffHours <= 180) {
      const { subject, html } = buildReminderEmail(name, booking.service_name, booking.barber_name, dateFormatted, booking.booking_time, "7d", "de");
      const ok = await sendEmail(email, subject, html);
      if (ok) {
        await supabase.from("bookings").update({ reminder_sent_7d: true }).eq("id", booking.id);
        sent++;
        results.push(`7d → ${email}`);
      }
    }

    // 24h reminder: send when 23h < diff < 25h
    if (settings.reminder_24h && !booking.reminder_sent_24h && diffHours >= 23 && diffHours <= 25) {
      const { subject, html } = buildReminderEmail(name, booking.service_name, booking.barber_name, dateFormatted, booking.booking_time, "24h", "de");
      const ok = await sendEmail(email, subject, html);
      if (ok) {
        await supabase.from("bookings").update({ reminder_sent_24h: true }).eq("id", booking.id);
        sent++;
        results.push(`24h → ${email}`);
      }
    }

    // 5h reminder: send when 4.5h < diff < 5.5h
    if (settings.reminder_5h && !booking.reminder_sent_5h && diffHours >= 4.5 && diffHours <= 5.5) {
      const { subject, html } = buildReminderEmail(name, booking.service_name, booking.barber_name, dateFormatted, booking.booking_time, "5h", "de");
      const ok = await sendEmail(email, subject, html);
      if (ok) {
        await supabase.from("bookings").update({ reminder_sent_5h: true }).eq("id", booking.id);
        sent++;
        results.push(`5h → ${email}`);
      }
    }

    // 2h reminder: send when 1.5h < diff < 2.5h
    if (settings.reminder_2h && !booking.reminder_sent_2h && diffHours >= 1.5 && diffHours <= 2.5) {
      const { subject, html } = buildReminderEmail(name, booking.service_name, booking.barber_name, dateFormatted, booking.booking_time, "2h", "de");
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
