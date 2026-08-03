import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface WorkingHour {
  weekday: number;
  active: boolean;
  start_time: string;
  end_time: string;
}

export interface Absence {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export function useBarberSchedule(barberId?: string) {
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barberId) {
      setHours([]);
      setAbsences([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const [h, a] = await Promise.all([
        supabase
          .from("barber_working_hours")
          .select("weekday, active, start_time, end_time")
          .eq("barber_id", barberId)
          .order("weekday"),
        supabase
          .from("barber_absences")
          .select("id, start_date, end_date, reason")
          .eq("barber_id", barberId)
          .gte("end_date", today)
          .order("start_date"),
      ]);
      if (cancelled) return;
      setHours((h.data as WorkingHour[]) || []);
      setAbsences((a.data as Absence[]) || []);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [barberId]);

  return { hours, absences, loading };
}
