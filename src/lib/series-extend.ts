import { supabase } from "@/integrations/supabase/client";
import { addDays, rruleDates } from "@/lib/admin-appointments";

/** Tops up repeating series so copies always exist up to the horizon (needed for "Für immer"). */
export async function extendSeries() {
  const { data, error } = await supabase
    .from("bookings")
    .select("user_id, barber_name, service_name, service_price, service_duration, booking_date, booking_time, notes, recurrence_series_id, recurrence_rrule")
    .not("recurrence_rrule", "is", null)
    .not("recurrence_series_id", "is", null)
    .order("booking_date", { ascending: false });
  if (error || !data) return;
  const latest = new Map<string, (typeof data)[number]>();
  for (const row of data) if (!latest.has(row.recurrence_series_id!)) latest.set(row.recurrence_series_id!, row);
  for (const row of latest.values()) {
    let dates: string[];
    try { dates = rruleDates(row.recurrence_rrule!, addDays(row.booking_date, 1)); } catch { continue; }
    if (!dates.length) continue;
    await supabase.rpc("admin_save_series", {
      _booking: { user_id: row.user_id, barber_name: row.barber_name, service_name: row.service_name, service_price: row.service_price, service_duration: row.service_duration, booking_time: row.booking_time.substring(0, 5), notes: row.notes },
      _dates: dates.slice(0, 400), _rrule: row.recurrence_rrule, _series_id: row.recurrence_series_id,
    });
  }
}
