import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BarberPhotoWithBarber {
  id: string;
  barber_id: string;
  barber_name: string;
  image_url: string;
  caption: string;
  sort_order: number;
}

export function useAllBarberPhotos() {
  const [photos, setPhotos] = useState<BarberPhotoWithBarber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const [{ data: photoRows }, { data: barberRows }] = await Promise.all([
      supabase
        .from("barber_photos")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("barbers").select("id, name"),
    ]);

    const nameById = new Map<string, string>(
      (barberRows || []).map((b: any) => [b.id, b.name as string])
    );

    setPhotos(
      ((photoRows as any[]) || [])
        .filter((p) => nameById.has(p.barber_id))
        .map((p) => ({
          id: p.id,
          barber_id: p.barber_id,
          barber_name: nameById.get(p.barber_id) as string,
          image_url: p.image_url,
          caption: p.caption || "",
          sort_order: p.sort_order ?? 0,
        }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, refresh: fetchPhotos };
}
