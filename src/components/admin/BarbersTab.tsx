import { useEffect, useState } from "react";
import { Plus, Trash2, Save, ToggleLeft, ToggleRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  };
}

const IMAGES = [
  { label: "Barber 1", value: "/barber-1" },
  { label: "Barber 2", value: "/barber-2" },
  { label: "Barber 3", value: "/barber-3" },
];

const BarbersTab = ({ t }: Props) => {
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    const { data, error } = await supabase
      .from("barbers")
      .select("id, name, specialty_en, specialty_de, rating, cuts, years, image_url, available, sort_order")
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
              <select
                value={barber.image_url}
                onChange={e => updateField(barber.id, "image_url", e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
              >
                {IMAGES.map(img => (
                  <option key={img.value} value={img.value}>{img.label}</option>
                ))}
              </select>
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
