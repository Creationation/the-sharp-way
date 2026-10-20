import { supabase } from "@/integrations/supabase/client";
import { addDays, rruleDates } from "@/lib/admin-appointments";

/** Tops up repeating series up to the horizon. A daily scheduled job does the same server-side. */
export async function extendSeries() {
  const { data, error } = await supabase
    .from("bookings")
    .select("booking_date, recurrence_series_id, recurrence_rrule")
    .not("recurrence_rrule", "is", null)
    .not("recurrence_series_id", "is", null)
    .order("booking_date", { ascending: false });
  if (error || !data) return;
  const latest = new Map<string, (typeof data)[number]>();
  for (const row of data) if (!latest.has(row.recurrence_series_id!)) latest.set(row.recurrence_series_id!, row);
  for (const row of latest.values()) {
    let dates: string[];
    try { dates = rruleDates(row.recurrence_rrule!, addDays(row.booking_date, 1)); } catch { continue; }
    if (dates.length) await supabase.rpc("service_extend_series", { _series_id: row.recurrence_series_id!, _dates: dates.slice(0, 400) });
  }
}
