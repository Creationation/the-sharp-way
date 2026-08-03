import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type NextAvailability =
  | { kind: "today"; time: string }
  | { kind: "future"; time: string; date: Date }
  | { kind: "none" }
  | { kind: "unknown" };

const DAYS_AHEAD = 14;

const toDateStr = (d: Date) => format(d, "yyyy-MM-dd");

const buildSlots = (start: string, end: string) => {
  const out: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cur = sh * 60 + sm;
  const stop = eh * 60 + em;
  while (cur < stop) {
    out.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
    cur += 30;
  }
  return out;
};

export function useNextAvailability(barbers: { id: string; name: string }[]) {
  const [map, setMap] = useState<Record<string, NextAvailability>>({});

  const key = barbers.map(b => b.id).join(",");

  useEffect(() => {
    if (!barbers.length) return;
    let cancelled = false;

    const run = async () => {
      const today = new Date();
      const from = toDateStr(today);
      const until = new Date(today);
      until.setDate(until.getDate() + DAYS_AHEAD);
      const to = toDateStr(until);

      const ids = barbers.map(b => b.id);
      const names = barbers.map(b => b.name);

      const [hoursRes, bookingsRes, availRes, absencesRes] = await Promise.all([
        supabase.from("barber_working_hours").select("barber_id, weekday, active, start_time, end_time").in("barber_id", ids),
        supabase.from("bookings").select("barber_name, booking_date, booking_time").in("barber_name", names).gte("booking_date", from).lte("booking_date", to).eq("status", "confirmed"),
        supabase.from("barber_availability").select("barber_name, date, blocked_slots, day_off").in("barber_name", names).gte("date", from).lte("date", to),
        supabase.from("barber_absences").select("barber_id, start_date, end_date").in("barber_id", ids).gte("end_date", from).lte("start_date", to),
      ]);

      if (cancelled) return;

      const result: Record<string, NextAvailability> = {};
      const nowMinutes = today.getHours() * 60 + today.getMinutes();

      for (const b of barbers) {
        const hours = (hoursRes.data ?? []).filter(h => h.barber_id === b.id);
        if (!hours.length) {
          result[b.id] = { kind: "unknown" };
          continue;
        }

        let found: NextAvailability = { kind: "none" };

        for (let i = 0; i <= DAYS_AHEAD; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          const dateStr = toDateStr(d);

          const h = hours.find(x => x.weekday === d.getDay());
          if (!h || !h.active) continue;

          const absent = (absencesRes.data ?? []).some(
            a => a.barber_id === b.id && a.start_date <= dateStr && a.end_date >= dateStr
          );
          if (absent) continue;

          const avail = (availRes.data ?? []).find(a => a.barber_name === b.name && a.date === dateStr);
          if (avail?.day_off) continue;

          const taken = new Set<string>([
            ...(avail?.blocked_slots ?? []),
            ...(bookingsRes.data ?? [])
              .filter(x => x.barber_name === b.name && x.booking_date === dateStr)
              .map(x => String(x.booking_time).slice(0, 5)),
          ]);

          const slots = buildSlots(String(h.start_time).slice(0, 5), String(h.end_time).slice(0, 5));
          const free = slots.find(s => {
            if (taken.has(s)) return false;
            if (i === 0) {
              const [sh, sm] = s.split(":").map(Number);
              if (sh * 60 + sm <= nowMinutes) return false;
            }
            return true;
          });

          if (free) {
            found = i === 0 ? { kind: "today", time: free } : { kind: "future", time: free, date: d };
            break;
          }
        }

        result[b.id] = found;
      }

      if (!cancelled) setMap(result);
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return map;
}

const DE_DAYS = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
const EN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatAvailability(a: NextAvailability | undefined, lang: string) {
  const de = lang === "de";
  if (!a) return de ? "Verfügbarkeit wird geladen …" : "Loading availability …";
  switch (a.kind) {
    case "today":
      return de ? `Heute frei ab ${a.time}` : `Free today from ${a.time}`;
    case "future": {
      const day = (de ? DE_DAYS : EN_DAYS)[a.date.getDay()];
      const dm = format(a.date, "dd.MM.");
      return de ? `Nächster Termin: ${day} ${dm} ab ${a.time}` : `Next slot: ${day} ${dm} from ${a.time}`;
    }
    case "none":
      return de ? "Aktuell ausgebucht" : "Fully booked";
    default:
      return de ? "Verfügbarkeit auf Anfrage" : "Availability on request";
  }
}
