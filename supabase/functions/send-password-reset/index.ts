import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

const buildEmail = (link: string, isDE: boolean) => {
  const L = isDE
    ? {
        title: "Passwort zurücksetzen",
        sub: "Wir haben eine Anfrage erhalten, dein Passwort zurückzusetzen. Klicke auf den Button, um ein neues Passwort festzulegen.",
        cta: "Passwort zurücksetzen",
        expire: "Der Link ist 60 Minuten lang gültig.",
        ignore: "Hast du das nicht angefragt? Ignoriere diese Nachricht einfach – dein Passwort bleibt unverändert.",
        seeYou: "Bis bald · Sitdown Wien",
      }
    : {
        title: "Reset your password",
        sub: "We received a request to reset your password. Click the button below to choose a new one.",
        cta: "Reset password",
        expire: "This link is valid for 60 minutes.",
        ignore: "Didn't request this? You can safely ignore this email — your password will stay the same.",
        seeYou: "See you soon · Sitdown Wien",
      };

  return `<!DOCTYPE html><html lang="${isDE ? "de" : "en"}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${L.title}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:${BG_DARK};border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);">

        <tr><td align="center" style="padding:36px 32px 16px;background:${BG_DARK};">
          <img src="${LOGO_URL}" alt="Sitdown Wien" width="140" style="display:block;width:140px;height:auto;" />
        </td></tr>

        <tr><td style="padding:8px 36px 4px;">
          <h1 style="margin:0;color:${TEXT};font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.25;">${L.title}</h1>
          <p style="margin:12px 0 0;color:${MUTED};font-size:14px;line-height:1.6;">${L.sub}</p>
        </td></tr>

        <tr><td align="center" style="padding:28px 36px 8px;">
          <a href="${link}" style="display:inline-block;background:${BRAND_COLOR};color:${BG_DARK};font-weight:700;font-size:14px;text-decoration:none;padding:14px 28px;border-radius:999px;letter-spacing:0.3px;">${L.cta}</a>
          <p style="margin:18px 0 0;color:${MUTED};font-size:12px;">${L.expire}</p>
        </td></tr>

        <tr><td style="padding:16px 36px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};border:1px solid ${BORDER};border-radius:12px;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0 0 6px;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Link</p>
              <p style="margin:0;color:${TEXT};font-size:11px;word-break:break-all;line-height:1.5;">${link}</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:18px 36px 8px;">
          <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">${L.ignore}</p>
        </td></tr>

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
    const { email, lang, redirectTo } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isDE = lang === "de";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a recovery link via Supabase Admin API.
    // If the email does not match any user, we still return 200 to avoid email enumeration.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirectTo || "https://sitdownvienna.lovable.app/reset-password",
      },
    });

    if (error || !data?.properties?.action_link) {
      console.warn("generateLink failed:", error?.message);
      // Silent success — no enumeration leak
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const html = buildEmail(data.properties.action_link, isDE);
    const subject = isDE ? "Sitdown Wien · Passwort zurücksetzen" : "Sitdown Wien · Reset your password";

    const result = await sendGmail({
      to: email,
      subject,
      html,
    });

    return new Response(JSON.stringify({ ok: result.ok, body: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.ok ? 200 : 500,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
