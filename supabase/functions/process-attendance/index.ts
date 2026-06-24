import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendGmail } from "../_shared/gmail-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingBooking {
  id: string;
  user_id: string;
  barber_name: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Internal/cron-only: require service-role bearer token
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("Authorization") || "";
  if (!SERVICE_ROLE_KEY || auth !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Find all confirmed past bookings (before today) with no attendance recorded
  const { data: pendingBookings, error } = await supabase
    .from("bookings")
    .select("id, user_id, barber_name, service_name, booking_date, booking_time")
    .eq("status", "confirmed")
    .is("attendance_status", null)
    .lt("booking_date", todayStr);

  if (error) {
    console.error("Error fetching pending bookings:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch profile names client-side (no FK between bookings.user_id and profiles.user_id)
  const userIds = Array.from(new Set(((pendingBookings || []) as PendingBooking[]).map(b => b.user_id).filter(Boolean)));
  const profilesById: Record<string, { email: string | null; full_name: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);
    for (const p of profiles || []) {
      profilesById[p.user_id] = { email: p.email, full_name: p.full_name };
    }
  }

  const autoStamped: string[] = [];
  const errors: string[] = [];

  for (const booking of (pendingBookings || []) as PendingBooking[]) {
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ attendance_status: "attended" })
      .eq("id", booking.id);

    if (updateErr) {
      errors.push(`${booking.id}: ${updateErr.message}`);
    } else {
      const profile = profilesById[booking.user_id];
      const name = profile?.full_name || profile?.email || booking.user_id;
      autoStamped.push(`${booking.booking_date} ${booking.booking_time} — ${name} (${booking.barber_name})`);
    }
  }

  // Send admin summary email if anything was auto-stamped
  if (autoStamped.length > 0) {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f0f0f;color:#f5f0e8;padding:32px;border-radius:16px;">
        <h2 style="color:#b8935a;margin-bottom:4px;">✂️ Auto-Stempel vergeben</h2>
        <p style="color:#888;margin-bottom:20px;font-size:13px;">
          ${autoStamped.length} Buchung(en) wurden automatisch als <strong style="color:#b8935a;">besucht</strong> markiert
          (kein Barber hat bis 21:00 Uhr reagiert).
        </p>
        <div style="background:#1a1a1a;border-radius:12px;padding:16px;border:1px solid #2a2a2a;margin-bottom:20px;">
          <ul style="margin:0;padding-left:16px;font-size:13px;line-height:2;">
            ${autoStamped.map((s) => `<li>${s}</li>`).join("")}
          </ul>
        </div>
        <p style="color:#555;font-size:11px;">
          Falls ein Kunde wirklich nicht erschienen ist, öffne das Admin-Dashboard und markiere ihn als "No-Show".
          Der Stempel wird dann zurückgesetzt.
        </p>
        <a href="https://sitdownvienna.lovable.app/admin"
           style="display:inline-block;margin-top:16px;background:linear-gradient(90deg,#b8935a,#d4a96a);color:#111;font-weight:700;font-size:13px;padding:12px 24px;border-radius:50px;text-decoration:none;">
          → Admin Dashboard öffnen
        </a>
        <p style="color:#333;font-size:11px;margin-top:20px;">© 2026 Sitdown Wien · Lavaterstraße 2, 1220 Wien</p>
      </div>
    </body></html>`;

    await sendGmail({
      to: "hello@sitdownvienna.app",
      subject: `✂️ ${autoStamped.length} Auto-Stempel vergeben — Sitdown Wien`,
      html,
    }).catch(() => {});
  }

  return new Response(
    JSON.stringify({ auto_stamped: autoStamped.length, stamped: autoStamped, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
