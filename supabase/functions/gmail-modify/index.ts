import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  GATEWAY_BASE,
  gatewayHeaders,
  requireAdmin,
} from "../_shared/gmail-auth.ts";

interface ModifyBody {
  id: string;
  action: "markRead" | "markUnread" | "archive" | "trash" | "untrash";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body: ModifyBody = await req.json();
    if (!body.id || !body.action) {
      return new Response(JSON.stringify({ error: "Missing id/action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = gatewayHeaders();
    let path = "";
    let payload: Record<string, unknown> | null = null;

    switch (body.action) {
      case "markRead":
        path = `/users/me/messages/${body.id}/modify`;
        payload = { removeLabelIds: ["UNREAD"] };
        break;
      case "markUnread":
        path = `/users/me/messages/${body.id}/modify`;
        payload = { addLabelIds: ["UNREAD"] };
        break;
      case "archive":
        path = `/users/me/messages/${body.id}/modify`;
        payload = { removeLabelIds: ["INBOX"] };
        break;
      case "trash":
        path = `/users/me/messages/${body.id}/trash`;
        payload = null;
        break;
      case "untrash":
        path = `/users/me/messages/${body.id}/untrash`;
        payload = null;
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const r = await fetch(`${GATEWAY_BASE}${path}`, {
      method: "POST",
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `Gmail modify failed [${r.status}]: ${t}` }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
