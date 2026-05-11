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
    await sendLovableEmail(
      {
        to: cleanHeader(body.to),
        from: cleanHeader(body.from || DEFAULT_FROM),
        sender_domain: SENDER_DOMAIN,
        subject: cleanHeader(body.subject),
        html: `<div style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(text)}</div>`,
        text,
        purpose: "transactional",
        label: "admin-reply",
        idempotency_key: crypto.randomUUID(),
      },
      { apiKey },
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
