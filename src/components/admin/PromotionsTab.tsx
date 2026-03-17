import { useEffect, useState } from "react";
import { Save, ToggleLeft, ToggleRight, Megaphone, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Promo {
  id: string;
  type: string;
  active: boolean;
  title_en: string;
  title_de: string;
  subtitle_en: string;
  subtitle_de: string;
  link_text_en: string;
  link_text_de: string;
}

interface Props {
  t: {
    banner: string;
    promoCard: string;
    active: string;
    inactive: string;
    titleEn: string;
    titleDe: string;
    subtitleEn: string;
    subtitleDe: string;
    linkTextEn: string;
    linkTextDe: string;
    save: string;
    saved: string;
    saveError: string;
    loadError: string;
  };
}

const PromotionsTab = ({ t }: Props) => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    const { data, error } = await supabase
      .from("promotions")
      .select("id, type, active, title_en, title_de, subtitle_en, subtitle_de, link_text_en, link_text_de")
      .order("type");
    if (error) {
      toast.error(t.loadError);
    } else {
      setPromos((data as Promo[]) || []);
    }
    setLoading(false);
  };

  const updateField = (id: string, field: keyof Promo, value: string | boolean) => {
    setPromos(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const savePromo = async (promo: Promo) => {
    setSavingId(promo.id);
    const { error } = await supabase
      .from("promotions")
      .update({
        active: promo.active,
        title_en: promo.title_en,
        title_de: promo.title_de,
        subtitle_en: promo.subtitle_en,
        subtitle_de: promo.subtitle_de,
        link_text_en: promo.link_text_en,
        link_text_de: promo.link_text_de,
      })
      .eq("id", promo.id);
    setSavingId(null);
    if (error) toast.error(t.saveError);
    else toast.success(t.saved);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 space-y-5">
      {promos.map(promo => {
        const isBanner = promo.type === "banner";
        const Icon = isBanner ? Megaphone : Tag;

        return (
          <div key={promo.id} className="card-app p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-copper" />
                <h3 className="text-foreground font-heading text-base">
                  {isBanner ? t.banner : t.promoCard}
                </h3>
              </div>
              <button onClick={() => updateField(promo.id, "active", !promo.active)}>
                {promo.active ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-mint text-xs font-medium">{t.active}</span>
                    <ToggleRight size={28} className="text-mint" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">{t.inactive}</span>
                    <ToggleLeft size={28} className="text-muted-foreground" />
                  </div>
                )}
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.titleEn}</label>
                <input
                  value={promo.title_en}
                  onChange={e => updateField(promo.id, "title_en", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.titleDe}</label>
                <input
                  value={promo.title_de}
                  onChange={e => updateField(promo.id, "title_de", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>

              {!isBanner && (
                <>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">{t.subtitleEn}</label>
                    <input
                      value={promo.subtitle_en}
                      onChange={e => updateField(promo.id, "subtitle_en", e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">{t.subtitleDe}</label>
                    <input
                      value={promo.subtitle_de}
                      onChange={e => updateField(promo.id, "subtitle_de", e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs mb-1 block">{t.linkTextEn}</label>
                  <input
                    value={promo.link_text_en}
                    onChange={e => updateField(promo.id, "link_text_en", e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs mb-1 block">{t.linkTextDe}</label>
                  <input
                    value={promo.link_text_de}
                    onChange={e => updateField(promo.id, "link_text_de", e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={() => savePromo(promo)}
              disabled={savingId === promo.id}
              className="w-full gradient-copper text-primary-foreground font-semibold py-3 rounded-full shadow-copper flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={14} />
              {savingId === promo.id ? "..." : t.save}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PromotionsTab;
