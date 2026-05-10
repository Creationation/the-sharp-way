import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GalleryImage {
  id: string;
  image_url: string;
  category: number; // 1=Fades, 2=Beards, 3=Classic, 4=Women, 5=Design
  sort_order: number;
  active: boolean;
}

export function useGalleryImages(opts: { onlyActive?: boolean } = {}) {
  const { onlyActive = true } = opts;
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("gallery_images")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (onlyActive) q = q.eq("active", true);
    const { data } = await q;
    setImages((data as GalleryImage[]) || []);
    setLoading(false);
  }, [onlyActive]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  return { images, loading, refresh: fetchImages };
}
