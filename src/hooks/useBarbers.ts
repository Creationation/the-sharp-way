import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";

// Map DB image_url to local assets
const IMAGE_MAP: Record<string, string> = {
  "/barber-1": barber1,
  "/barber-2": barber2,
  "/barber-3": barber3,
};

export interface Barber {
  id: string;
  name: string;
  specialty_en: string;
  specialty_de: string;
  rating: number;
  cuts: number;
  years: number;
  image: string;
  image_url: string;
  available: boolean;
  sort_order: number;
}

export function useBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBarbers = async () => {
    const { data } = await supabase
      .from("barbers")
      .select("*")
      .order("sort_order");
    if (data) {
      setBarbers(
        data.map((b: any) => ({
          ...b,
          rating: Number(b.rating),
          image: IMAGE_MAP[b.image_url] || barber1,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  return { barbers, loading, refetch: fetchBarbers };
}
