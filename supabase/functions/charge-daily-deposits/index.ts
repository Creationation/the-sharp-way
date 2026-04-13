import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEPOSIT_AMOUNT_CENTS = 500; // 5€

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const viennaFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Vienna",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayVienna = viennaFormatter.format(new Date());

    console.log(`[charge-daily] Charging deposits for: ${todayVienna}`);

    const { data: appointments, error: fetchErr } = await sb
      .from("bookings")
      .select("*")
      .eq("booking_date", todayVienna)
      .eq("status", "confirmed")
      .eq("payment_status", "verified")
      .neq("stripe_customer_id", "")
      .neq("stripe_payment_method_id", "");

    if (fetchErr) throw fetchErr;

    console.log(`[charge-daily] Found ${(appointments || []).length} bookings to charge`);

    const results: any[] = [];

    for (const appt of (appointments || [])) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: DEPOSIT_AMOUNT_CENTS,
          currency: "eur",
          customer: appt.stripe_customer_id,
          payment_method: appt.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          metadata: {
            booking_id: appt.id,
            charge_type: "daily_deposit",
            client_name: appt.service_name,
          },
        });

        if (paymentIntent.status === "succeeded") {
          await sb.from("bookings")
            .update({ payment_status: "charged" })
            .eq("id", appt.id);
          results.push({ id: appt.id, status: "charged", intent: paymentIntent.id });
        } else {
          results.push({ id: appt.id, status: "pending", intent: paymentIntent.id });
        }
      } catch (chargeErr: any) {
        console.error(`[charge-daily] Charge failed for ${appt.id}:`, chargeErr);
        await sb.from("bookings")
          .update({ payment_status: "failed" })
          .eq("id", appt.id);
        results.push({ id: appt.id, status: "failed", error: chargeErr.message });
      }
    }

    return new Response(JSON.stringify({
      date: todayVienna,
      processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[charge-daily] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
