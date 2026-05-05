import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to live INSERT/UPDATE/DELETE on the bookings table
 * and calls onChange() each time something changes.
 *
 * Use in any admin screen that needs live updates (Bookings, Schedule, ...).
 */
export function useRealtimeBookings(onChange: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("admin-bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
