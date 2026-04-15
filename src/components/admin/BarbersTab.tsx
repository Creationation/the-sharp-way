import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Save, ToggleLeft, ToggleRight, User, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";

const IMAGE_MAP: Record<string, string> = {
  "/barber-1": barber1,
  "/barber-2": barber2,
  "/barber-3": barber3,
};

interface BarberRow {
  id: string;
  name: string;
  specialty_en: string;
  specialty_de: string;
  rating: number;
  cuts: number;
  years: number;
  image_url: string;
  available: boolean;
  sort_order: number;
  color: string;
}

interface Props {
  t: {
    title: string;
    name: string;
    specialtyEn: string;
    specialtyDe: string;
    rating: string;
    cuts: string;
    years: string;
    imageKey: string;
    available: string;
    unavailable: string;
    addBarber: string;
    save: string;
    saved: string;
    saveError: string;
    deleted: string;
    deleteError: string;
    loadError: string;
    confirmDelete: string;
    changePhoto: string;
    photoUploaded: string;
    color: string;
  };
}

const IMAGES = [
  { label: "Ibo", value: "/barber-1" },
  { label: "Ahmed", value: "/barber-2" },
  { label: "Cetin", value: "/barber-3" },
];

const BarbersTab = ({ t }: Props) => {
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    const { data, error } = await supabase
      .from("barbers")
      .select("id, name, specialty_en, specialty_de, rating, cuts, years, image_url, available, sort_order, color")
      .order("sort_order");
    if (error) {
      toast.error(t.loadError);
    } else {
      setBarbers(
        (data || []).map((b: any) => ({ ...b, rating: Number(b.rating) }))
      );
    }
    setLoading(false);
  };

  const updateField = (id: string, field: keyof BarberRow, value: any) => {
    setBarbers(prev => prev.map(b => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const saveBarber = async (barber: BarberRow) => {
    setSavingId(barber.id);
    const { error } = await supabase
      .from("barbers")
      .update({
        name: barber.name,
        specialty_en: barber.specialty_en,
        specialty_de: barber.specialty_de,
        rating: barber.rating,
        cuts: barber.cuts,
        years: barber.years,
        image_url: barber.image_url,
        available: barber.available,
        sort_order: barber.sort_order,
        color: barber.color,
      })
      .eq("id", barber.id);
    setSavingId(null);
    if (error) toast.error(t.saveError);
    else toast.success(t.saved);
  };

  const addBarber = async () => {
    const newOrder = barbers.length > 0 ? Math.max(...barbers.map(b => b.sort_order)) + 1 : 1;
    const { data, error } = await supabase
      .from("barbers")
      .insert({
        name: "New Barber",
        specialty_en: "Specialty",
        specialty_de: "Spezialität",
        rating: 4.5,
        cuts: 0,
        years: 1,
        image_url: "/barber-1",
        available: true,
        sort_order: newOrder,
      })
      .select()
      .single();
    if (error) {
      toast.error(t.saveError);
    } else if (data) {
      setBarbers(prev => [...prev, { ...data, rating: Number(data.rating) }]);
      toast.success(t.saved);
    }
  };

  const deleteBarber = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    const { error } = await supabase.from("barbers").delete().eq("id", id);
    if (error) {
      toast.error(t.deleteError);
    } else {
      setBarbers(prev => prev.filter(b => b.id !== id));
      toast.success(t.deleted);
    }
  };

  const getBarberPreview = (imageUrl: string): string => {
    if (imageUrl.startsWith("http")) return imageUrl;
    return IMAGE_MAP[imageUrl] || barber1;
  };

  const handlePhotoUpload = async (barberId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(barberId);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${barberId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("barber-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error(t.saveError);
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("barber-photos").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now();
    updateField(barberId, "image_url", publicUrl);
    setUploadingId(null);
    toast.success(t.photoUploaded);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4">
      {barbers.map(barber => (
        <div key={barber.id} className="card-app p-5 space-y-3">
          {/* Header with name + availability */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={18} className="text-copper" />
              <h3 className="text-foreground font-heading text-base">{barber.name}</h3>
            </div>
            <button onClick={() => updateField(barber.id, "available", !barber.available)}>
              {barber.available ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-mint text-xs font-medium">{t.available}</span>
                  <ToggleRight size={28} className="text-mint" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-xs">{t.unavailable}</span>
                  <ToggleLeft size={28} className="text-muted-foreground" />
                </div>
              )}
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">{t.name}</label>
              <input
                value={barber.name}
                onChange={e => updateField(barber.id, "name", e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.specialtyEn}</label>
                <input
                  value={barber.specialty_en}
                  onChange={e => updateField(barber.id, "specialty_en", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.specialtyDe}</label>
                <input
                  value={barber.specialty_de}
                  onChange={e => updateField(barber.id, "specialty_de", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.rating}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={barber.rating}
                  onChange={e => updateField(barber.id, "rating", parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.cuts}</label>
                <input
                  type="number"
                  value={barber.cuts}
                  onChange={e => updateField(barber.id, "cuts", parseInt(e.target.value) || 0)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.years}</label>
                <input
                  type="number"
                  value={barber.years}
                  onChange={e => updateField(barber.id, "years", parseInt(e.target.value) || 0)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-xs mb-1 block">{t.imageKey}</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface border border-border">
                  <img
                    src={getBarberPreview(barber.image_url)}
                    alt={barber.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={el => { fileInputRefs.current[barber.id] = el; }}
                  onChange={e => handlePhotoUpload(barber.id, e)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefs.current[barber.id]?.click()}
                  disabled={uploadingId === barber.id}
                  className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground hover:border-copper/50 transition-colors disabled:opacity-50"
                >
                  <Camera size={14} className="text-copper" />
                  {uploadingId === barber.id ? "..." : t.changePhoto}
                </button>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-xs mb-1 block">{t.color}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={barber.color}
                  onChange={e => updateField(barber.id, "color", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <input
                  value={barber.color}
                  onChange={e => updateField(barber.id, "color", e.target.value)}
                  className="w-28 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors font-mono"
                />
                <span className="w-6 h-6 rounded-full" style={{ backgroundColor: barber.color }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => saveBarber(barber)}
              disabled={savingId === barber.id}
              className="flex-1 gradient-copper text-primary-foreground font-semibold py-2.5 rounded-full shadow-copper flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              <Save size={14} />
              {savingId === barber.id ? "..." : t.save}
            </button>
            <button
              onClick={() => deleteBarber(barber.id)}
              className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <Trash2 size={14} className="text-destructive" />
            </button>
          </div>
        </div>
      ))}

      {/* Add barber button */}
      <button
        onClick={addBarber}
        className="w-full card-app p-4 flex items-center justify-center gap-2 text-copper font-semibold text-sm border-dashed border-2 border-copper/30 hover:border-copper/50 transition-colors"
      >
        <Plus size={18} />
        {t.addBarber}
      </button>
    </div>
  );
};

export default BarbersTab;
