import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { sendGmail } from "../_shared/gmail-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session.setup_intent) {
      return new Response(JSON.stringify({ verified: false, error: "No setup intent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent as string);
    if (setupIntent.status !== "succeeded") {
      return new Response(JSON.stringify({ verified: false, status: setupIntent.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentMethodId = setupIntent.payment_method as string;
    const customerId = session.customer as string;
    const meta = session.metadata || {};

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Save booking
    const { data: booking, error: insertErr } = await sb.from("bookings").insert({
      user_id: meta.user_id,
      barber_name: meta.barber_name || "",
      service_name: meta.service_name || "",
      service_price: meta.service_price || "",
      service_duration: meta.service_duration || "",
      booking_date: meta.booking_date || "",
      booking_time: meta.booking_time || "",
      status: "confirmed",
      payment_status: "verified",
      stripe_customer_id: customerId,
      stripe_payment_method_id: paymentMethodId,
      setup_intent_id: setupIntent.id,
      notes: meta.notes || null,
    }).select().single();

    if (insertErr) {
      console.error("[verify-setup] Insert error:", insertErr);
      throw new Error("Failed to save booking");
    }

    // If appointment is less than 24h away, charge the 5€ deposit immediately
    // (the daily cron only catches bookings made before its run; same-day or <24h
    // bookings would otherwise never be charged).
    try {
      const apptDate = new Date(`${meta.booking_date}T${meta.booking_time || "10:00"}:00`);
      const hoursUntil = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 24 && booking) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 500,
          currency: "eur",
          customer: customerId,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          metadata: {
            booking_id: (booking as any).id,
            charge_type: "immediate_deposit_under_24h",
          },
        });
        if (paymentIntent.status === "succeeded") {
          await sb.from("bookings")
            .update({ payment_status: "charged" })
            .eq("id", (booking as any).id);
        }
      }
    } catch (chargeErr: any) {
      console.error("[verify-setup] Immediate deposit charge failed:", chargeErr);
    }

    // Increment promo code usage if applicable
    if (meta.promo_code) {
      await sb.rpc("use_promo_code", { _code: meta.promo_code }).catch(() => {});
    }

    // Send confirmation email
    if (meta.client_email && booking) {
      await sb.functions.invoke("send-booking-confirmation", {
        body: {
          email: meta.client_email,
          name: meta.client_name || meta.client_email.split("@")[0],
          service: meta.service_name,
          barber: meta.barber_name,
          date: meta.booking_date,
          time: meta.booking_time,
          price: meta.service_price,
          lang: "de",
        },
      }).catch((err: any) => console.error("[verify-setup] Email error:", err));
    }

    // Admin notification email (always sent — uses Gmail connector, no key check needed)
    {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
        <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f0f0f;color:#f5f0e8;padding:32px;border-radius:16px;">
          <h2 style="color:#b8935a;margin-bottom:4px;">✂️ Neuer Termin gebucht</h2>
          <p style="color:#888;font-size:13px;margin-bottom:20px;">Karte verifiziert — 5€ Reservierungsgebühr wird am Termintag abgebucht.</p>
          <div style="background:#1a1a1a;border-radius:12px;padding:16px;border:1px solid #2a2a2a;">
            <table style="width:100%;font-size:13px;line-height:2;">
              <tr><td style="color:#b8935a;">Kunde</td><td style="text-align:right;">${meta.client_name || "–"}</td></tr>
              <tr><td style="color:#b8935a;">E-Mail</td><td style="text-align:right;">${meta.client_email || "–"}</td></tr>
              <tr><td style="color:#b8935a;">Telefon</td><td style="text-align:right;">${meta.client_phone || "–"}</td></tr>
              <tr><td style="color:#b8935a;">Service</td><td style="text-align:right;">${meta.service_name || "–"}</td></tr>
              <tr><td style="color:#b8935a;">Preis</td><td style="text-align:right;">${meta.service_price || "–"}</td></tr>
              <tr><td style="color:#b8935a;">Barber</td><td style="text-align:right;">${meta.barber_name || "–"}</td></tr>
              <tr><td style="color:#b8935a;">Datum</td><td style="text-align:right;">${meta.booking_date || "–"}</td></tr>
              <tr><td style="color:#b8935a;">Uhrzeit</td><td style="text-align:right;">${meta.booking_time || "–"} Uhr</td></tr>
              <tr><td style="color:#b8935a;">Zahlung</td><td style="text-align:right;">Karte hinterlegt (5€ Anzahlung)</td></tr>
            </table>
          </div>
          ${meta.notes ? `<p style="color:#888;font-size:12px;margin-top:12px;">Notizen: ${meta.notes}</p>` : ""}
          <a href="https://sitdownvienna.lovable.app/admin"
             style="display:inline-block;margin-top:16px;background:linear-gradient(90deg,#b8935a,#d4a96a);color:#111;font-weight:700;font-size:13px;padding:12px 24px;border-radius:50px;text-decoration:none;">
            → Admin Dashboard öffnen
          </a>
          <p style="color:#333;font-size:11px;margin-top:20px;">© 2026 Sitdown Wien · Lavaterstraße 2, 1220 Wien</p>
        </div>
      </body></html>`;

      await sendGmail({
        to: "hello@sitdownvienna.app",
        subject: `✂️ Neuer Termin: ${meta.client_name} – ${meta.booking_date} ${meta.booking_time}`,
        html,
      }).catch(() => {});
    }

    // Send Telegram notification
    try {
      await sb.functions.invoke("send-telegram-notification", {
        body: {
          type: "new_booking",
          data: {
            client_name: meta.client_name || "–",
            client_email: meta.client_email || "–",
            client_phone: meta.client_phone || "–",
            service_name: meta.service_name || "–",
            service_price: meta.service_price || "–",
            barber_name: meta.barber_name || "–",
            booking_date: meta.booking_date || "–",
            booking_time: meta.booking_time || "–",
            notes: meta.notes || null,
          },
        },
      });
    } catch (tgErr: any) {
      console.error("[verify-setup] Telegram notification error:", tgErr);
    }

    return new Response(JSON.stringify({
      verified: true,
      payment_status: "verified",
      booking_id: (booking as any)?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[verify-setup] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
