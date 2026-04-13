import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    if (!user?.email) throw new Error("User not authenticated");

    const { bookingData } = await req.json();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customer: Stripe.Customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: bookingData.clientName || "",
        phone: bookingData.clientPhone || "",
      });
    }

    const metadata: Record<string, string> = {
      user_id: user.id,
      barber_name: bookingData.barberName || "",
      service_name: bookingData.serviceName || "",
      service_price: bookingData.servicePrice || "",
      service_duration: bookingData.serviceDuration || "",
      booking_date: bookingData.bookingDate || "",
      booking_time: bookingData.bookingTime || "",
      client_name: bookingData.clientName || "",
      client_phone: bookingData.clientPhone || "",
      client_email: bookingData.clientEmail || user.email,
      notes: bookingData.notes || "",
      promo_code: bookingData.promoCode || "",
    };

    const origin = req.headers.get("origin") || "https://sitdownvienna.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "setup",
      payment_method_types: ["card"],
      success_url: `${origin}/stripe-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book?payment=cancelled`,
      metadata,
      setup_intent_data: { metadata },
    });

    if (!session.url) throw new Error("Stripe returned no checkout URL");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-setup-intent] ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
