import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { sendGmail } from "../_shared/gmail-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://sitdownvienna.lovable.app/sitdown-logo.png";
const SHOP_ADDRESS = "Lavaterstrasse 2 · 1220 Wien";
const SHOP_PHONE = "+43 664 4686073";
const BRAND_COLOR = "#C9A46E";
const BG_DARK = "#0D0D0D";
const SURFACE = "#161616";
const BORDER = "#262626";
const TEXT = "#F5F0E8";
const MUTED = "#8A8A8A";

type UpdateType = "rescheduled" | "reassigned" | "duration" | "cancelled";

interface Payload {
  booking_id: string;
  changes: {
    date?: boolean;
    time?: boolean;
    barber?: boolean;
    duration?: boolean;
    cancelled?: boolean;
  };
  new_values: {
    date?: string;   // yyyy-MM-dd
    time?: string;   // HH:mm
    barber?: string;
    duration?: string;
  };
}

function formatDateDE(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function buildEmail(opts: {
  name: string;
  title: string;
  intro: string;
  rows: Array<{ label: string; value: string }>;
  outro?: string;
}) {
  const rowsHtml = opts.rows
    .map(
      (r, i, arr) => `
        <tr>
          <td style="color:${MUTED};font-size:12px;padding:6px 0${i === arr.length - 1 ? " 4px" : ""};text-transform:uppercase;letter-spacing:0.5px;">${r.label}</td>
          <td align="right" style="color:${TEXT};font-size:14px;font-weight:600;padding:6px 0${i === arr.length - 1 ? " 4px" : ""};">${r.value}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.title}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:${BG_DARK};border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
        <tr><td align="center" style="padding:36px 32px 16px;background:${BG_DARK};">
          <img src="${LOGO_URL}" alt="Sitdown Wien" width="140" style="display:block;width:140px;height:auto;" />
        </td></tr>
        <tr><td style="padding:8px 36px 4px;">
          <h1 style="margin:0;color:${TEXT};font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.25;">${opts.title}</h1>
          <p style="margin:8px 0 0;color:${MUTED};font-size:14px;line-height:1.5;">${opts.intro}</p>
        </td></tr>
        ${
          opts.rows.length
            ? `<tr><td style="padding:24px 28px 8px;">
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};border:1px solid ${BORDER};border-radius:14px;">
                   <tr><td style="padding:18px 20px;">
                     <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
                   </td></tr>
                 </table>
               </td></tr>`
            : ""
        }
        ${
          opts.outro
            ? `<tr><td style="padding:18px 36px 8px;">
                 <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;">${opts.outro}</p>
               </td></tr>`
            : ""
        }
        <tr><td style="padding:24px 36px 32px;border-top:1px solid ${BORDER};margin-top:8px;">
          <p style="margin:16px 0 4px;color:${BRAND_COLOR};font-size:13px;font-weight:600;">Bis bald · Sitdown Wien</p>
          <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">${SHOP_ADDRESS}<br/>${SHOP_PHONE}</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;color:#999;font-size:11px;">© ${new Date().getFullYear()} Sitdown Wien</p>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as Payload;
    if (!payload.booking_id) {
      return new Response(JSON.stringify({ error: "Missing booking_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking, error: bErr } = await sb
      .from("bookings")
      .select("id, user_id, service_name, barber_name, booking_date, booking_time, service_duration")
      .eq("id", payload.booking_id)
      .maybeSingle();

    if (bErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    const email = profile?.email?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const name = profile?.full_name?.split(" ")[0] || "du";
    const isCancel = !!payload.changes.cancelled;

    // Effective final values (prefer new values, fall back to current booking)
    const dateVal = payload.new_values.date || booking.booking_date;
    const timeVal = (payload.new_values.time || booking.booking_time || "").substring(0, 5);
    const barberVal = payload.new_values.barber || booking.barber_name;
    const durationVal = payload.new_values.duration || booking.service_duration;

    let subject = "";
    let title = "";
    let intro = "";
    let rows: Array<{ label: string; value: string }> = [];
    let outro: string | undefined;

    if (isCancel) {
      subject = "Dein Termin bei Sitdown wurde storniert";
      title = "Termin storniert";
      intro = `Hey ${name}, dein Termin bei Sitdown am ${formatDateDE(booking.booking_date)} um ${(booking.booking_time || "").substring(0, 5)} Uhr wurde leider storniert. Melde dich gerne für einen neuen Termin.`;
      rows = [
        { label: "Service", value: booking.service_name || "–" },
        { label: "Datum", value: formatDateDE(booking.booking_date) },
        { label: "Uhrzeit", value: (booking.booking_time || "").substring(0, 5) },
      ];
    } else {
      const parts: string[] = [];
      if (payload.changes.date || payload.changes.time) parts.push("verschoben");
      if (payload.changes.barber) parts.push("einem anderen Mitarbeiter zugewiesen");
      if (payload.changes.duration) parts.push("in der Dauer angepasst");

      if (parts.length === 0) {
        return new Response(JSON.stringify({ ok: true, skipped: "no_changes" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      subject = "Dein Termin bei Sitdown wurde aktualisiert";
      title = "Termin aktualisiert";

      if (payload.changes.date || payload.changes.time) {
        intro = `Hey ${name}, dein Termin bei Sitdown wurde auf den ${formatDateDE(dateVal)} um ${timeVal} Uhr verschoben. Bis bald!`;
        subject = "Dein Termin bei Sitdown wurde verschoben";
      } else if (payload.changes.barber) {
        intro = `Hey ${name}, dein Termin bei Sitdown wurde ${barberVal} zugewiesen. Bis bald!`;
      } else {
        intro = `Hey ${name}, die Dauer deines Termins bei Sitdown wurde angepasst. Bis bald!`;
      }

      rows = [
        { label: "Service", value: booking.service_name || "–" },
        { label: "Barbier", value: barberVal || "–" },
        { label: "Datum", value: formatDateDE(dateVal) },
        { label: "Uhrzeit", value: timeVal },
        { label: "Dauer", value: durationVal || "–" },
      ];
      outro = "Falls die neue Zeit nicht passt, melde dich gerne bei uns.";
    }

    const html = buildEmail({ name, title, intro, rows, outro });

    const result = await sendGmail({ to: email, subject, html });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.ok ? 200 : 500,
    });
  } catch (err) {
    console.error("[send-booking-update] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
