import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!CHAT_ID) throw new Error("TELEGRAM_CHAT_ID is not configured");
    const CHAT_ID_2 = Deno.env.get("TELEGRAM_CHAT_ID_2");
    const CHAT_IDS = [CHAT_ID, CHAT_ID_2].filter((id): id is string => !!id && id.trim().length > 0);

    const { type, data } = await req.json();

    let text = "";

    if (type === "new_booking") {
      text = [
        "✂️ <b>Neuer Termin gebucht!</b>",
        "",
        `👤 ${data.client_name || "–"}`,
        `📧 ${data.client_email || "–"}`,
        `📱 ${data.client_phone || "–"}`,
        `💇 ${data.service_name || "–"} — ${data.service_price || "–"}`,
        `🧔 Barber: ${data.barber_name || "–"}`,
        `📅 ${data.booking_date || "–"} um ${data.booking_time || "–"}`,
        `💳 Karte hinterlegt (5€ Anzahlung)`,
        data.notes ? `\n📝 Notizen: ${data.notes}` : "",
      ].filter(Boolean).join("\n");
    } else if (type === "cancellation") {
      const hoursLabel = typeof data.hours_until === "number"
        ? `${data.hours_until}h vor Termin`
        : null;

      let chargeInfo: string;
      if (data.already_charged) {
        chargeInfo = "💰 5€ Kaution einbehalten · bereits abgebucht (nicht erstattbar · <24h)";
      } else if (data.charged) {
        chargeInfo = "💰 5€ Kaution einbehalten · jetzt abgebucht (nicht erstattbar · <24h)";
      } else if (data.payment_status === "released") {
        chargeInfo = "💰 Keine Gebühr · Karte freigegeben (>24h vorher)";
      } else {
        chargeInfo = "💰 Keine Gebühr";
      }

      text = [
        "❌ <b>Termin storniert</b>",
        "",
        `👤 ${data.client_name || "–"}`,
        `💇 ${data.service_name || "–"} — ${data.service_price || "–"}`,
        `🧔 Barber: ${data.barber_name || "–"}`,
        `📅 ${data.booking_date || "–"} um ${data.booking_time || "–"}`,
        hoursLabel ? `⏱ ${hoursLabel}` : "",
        chargeInfo,
      ].filter(Boolean).join("\n");
    } else {
      throw new Error("Unknown notification type");
    }

    const results = await Promise.allSettled(
      CHAT_IDS.map(async (chatId) => {
        const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TELEGRAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          console.error(`[telegram] API error for chat ${chatId}:`, JSON.stringify(result));
          throw new Error(`Telegram API failed [${response.status}] for chat ${chatId}`);
        }
        return result;
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (sent === 0) {
      throw new Error("All Telegram recipients failed");
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, recipients: CHAT_IDS.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[telegram] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
