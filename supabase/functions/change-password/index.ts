import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { sendGmail } from "../_shared/gmail-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function buildEmail(lang: string, name: string, when: string) {
  const de = lang !== "en";
  const title = de ? "Dein Passwort wurde geändert" : "Your password has been changed";
  const intro = de
    ? `Hallo ${name}, das Passwort deines Sitdown Vienna Kontos wurde soeben geändert.`
    : `Hi ${name}, the password for your Sitdown Vienna account was just changed.`;
  const warn = de
    ? "Warst du das nicht? Setze dein Passwort sofort über „Passwort vergessen“ zurück und kontaktiere uns unter hello@sitdownvienna.app."
    : "Wasn't you? Reset your password immediately via \"Forgot password\" and contact us at hello@sitdownvienna.app.";
  const label = de ? "Zeitpunkt" : "Time";

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
    <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f0f0f;color:#f5f0e8;padding:32px;border-radius:16px;">
      <h2 style="color:#b8935a;margin:0 0 12px;">🔐 ${title}</h2>
      <p style="font-size:14px;line-height:1.6;">${intro}</p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:14px;font-size:13px;">
        <strong style="color:#b8935a;">${label}:</strong> ${when}
      </div>
      <p style="font-size:13px;line-height:1.6;color:#c9c2b6;margin-top:16px;">${warn}</p>
      <p style="color:#333;font-size:11px;margin-top:24px;">© 2026 Sitdown Vienna · Lavaterstraße 2, 1220 Wien</p>
    </div>
  </body></html>`;

  return { subject: de ? "🔐 Passwort geändert · Sitdown Vienna" : "🔐 Password changed · Sitdown Vienna", html };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 300) || null;

  let userId: string | null = null;
  let email = "";

  const log = async (status: string, reason?: string) => {
    if (!userId) return;
    await admin.from("password_change_log").insert({
      user_id: userId,
      email,
      status,
      reason: reason ?? null,
      ip_address: ip,
      user_agent: userAgent,
    });
  };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user?.email) return json({ error: "Unauthorized" }, 401);

    userId = user.id;
    email = user.email;

    const body = await req.json().catch(() => ({}));
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const lang = body.lang === "en" ? "en" : "de";

    if (newPassword.length < 8) {
      await log("failed", "weak_password");
      return json({
        error: lang === "en"
          ? "The new password must be at least 8 characters long."
          : "Das neue Passwort muss mindestens 8 Zeichen lang sein.",
      }, 400);
    }
    if (currentPassword === newPassword) {
      await log("failed", "same_password");
      return json({
        error: lang === "en"
          ? "The new password must differ from the current one."
          : "Das neue Passwort muss sich vom aktuellen unterscheiden.",
      }, 400);
    }

    // Re-authenticate with the current password
    const checkClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { error: signInError } = await checkClient.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      await log("failed", "wrong_current_password");
      return json({
        error: lang === "en" ? "Current password is incorrect." : "Aktuelles Passwort ist falsch.",
      }, 400);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (updateError) {
      await log("failed", updateError.message.slice(0, 200));
      return json({ error: updateError.message }, 400);
    }

    await log("success");

    // Security notification email (best effort — never blocks the change)
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name, language")
        .eq("user_id", user.id)
        .maybeSingle();

      const when = new Date().toLocaleString(lang === "en" ? "en-GB" : "de-AT", {
        timeZone: "Europe/Vienna",
        dateStyle: "medium",
        timeStyle: "short",
      });
      const { subject, html } = buildEmail(
        (profile?.language as string) || lang,
        profile?.full_name || email.split("@")[0],
        when,
      );
      await sendGmail({ to: email, subject, html });
    } catch (mailErr) {
      console.error("[change-password] notification email failed", mailErr);
    }

    return json({ success: true });
  } catch (e) {
    console.error("[change-password] error", e);
    await log("failed", (e as Error).message?.slice(0, 200));
    return json({ error: (e as Error).message }, 500);
  }
});
