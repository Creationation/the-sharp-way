import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  GATEWAY_BASE,
  gatewayHeaders,
  requireAdmin,
} from "../_shared/gmail-auth.ts";

function decodeHeader(name: string, headers: Array<{ name: string; value: string }>) {
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

function b64UrlDecode(input: string): string {
  const pad = input.length % 4;
  const padded = input + "=".repeat(pad ? 4 - pad : 0);
  const std = padded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const bytes = Uint8Array.from(atob(std), (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function extractBodies(payload: any): { html: string; text: string } {
  let html = "";
  let text = "";
  const walk = (part: any) => {
    if (!part) return;
    const mime = part.mimeType ?? "";
    const data = part.body?.data;
    if (data) {
      if (mime === "text/html" && !html) html = b64UrlDecode(data);
      else if (mime === "text/plain" && !text) text = b64UrlDecode(data);
    }
    if (Array.isArray(part.parts)) part.parts.forEach(walk);
  };
  walk(payload);
  return { html, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const id = body.id;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = gatewayHeaders();
    const r = await fetch(
      `${GATEWAY_BASE}/users/me/threads/${id}?format=full`,
      { headers },
    );
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `Gmail thread failed [${r.status}]: ${t}` }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const messages = (data.messages ?? []).map((m: any) => {
      const h = m.payload?.headers ?? [];
      const { html, text } = extractBodies(m.payload);
      return {
        id: m.id,
        threadId: m.threadId,
        snippet: m.snippet ?? "",
        from: decodeHeader("From", h),
        to: decodeHeader("To", h),
        cc: decodeHeader("Cc", h),
        subject: decodeHeader("Subject", h),
        date: decodeHeader("Date", h),
        internalDate: m.internalDate,
        messageIdHeader: decodeHeader("Message-ID", h),
        references: decodeHeader("References", h),
        labelIds: m.labelIds ?? [],
        unread: (m.labelIds ?? []).includes("UNREAD"),
        fromMe: (m.labelIds ?? []).includes("SENT"),
        html,
        text,
      };
    });

    return new Response(
      JSON.stringify({ id: data.id, messages }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
