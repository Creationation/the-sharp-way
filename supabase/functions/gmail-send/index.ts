import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  GATEWAY_BASE,
  gatewayHeaders,
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

function utf8ToB64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64UrlEncode(input: string): string {
  return utf8ToB64(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function cleanHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildRaw(body: SendBody): string {
  const text = body.body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = [
    `From: ${cleanHeader(body.from || DEFAULT_FROM)}`,
    `To: ${cleanHeader(body.to)}`,
    body.cc ? `Cc: ${cleanHeader(body.cc)}` : null,
    body.bcc ? `Bcc: ${cleanHeader(body.bcc)}` : null,
    `Subject: =?UTF-8?B?${utf8ToB64(cleanHeader(body.subject))}?=`,
    body.inReplyTo ? `In-Reply-To: ${cleanHeader(body.inReplyTo)}` : null,
    body.references ? `References: ${cleanHeader(body.references)}` : null,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
  ].filter(Boolean);
  return lines.join("\r\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body: SendBody = await req.json();
    body.body = body.body?.trim() ?? "";
    if (!body.to || !body.subject || !body.body) {
      return new Response(JSON.stringify({ error: "Missing to/subject/body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = b64UrlEncode(buildRaw(body));
    const payload: Record<string, unknown> = { raw };
    if (body.threadId) payload.threadId = body.threadId;

    const headers = gatewayHeaders();
    const r = await fetch(`${GATEWAY_BASE}/users/me/messages/send`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `Gmail send failed [${r.status}]: ${t}` }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    return new Response(JSON.stringify({ success: true, id: data.id, threadId: data.threadId }), {
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
