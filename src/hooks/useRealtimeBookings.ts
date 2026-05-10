import { useEffect, useRef } from "react";

/**
 * Polls bookings every 30 seconds by calling onChange().
 *
 * Replaces the previous Supabase Realtime subscription on the bookings table
 * (removed for security: no per-user channel authorization on realtime.messages).
 * 30s is more than reactive enough for a barbershop admin dashboard.
 *
 * The hook name is kept for backwards compatibility with existing imports.
 */
export function useRealtimeBookings(onChange: () => void, enabled = true, intervalMs = 30000) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
