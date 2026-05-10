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

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("[telegram] API error:", JSON.stringify(result));
      throw new Error(`Telegram API failed [${response.status}]`);
    }

    return new Response(JSON.stringify({ ok: true }), {
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
