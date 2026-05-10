import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServicesTabT {
  title: string;
  nameDe: string;
  nameEn: string;
  price: string;
  durationMin: string;
  sortOrder: string;
  active: string;
  inactive: string;
  addService: string;
  save: string;
  saved: string;
  saveError: string;
  deleted: string;
  deleteError: string;
  loadError: string;
  confirmDelete: string;
  noServices: string;
  hint: string;
}

interface ServiceRow {
  id: string;
  name: string;
  name_en: string;
  price: number;
  duration_min: number;
  sort_order: number;
  active: boolean;
}

const blankRow = (sort: number): Omit<ServiceRow, "id"> & { id?: string } => ({
  name: "",
  name_en: "",
  price: 0,
  duration_min: 30,
  sort_order: sort,
  active: true,
});

const ServicesTab = ({ t }: { t: ServicesTabT }) => {
  const [rows, setRows] = useState<(ServiceRow | (Omit<ServiceRow, "id"> & { id?: string }))[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) { toast.error(t.loadError); setLoading(false); return; }
    setRows((data as ServiceRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const updateLocal = (i: number, patch: Partial<ServiceRow>) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };

  const saveRow = async (i: number) => {
    const r = rows[i];
    if (!r.name.trim()) { toast.error(t.saveError); return; }
    setSavingId(r.id ?? `new-${i}`);
    const payload = {
      name: r.name.trim(),
      name_en: r.name_en.trim(),
      price: Number(r.price) || 0,
      duration_min: Number(r.duration_min) || 30,
      sort_order: Number(r.sort_order) || 0,
      active: r.active,
    };
    const res = r.id
      ? await supabase.from("services").update(payload).eq("id", r.id)
      : await supabase.from("services").insert(payload);
    setSavingId(null);
    if (res.error) { toast.error(t.saveError); return; }
    toast.success(t.saved);
    fetchRows();
  };

  const confirmDialog = useConfirm();
  const deleteRow = async (i: number) => {
    const r = rows[i];
    const ok = await confirmDialog({ description: t.confirmDelete, destructive: true });
    if (!ok) return;
    if (!r.id) { setRows(prev => prev.filter((_, idx) => idx !== i)); return; }
    const { error } = await supabase.from("services").delete().eq("id", r.id);
    if (error) { toast.error(t.deleteError); return; }
    toast.success(t.deleted);
    fetchRows();
  };

  const addRow = () => {
    const nextSort = rows.length > 0 ? Math.max(...rows.map(r => r.sort_order)) + 1 : 1;
    setRows(prev => [...prev, blankRow(nextSort)]);
  };

  if (loading) {
    return (
      <div className="px-5 py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4">
      <div className="card-app p-3 flex items-start gap-2.5 border border-copper/20">
        <Scissors size={14} className="text-copper mt-0.5 flex-shrink-0" />
        <p className="text-muted-foreground text-[11px] leading-relaxed">{t.hint}</p>
      </div>

      {rows.length === 0 && (
        <div className="card-app p-8 text-center">
          <p className="text-muted-foreground text-sm">{t.noServices}</p>
        </div>
      )}

      {rows.map((r, i) => (
        <div key={r.id ?? `new-${i}`} className={`card-app p-4 space-y-3 ${!r.active ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.nameDe}</label>
              <input
                value={r.name}
                onChange={(e) => updateLocal(i, { name: e.target.value })}
                className="mt-1 w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-copper/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.nameEn}</label>
              <input
                value={r.name_en}
                onChange={(e) => updateLocal(i, { name_en: e.target.value })}
                className="mt-1 w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-copper/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.price}</label>
              <input
                type="number" step="0.5" min="0"
                value={r.price}
                onChange={(e) => updateLocal(i, { price: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-copper/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.durationMin}</label>
              <input
                type="number" step="5" min="5"
                value={r.duration_min}
                onChange={(e) => updateLocal(i, { duration_min: parseInt(e.target.value) || 30 })}
                className="mt-1 w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-copper/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.sortOrder}</label>
              <input
                type="number" min="0"
                value={r.sort_order}
                onChange={(e) => updateLocal(i, { sort_order: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-copper/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => updateLocal(i, { active: !r.active })}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                r.active ? "bg-mint/10 border-mint/40 text-mint" : "bg-surface border-border text-muted-foreground"
              }`}
            >
              {r.active ? t.active : t.inactive}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => deleteRow(i)}
                className="flex items-center gap-1 text-[11px] text-destructive bg-destructive/10 px-3 py-1.5 rounded-full"
              >
                <Trash2 size={12} />
              </button>
              <button
                onClick={() => saveRow(i)}
                disabled={savingId === (r.id ?? `new-${i}`)}
                className="flex items-center gap-1.5 text-[11px] gradient-copper text-primary-foreground font-semibold px-3 py-1.5 rounded-full disabled:opacity-50"
              >
                <Save size={12} /> {t.save}
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-surface border border-dashed border-copper/40 text-copper text-xs font-semibold hover:bg-copper/5"
      >
        <Plus size={14} /> {t.addService}
      </button>
    </div>
  );
};

export default ServicesTab;
