import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendLovableEmail } from "npm:@lovable.dev/email-js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  corsHeaders,
  requireAdmin,
} from "../_shared/gmail-auth.ts";

interface SendBody {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  from?: string;
}

const DEFAULT_FROM = "Sitdown Vienna <hello@sitdownvienna.app>";
const SENDER_DOMAIN = "notify.sitdownvienna.app";

function cleanHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const body: SendBody = await req.json();
    body.body = body.body?.trim() ?? "";
    if (!body.to || !body.subject || !body.body) {
      return new Response(JSON.stringify({ error: "Missing to/subject/body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = body.body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Get or create unsubscribe token for this recipient (required by Lovable Email API)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const recipientEmail = cleanHeader(body.to).toLowerCase();
    let unsubscribeToken: string;
    const { data: existing } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", recipientEmail)
      .maybeSingle();
    if (existing?.token) {
      unsubscribeToken = existing.token;
    } else {
      unsubscribeToken = crypto.randomUUID();
      await supabase
        .from("email_unsubscribe_tokens")
        .insert({ email: recipientEmail, token: unsubscribeToken });
    }

    const messageId = crypto.randomUUID();
    const templateLabel = body.threadId ? "admin-reply" : "manual-message";

    // Log "pending" so the Verlauf tab shows the email immediately
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateLabel,
      recipient_email: recipientEmail,
      status: "pending",
    });

    try {
      await sendLovableEmail(
        {
          to: cleanHeader(body.to),
          from: cleanHeader(body.from || DEFAULT_FROM),
          sender_domain: SENDER_DOMAIN,
          subject: cleanHeader(body.subject),
          html: `<div style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(text)}</div>`,
          text,
          purpose: "transactional",
          label: templateLabel,
          idempotency_key: messageId,
          unsubscribe_token: unsubscribeToken,
        },
        { apiKey },
      );

      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateLabel,
        recipient_email: recipientEmail,
        status: "sent",
      });

      return new Response(JSON.stringify({ success: true, messageId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (sendErr) {
      const errMsg = sendErr instanceof Error ? sendErr.message : "Unknown send error";
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateLabel,
        recipient_email: recipientEmail,
        status: "failed",
        error_message: errMsg.slice(0, 500),
      });
      throw sendErr;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
