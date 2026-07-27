import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BarberPhoto {
  id: string;
  barber_id: string;
  image_url: string;
  caption: string;
  sort_order: number;
  active: boolean;
}

export function useBarberPhotos(barberId?: string, opts: { onlyActive?: boolean } = {}) {
  const { onlyActive = true } = opts;
  const [photos, setPhotos] = useState<BarberPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    if (!barberId) { setPhotos([]); setLoading(false); return; }
    setLoading(true);
    let q = supabase
      .from("barber_photos")
      .select("*")
      .eq("barber_id", barberId)
      .order("sort_order", { ascending: true });
    if (onlyActive) q = q.eq("active", true);
    const { data } = await q;
    setPhotos((data as BarberPhoto[]) || []);
    setLoading(false);
  }, [barberId, onlyActive]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  return { photos, loading, refresh: fetchPhotos };
}
