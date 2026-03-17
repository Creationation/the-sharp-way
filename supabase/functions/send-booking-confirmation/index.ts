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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: BookingPayload = await req.json();
    const { email, name, service, barber, date, time, price, lang } = payload;

    const isDE = lang === "de";

    const subject = isDE
      ? `Buchungsbestätigung — ${service} mit ${barber}`
      : `Booking Confirmed — ${service} with ${barber}`;

    const html = isDE ? `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; background: #0f0f0f; color: #f5f0e8; padding: 32px; border-radius: 16px;">
        <h1 style="color: #b8935a; font-size: 28px; margin-bottom: 4px;">Dein Termin ist bestätigt ✂️</h1>
        <p style="color: #888; margin-bottom: 24px;">Hallo ${name}, wir freuen uns auf deinen Besuch.</p>
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #2a2a2a;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Service</td><td style="color: #f5f0e8; text-align: right; font-weight: 600;">${service}</td></tr>
            <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Barbier</td><td style="color: #f5f0e8; text-align: right;">${barber}</td></tr>
            <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Datum</td><td style="color: #f5f0e8; text-align: right;">${date}</td></tr>
            <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Uhrzeit</td><td style="color: #f5f0e8; text-align: right;">${time}</td></tr>
            <tr style="border-top: 1px solid #2a2a2a;">
              <td style="color: #f5f0e8; padding: 12px 0 0; font-weight: 700;">Gesamt</td>
              <td style="color: #b8935a; text-align: right; font-size: 20px; font-weight: 700; padding: 12px 0 0;">${price}</td>
            </tr>
          </table>
        </div>
        <p style="color: #888; font-size: 12px;">Kostenlose Stornierung bis 2 Stunden vor dem Termin.</p>
        <p style="color: #888; font-size: 12px; margin-top: 8px;">Lavaterstrasse 2, 1220 Wien · +43 664 4686073</p>
        <p style="color: #444; font-size: 11px; margin-top: 24px;">© 2026 The Sharp Cut</p>
      </div>
    </body></html>` : `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; background: #0f0f0f; color: #f5f0e8; padding: 32px; border-radius: 16px;">
        <h1 style="color: #b8935a; font-size: 28px; margin-bottom: 4px;">You're Booked ✂️</h1>
        <p style="color: #888; margin-bottom: 24px;">Hi ${name}, we can't wait to see you.</p>
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #2a2a2a;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Service</td><td style="color: #f5f0e8; text-align: right; font-weight: 600;">${service}</td></tr>
            <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Barber</td><td style="color: #f5f0e8; text-align: right;">${barber}</td></tr>
            <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Date</td><td style="color: #f5f0e8; text-align: right;">${date}</td></tr>
            <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Time</td><td style="color: #f5f0e8; text-align: right;">${time}</td></tr>
            <tr style="border-top: 1px solid #2a2a2a;">
              <td style="color: #f5f0e8; padding: 12px 0 0; font-weight: 700;">Total</td>
              <td style="color: #b8935a; text-align: right; font-size: 20px; font-weight: 700; padding: 12px 0 0;">${price}</td>
            </tr>
          </table>
        </div>
        <p style="color: #888; font-size: 12px;">Free cancellation up to 2 hours before your appointment.</p>
        <p style="color: #888; font-size: 12px; margin-top: 8px;">Lavaterstrasse 2, 1220 Wien · +43 664 4686073</p>
        <p style="color: #444; font-size: 11px; margin-top: 24px;">© 2026 The Sharp Cut</p>
      </div>
    </body></html>`;

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
        from: "The Sharp Cut <info@ugcpanel.app>",
        to: [email],
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
