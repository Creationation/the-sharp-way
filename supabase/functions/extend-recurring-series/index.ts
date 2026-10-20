// Daily job: keeps copies of repeating admin appointments materialized up to 1 year ahead.
import { createClient } from "npm:@supabase/supabase-js@2";
import { RRule } from "npm:rrule@2.8.1";

const HORIZON_DAYS = 365;
const noonUTC = (ymd: string) => { const [y, m, d] = ymd.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };
const ymd = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await sb.from("bookings")
    .select("booking_date, recurrence_series_id, recurrence_rrule")
    .not("recurrence_rrule", "is", null).not("recurrence_series_id", "is", null)
    .order("booking_date", { ascending: false });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const latest = new Map<string, { booking_date: string; recurrence_rrule: string }>();
  for (const r of data ?? []) if (!latest.has(r.recurrence_series_id)) latest.set(r.recurrence_series_id, r);

  const today = new Date(); today.setUTCHours(12, 0, 0, 0);
  const horizon = new Date(today.getTime() + HORIZON_DAYS * 86400000);
  let created = 0, failed = 0;
  for (const [series, row] of latest) {
    try {
      const after = new Date(noonUTC(row.booking_date).getTime() + 86400000 - 1);
      const dates = RRule.fromString(row.recurrence_rrule).between(after, new Date(horizon.getTime() + 1), true).map(ymd).slice(0, 400);
      if (!dates.length) continue;
      const { data: n, error: e } = await sb.rpc("service_extend_series", { _series_id: series, _dates: dates });
      if (e) { failed++; console.error(series, e.message); } else created += n ?? 0;
    } catch (e) { failed++; console.error(series, e); }
  }
  return new Response(JSON.stringify({ series: latest.size, created, failed }), { headers: { "Content-Type": "application/json" } });
});
