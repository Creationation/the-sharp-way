import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  name: string;
  name_en: string;
  price: number;
  duration_min: number;
  sort_order: number;
  active: boolean;
}

export function useServices(opts: { onlyActive?: boolean } = {}) {
  const { onlyActive = true } = opts;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("services").select("*").order("sort_order", { ascending: true });
    if (onlyActive) q = q.eq("active", true);
    const { data } = await q;
    setServices((data as Service[]) || []);
    setLoading(false);
  }, [onlyActive]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  return { services, loading, refresh: fetchServices };
}
