import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  GATEWAY_BASE,
  gatewayHeaders,
  requireAdmin,
} from "../_shared/gmail-auth.ts";

interface ListBody {
  q?: string;
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
}

function decodeHeader(name: string, headers: Array<{ name: string; value: string }>) {
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body: ListBody = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const params = new URLSearchParams();
    params.set("maxResults", String(body.maxResults ?? 30));
    if (body.q) params.set("q", body.q);
    if (body.pageToken) params.set("pageToken", body.pageToken);
    if (body.labelIds?.length) {
      for (const l of body.labelIds) params.append("labelIds", l);
    }

    const headers = gatewayHeaders();
    const listRes = await fetch(
      `${GATEWAY_BASE}/users/me/messages?${params.toString()}`,
      { headers },
    );
    if (!listRes.ok) {
      const t = await listRes.text();
      return new Response(
        JSON.stringify({ error: `Gmail list failed [${listRes.status}]: ${t}` }),
        { status: listRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const listData = await listRes.json();
    const ids: Array<{ id: string; threadId: string }> = listData.messages ?? [];

    // Fetch metadata for each message in parallel
    const messages = await Promise.all(
      ids.map(async (m) => {
        const r = await fetch(
          `${GATEWAY_BASE}/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`,
          { headers },
        );
        if (!r.ok) return null;
        const d = await r.json();
        const h = d.payload?.headers ?? [];
        return {
          id: d.id,
          threadId: d.threadId,
          snippet: d.snippet ?? "",
          from: decodeHeader("From", h),
          to: decodeHeader("To", h),
          subject: decodeHeader("Subject", h),
          date: decodeHeader("Date", h),
          internalDate: d.internalDate,
          labelIds: d.labelIds ?? [],
          unread: (d.labelIds ?? []).includes("UNREAD"),
        };
      }),
    );

    return new Response(
      JSON.stringify({
        messages: messages.filter(Boolean),
        nextPageToken: listData.nextPageToken ?? null,
        resultSizeEstimate: listData.resultSizeEstimate ?? 0,
      }),
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
