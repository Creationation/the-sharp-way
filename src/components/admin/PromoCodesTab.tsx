import { useEffect, useState } from "react";
import { Plus, Trash2, Save, ToggleLeft, ToggleRight, Ticket, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  expires_at: string | null;
  stripe_coupon_id: string | null;
}

interface Props {
  t: {
    title: string;
    code: string;
    description: string;
    discountType: string;
    percentage: string;
    fixed: string;
    discountValue: string;
    maxUses: string;
    unlimited: string;
    uses: string;
    expiresAt: string;
    noExpiry: string;
    active: string;
    inactive: string;
    addCode: string;
    save: string;
    saved: string;
    saveError: string;
    deleted: string;
    deleteError: string;
    loadError: string;
    confirmDelete: string;
    stripeReady: string;
  };
}

const PromoCodesTab = ({ t }: Props) => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("id, code, description, discount_type, discount_value, max_uses, current_uses, active, expires_at, stripe_coupon_id")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(t.loadError);
    } else {
      setCodes(
        (data || []).map((c: any) => ({
          ...c,
          discount_value: Number(c.discount_value),
        }))
      );
    }
    setLoading(false);
  };

  const updateField = (id: string, field: keyof PromoCode, value: any) => {
    setCodes(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const saveCode = async (code: PromoCode) => {
    setSavingId(code.id);
    const { error } = await supabase
      .from("promo_codes")
      .update({
        code: code.code.toUpperCase().trim(),
        description: code.description,
        discount_type: code.discount_type,
        discount_value: code.discount_value,
        max_uses: code.max_uses,
        active: code.active,
        expires_at: code.expires_at,
        stripe_coupon_id: code.stripe_coupon_id,
      })
      .eq("id", code.id);
    setSavingId(null);
    if (error) toast.error(t.saveError);
    else toast.success(t.saved);
  };

  const addCode = async () => {
    const { data, error } = await supabase
      .from("promo_codes")
      .insert({
        code: "NEW" + Math.floor(Math.random() * 1000),
        description: "",
        discount_type: "percentage",
        discount_value: 10,
        active: false,
      })
      .select()
      .single();
    if (error) {
      toast.error(t.saveError);
    } else if (data) {
      setCodes(prev => [{ ...data, discount_value: Number(data.discount_value) }, ...prev]);
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) {
      toast.error(t.deleteError);
    } else {
      setCodes(prev => prev.filter(c => c.id !== id));
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
      {/* Stripe info badge */}
      <div className="card-app p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Link2 size={14} className="text-copper flex-shrink-0" />
        <span>{t.stripeReady}</span>
      </div>

      {codes.map(code => (
        <div key={code.id} className="card-app p-5 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-copper" />
              <span className="font-heading text-foreground text-base tracking-wider">{code.code}</span>
            </div>
            <button onClick={() => updateField(code.id, "active", !code.active)}>
              {code.active ? (
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

          {/* Usage counter */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{t.uses}: <span className="text-foreground font-medium">{code.current_uses}</span>{code.max_uses ? ` / ${code.max_uses}` : ""}</span>
            {!code.max_uses && <span className="text-copper text-[10px]">({t.unlimited})</span>}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.code}</label>
                <input
                  value={code.code}
                  onChange={e => updateField(code.id, "code", e.target.value.toUpperCase())}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.description}</label>
                <input
                  value={code.description}
                  onChange={e => updateField(code.id, "description", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.discountType}</label>
                <select
                  value={code.discount_type}
                  onChange={e => updateField(code.id, "discount_type", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                >
                  <option value="percentage">{t.percentage}</option>
                  <option value="fixed">{t.fixed}</option>
                </select>
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.discountValue}</label>
                <input
                  type="number"
                  min="0"
                  step={code.discount_type === "percentage" ? "1" : "0.5"}
                  max={code.discount_type === "percentage" ? "100" : undefined}
                  value={code.discount_value}
                  onChange={e => updateField(code.id, "discount_value", parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.maxUses}</label>
                <input
                  type="number"
                  min="0"
                  placeholder={t.unlimited}
                  value={code.max_uses ?? ""}
                  onChange={e => updateField(code.id, "max_uses", e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">{t.expiresAt}</label>
                <input
                  type="date"
                  value={code.expires_at ? code.expires_at.split("T")[0] : ""}
                  onChange={e => updateField(code.id, "expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
                {!code.expires_at && <span className="text-muted-foreground text-[10px]">{t.noExpiry}</span>}
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">Stripe Coupon ID</label>
                <input
                  value={code.stripe_coupon_id ?? ""}
                  onChange={e => updateField(code.id, "stripe_coupon_id", e.target.value || null)}
                  placeholder="cou_xxx..."
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => saveCode(code)}
              disabled={savingId === code.id}
              className="flex-1 gradient-copper text-primary-foreground font-semibold py-2.5 rounded-full shadow-copper flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              <Save size={14} />
              {savingId === code.id ? "..." : t.save}
            </button>
            <button
              onClick={() => deleteCode(code.id)}
              className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <Trash2 size={14} className="text-destructive" />
            </button>
          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={addCode}
        className="w-full card-app p-4 flex items-center justify-center gap-2 text-copper font-semibold text-sm border-dashed border-2 border-copper/30 hover:border-copper/50 transition-colors"
      >
        <Plus size={18} />
        {t.addCode}
      </button>
    </div>
  );
};

export default PromoCodesTab;
