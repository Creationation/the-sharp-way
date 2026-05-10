import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ServiceCategory = "herren" | "damen" | "kinder";

export interface Service {
  id: string;
  name: string;
  name_en: string;
  price: number;
  duration_min: number;
  sort_order: number;
  active: boolean;
  category: ServiceCategory;
  is_from_price: boolean;
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

/** Formats a service price honoring is_from_price → "ab 32 €" (de) / "from 32 €" (en). */
export function formatServicePrice(s: Pick<Service, "price" | "is_from_price">, lang: "de" | "en" = "de") {
  const base = `${s.price}€`;
  if (!s.is_from_price) return base;
  return lang === "de" ? `ab ${base}` : `from ${base}`;
}
