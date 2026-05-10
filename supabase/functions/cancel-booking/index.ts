import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEPOSIT_AMOUNT_CENTS = 500; // 5€

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) throw new Error("User not authenticated");

    const { booking_id } = await req.json();
    if (!booking_id) throw new Error("Missing booking_id");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking, error: fetchErr } = await sb
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (fetchErr || !booking) throw new Error("Booking not found");

    // Authorization: user must own the booking OR be an admin
    const { data: roles } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = (roles || []).some((r: any) => r.role === "admin");
    if (booking.user_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.status === "cancelled") {
      return new Response(JSON.stringify({ cancelled: true, already_cancelled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const now = new Date();
    const apptDate = new Date(`${booking.booking_date}T${booking.booking_time || "10:00"}:00`);
    const hoursUntil = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let charged = false;
    let alreadyCharged = false;

    if (hoursUntil < 24) {
      // Less than 24h: 5€ deposit is non-refundable.
      // If already charged at booking time (same-day booking), keep it. Otherwise charge now.
      if (booking.payment_status === "charged") {
        alreadyCharged = true;
      } else if (booking.stripe_customer_id && booking.stripe_payment_method_id && booking.payment_status === "verified") {
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: DEPOSIT_AMOUNT_CENTS,
            currency: "eur",
            customer: booking.stripe_customer_id,
            payment_method: booking.stripe_payment_method_id,
            off_session: true,
            confirm: true,
            metadata: {
              booking_id: booking.id,
              charge_type: "late_cancellation_non_refundable",
            },
          });
          charged = paymentIntent.status === "succeeded";
        } catch (chargeErr: any) {
          console.error("[cancel] Late cancellation charge failed:", chargeErr);
        }
      }
    } else {
      // More than 24h: detach payment method, no charge
      if (booking.stripe_payment_method_id) {
        try {
          await stripe.paymentMethods.detach(booking.stripe_payment_method_id);
        } catch (detachErr: any) {
          console.error("[cancel] Detach PM failed:", detachErr);
        }
      }
    }

    const newPaymentStatus = (charged || alreadyCharged) ? "charged" : hoursUntil >= 24 ? "released" : booking.payment_status;
    const depositRetained = charged || alreadyCharged;

    await sb.from("bookings")
      .update({ status: "cancelled", payment_status: newPaymentStatus })
      .eq("id", booking_id);

    // Send Telegram notification
    try {
      // Fetch client profile for name
      const { data: profile } = await sb
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", booking.user_id)
        .single();

      await sb.functions.invoke("send-telegram-notification", {
        body: {
          type: "cancellation",
          data: {
            client_name: profile?.full_name || "–",
            service_name: booking.service_name || "–",
            service_price: booking.service_price || "–",
            barber_name: booking.barber_name || "–",
            booking_date: booking.booking_date || "–",
            booking_time: booking.booking_time || "–",
            charged,
            already_charged: alreadyCharged,
            deposit_retained: depositRetained,
            hours_until: Math.round(hoursUntil),
            payment_status: newPaymentStatus,
          },
        },
      });
    } catch (tgErr: any) {
      console.error("[cancel] Telegram notification error:", tgErr);
    }

    return new Response(JSON.stringify({
      cancelled: true,
      charged: charged || alreadyCharged,
      already_charged: alreadyCharged,
      deposit_retained: depositRetained,
      hours_until: Math.round(hoursUntil),
      payment_status: newPaymentStatus,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[cancel] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
