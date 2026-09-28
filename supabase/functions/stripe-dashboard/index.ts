import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user?.id) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const since = Math.floor(Date.now() / 1000) - 30 * 86400;

    const [balance, charges, payouts, refunds] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.charges.list({ limit: 100, created: { gte: since } }),
      stripe.payouts.list({ limit: 10 }),
      stripe.refunds.list({ limit: 100, created: { gte: since } }),
    ]);

    const sum = (arr: { amount: number; currency: string }[]) =>
      arr.filter((b) => b.currency === "eur").reduce((s, b) => s + b.amount, 0);

    return json({
      livemode: charges.data[0]?.livemode ?? !(Deno.env.get("STRIPE_SECRET_KEY") || "").startsWith("sk_test"),
      balance: { available: sum(balance.available), pending: sum(balance.pending) },
      charges: charges.data.map((c) => ({
        id: c.id,
        amount: c.amount,
        amount_refunded: c.amount_refunded,
        currency: c.currency,
        status: c.status,
        paid: c.paid,
        refunded: c.refunded,
        created: c.created,
        description: c.description,
        email: c.billing_details?.email || c.receipt_email || null,
        name: c.billing_details?.name || null,
        failure_message: c.failure_message,
        card_brand: c.payment_method_details?.card?.brand || null,
        card_last4: c.payment_method_details?.card?.last4 || null,
      })),
      payouts: payouts.data.map((p) => ({
        id: p.id, amount: p.amount, currency: p.currency, status: p.status, arrival_date: p.arrival_date,
      })),
      refunds_total: refunds.data.filter((r) => r.status === "succeeded").reduce((s, r) => s + r.amount, 0),
    });
  } catch (e) {
    console.error("[stripe-dashboard]", e);
    return json({ error: (e as Error).message }, 500);
  }
});
