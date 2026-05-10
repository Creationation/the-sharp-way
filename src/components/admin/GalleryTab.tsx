import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Save, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GalleryTabT {
  title: string;
  uploadPhoto: string;
  uploading: string;
  uploaded: string;
  uploadError: string;
  category: string;
  sortOrder: string;
  active: string;
  inactive: string;
  save: string;
  saved: string;
  saveError: string;
  deleted: string;
  deleteError: string;
  loadError: string;
  confirmDelete: string;
  noImages: string;
  hint: string;
  categories: string[];
  filterAll: string;
}

interface ImageRow {
  id: string;
  image_url: string;
  category: number;
  sort_order: number;
  active: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const GalleryTab = ({ t }: { t: GalleryTabT }) => {
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState<number>(0);
  const [uploadCat, setUploadCat] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) { toast.error(t.loadError); setLoading(false); return; }
    setRows((data as ImageRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("gallery").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/gallery/${path}`;
      const nextSort = rows.length > 0 ? Math.max(...rows.map(r => r.sort_order)) + 1 : 1;
      const { error: insErr } = await supabase.from("gallery_images").insert({
        image_url: publicUrl,
        category: uploadCat,
        sort_order: nextSort,
        active: true,
      });
      if (insErr) throw insErr;
      toast.success(t.uploaded);
      fetchRows();
    } catch {
      toast.error(t.uploadError);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateLocal = (i: number, patch: Partial<ImageRow>) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };

  const saveRow = async (r: ImageRow) => {
    const { error } = await supabase.from("gallery_images").update({
      category: r.category,
      sort_order: r.sort_order,
      active: r.active,
    }).eq("id", r.id);
    if (error) { toast.error(t.saveError); return; }
    toast.success(t.saved);
    fetchRows();
  };

  const deleteRow = async (r: ImageRow) => {
    if (!confirm(t.confirmDelete)) return;
    // Try to delete from storage too — best-effort
    try {
      const path = r.image_url.split("/gallery/").pop();
      if (path) await supabase.storage.from("gallery").remove([path]);
    } catch { /* ignore */ }
    const { error } = await supabase.from("gallery_images").delete().eq("id", r.id);
    if (error) { toast.error(t.deleteError); return; }
    toast.success(t.deleted);
    fetchRows();
  };

  const filtered = filterCat === 0 ? rows : rows.filter(r => r.category === filterCat);

  return (
    <div className="px-5 space-y-4">
      <div className="card-app p-3 flex items-start gap-2.5 border border-copper/20">
        <ImageIcon size={14} className="text-copper mt-0.5 flex-shrink-0" />
        <p className="text-muted-foreground text-[11px] leading-relaxed">{t.hint}</p>
      </div>

      {/* Upload card */}
      <div className="card-app p-4 space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.category}</label>
          <select
            value={uploadCat}
            onChange={(e) => setUploadCat(parseInt(e.target.value))}
            className="mt-1 w-full bg-surface border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:border-copper/50"
          >
            {t.categories.map((c, idx) => (
              <option key={c} value={idx + 1}>{c}</option>
            ))}
          </select>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id="gallery-upload"
        />
        <label
          htmlFor="gallery-upload"
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-full gradient-copper text-primary-foreground font-semibold text-xs cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Upload size={14} /> {uploading ? t.uploading : t.uploadPhoto}
        </label>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setFilterCat(0)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
            filterCat === 0 ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {t.filterAll} · {rows.length}
        </button>
        {t.categories.map((c, idx) => {
          const i = idx + 1;
          const count = rows.filter(r => r.category === i).length;
          return (
            <button
              key={c}
              onClick={() => setFilterCat(i)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                filterCat === i ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
              }`}
            >
              {c} · {count}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-app p-8 text-center">
          <p className="text-muted-foreground text-sm">{t.noImages}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((r) => {
            const i = rows.findIndex(x => x.id === r.id);
            return (
              <div key={r.id} className={`card-app p-2 space-y-2 ${!r.active ? "opacity-60" : ""}`}>
                <div className="aspect-square rounded-xl overflow-hidden bg-surface">
                  <img src={r.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>

                <select
                  value={r.category}
                  onChange={(e) => updateLocal(i, { category: parseInt(e.target.value) })}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-copper/50"
                >
                  {t.categories.map((c, idx) => (
                    <option key={c} value={idx + 1}>{c}</option>
                  ))}
                </select>

                <input
                  type="number" min="0"
                  value={r.sort_order}
                  onChange={(e) => updateLocal(i, { sort_order: parseInt(e.target.value) || 0 })}
                  placeholder={t.sortOrder}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-copper/50"
                />

                <button
                  onClick={() => updateLocal(i, { active: !r.active })}
                  className={`w-full text-[10px] px-2 py-1 rounded-full border ${
                    r.active ? "bg-mint/10 border-mint/40 text-mint" : "bg-surface border-border text-muted-foreground"
                  }`}
                >
                  {r.active ? t.active : t.inactive}
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => deleteRow(r)}
                    className="flex-1 flex items-center justify-center gap-1 text-[11px] text-destructive bg-destructive/10 px-2 py-1.5 rounded-full"
                  >
                    <Trash2 size={11} />
                  </button>
                  <button
                    onClick={() => saveRow(r)}
                    className="flex-[2] flex items-center justify-center gap-1 text-[11px] gradient-copper text-primary-foreground font-semibold px-2 py-1.5 rounded-full"
                  >
                    <Save size={11} /> {t.save}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GalleryTab;
