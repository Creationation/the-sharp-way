import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOP_EMAIL = "info@ugcpanel.app";
const BRAND = "#C9A46E";
const BG = "#0D0D0D";
const SURFACE = "#161616";
const TEXT = "#F5F0E8";
const MUTED = "#8A8A8A";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message, lang } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (String(name).length > 100 || String(email).length > 255 || String(message).length > 2000) {
      return new Response(JSON.stringify({ error: "Input too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(String(email))) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isDE = lang === "de";
    const subject = isDE
      ? `Neue Nachricht · ${name}`
      : `New message · ${name}`;

    const html = `<!DOCTYPE html><html><body style="margin:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:${TEXT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:${SURFACE};border:1px solid #262626;border-radius:16px;overflow:hidden;">
<tr><td style="padding:24px 28px;border-bottom:1px solid #262626;">
<div style="font-size:11px;letter-spacing:3px;color:${BRAND};font-weight:600;">SITDOWN WIEN · ${isDE ? "KONTAKT" : "CONTACT"}</div>
<div style="font-size:20px;color:${TEXT};margin-top:6px;font-weight:600;">${escapeHtml(subject)}</div>
</td></tr>
<tr><td style="padding:24px 28px;">
<div style="font-size:13px;color:${MUTED};margin-bottom:4px;">${isDE ? "Name" : "Name"}</div>
<div style="font-size:15px;color:${TEXT};margin-bottom:16px;">${escapeHtml(name)}</div>
<div style="font-size:13px;color:${MUTED};margin-bottom:4px;">Email</div>
<div style="font-size:15px;color:${TEXT};margin-bottom:16px;"><a href="mailto:${escapeHtml(email)}" style="color:${BRAND};text-decoration:none;">${escapeHtml(email)}</a></div>
${phone ? `<div style="font-size:13px;color:${MUTED};margin-bottom:4px;">${isDE ? "Telefon" : "Phone"}</div>
<div style="font-size:15px;color:${TEXT};margin-bottom:16px;">${escapeHtml(String(phone))}</div>` : ""}
<div style="font-size:13px;color:${MUTED};margin-bottom:4px;">${isDE ? "Nachricht" : "Message"}</div>
<div style="font-size:15px;color:${TEXT};line-height:1.6;white-space:pre-wrap;background:${BG};border:1px solid #262626;border-radius:12px;padding:14px 16px;">${escapeHtml(message)}</div>
</td></tr>
</table>
</td></tr></table></body></html>`;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sitdown Wien <info@ugcpanel.app>",
        to: [SHOP_EMAIL],
        reply_to: email,
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
