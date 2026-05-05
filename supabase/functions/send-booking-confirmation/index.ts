import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingPayload {
  email: string;
  name: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  price: string;
  lang: string;
}

const LOGO_URL = "https://sitdownvienna.lovable.app/sitdown-logo.png";
const SHOP_ADDRESS = "Lavaterstrasse 2 · 1220 Wien";
const SHOP_PHONE = "+43 664 4686073";
const BRAND_COLOR = "#C9A46E";
const BG_DARK = "#0D0D0D";
const SURFACE = "#161616";
const BORDER = "#262626";
const TEXT = "#F5F0E8";
const MUTED = "#8A8A8A";

const buildEmail = (p: BookingPayload, isDE: boolean) => {
  const L = isDE
    ? {
        title: "Dein Termin ist bestätigt",
        sub: `Hallo ${p.name}, wir freuen uns auf dich.`,
        service: "Service",
        barber: "Barbier",
        date: "Datum",
        time: "Uhrzeit",
        total: "Gesamt",
        policy: "Kostenlose Stornierung bis 24 Stunden vor dem Termin. Danach wird eine Gebühr von 5 € fällig.",
        seeYou: "Bis bald · Sitdown Wien",
      }
    : {
        title: "Your appointment is confirmed",
        sub: `Hi ${p.name}, we can't wait to see you.`,
        service: "Service",
        barber: "Barber",
        date: "Date",
        time: "Time",
        total: "Total",
        policy: "Free cancellation up to 24 hours before your appointment. A 5 € fee applies after that.",
        seeYou: "See you soon · Sitdown Wien",
      };

  return `<!DOCTYPE html><html lang="${isDE ? "de" : "en"}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${L.title}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:${BG_DARK};border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);">

        <!-- Logo header -->
        <tr><td align="center" style="padding:36px 32px 16px;background:${BG_DARK};">
          <img src="${LOGO_URL}" alt="Sitdown Wien" width="140" style="display:block;width:140px;height:auto;" />
        </td></tr>

        <!-- Title -->
        <tr><td style="padding:8px 36px 4px;">
          <h1 style="margin:0;color:${TEXT};font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.25;">${L.title}</h1>
          <p style="margin:8px 0 0;color:${MUTED};font-size:14px;line-height:1.5;">${L.sub}</p>
        </td></tr>

        <!-- Details card -->
        <tr><td style="padding:24px 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};border:1px solid ${BORDER};border-radius:14px;">
            <tr><td style="padding:18px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:${MUTED};font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">${L.service}</td>
                  <td align="right" style="color:${TEXT};font-size:14px;font-weight:600;padding:6px 0;">${p.service}</td>
                </tr>
                <tr>
                  <td style="color:${MUTED};font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">${L.barber}</td>
                  <td align="right" style="color:${TEXT};font-size:14px;padding:6px 0;">${p.barber}</td>
                </tr>
                <tr>
                  <td style="color:${MUTED};font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">${L.date}</td>
                  <td align="right" style="color:${TEXT};font-size:14px;padding:6px 0;">${p.date}</td>
                </tr>
                <tr>
                  <td style="color:${MUTED};font-size:12px;padding:6px 0 14px;text-transform:uppercase;letter-spacing:0.5px;">${L.time}</td>
                  <td align="right" style="color:${TEXT};font-size:14px;padding:6px 0 14px;">${p.time}</td>
                </tr>
                <tr><td colspan="2" style="border-top:1px solid ${BORDER};padding:0;"></td></tr>
                <tr>
                  <td style="color:${TEXT};font-size:14px;font-weight:700;padding:14px 0 0;">${L.total}</td>
                  <td align="right" style="color:${BRAND_COLOR};font-size:22px;font-weight:700;padding:14px 0 0;">${p.price}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Policy -->
        <tr><td style="padding:18px 36px 8px;">
          <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">${L.policy}</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 36px 32px;border-top:1px solid ${BORDER};margin-top:8px;">
          <p style="margin:16px 0 4px;color:${TEXT};font-size:13px;font-weight:600;">${L.seeYou}</p>
          <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">${SHOP_ADDRESS}<br/>${SHOP_PHONE}</p>
        </td></tr>

      </table>
      <p style="margin:16px 0 0;color:#999;font-size:11px;">© ${new Date().getFullYear()} Sitdown Wien</p>
    </td></tr>
  </table>
</body></html>`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: BookingPayload = await req.json();
    const isDE = payload.lang === "de";

    const subject = isDE
      ? `Buchungsbestätigung · ${payload.service} mit ${payload.barber}`
      : `Booking confirmed · ${payload.service} with ${payload.barber}`;

    const html = buildEmail(payload, isDE);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sitdown Wien <info@ugcpanel.app>",
        to: [payload.email],
        subject,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.ok ? 200 : 500,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
