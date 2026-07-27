import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";
import { useLanguage } from "@/contexts/LanguageContext";

interface Photo {
  id: string;
  image_url: string;
  caption: string;
  sort_order: number;
  active: boolean;
}

interface Props {
  barberId: string;
  barberName: string;
}

const BarberPhotosManager = ({ barberId, barberName }: Props) => {
  const { lang } = useLanguage();
  const confirm = useConfirm();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const t = {
    title: lang === "de" ? "Kreationen" : "Creations",
    subtitle: lang === "de" ? "Fotos, die auf dem Profil erscheinen" : "Photos shown on the profile",
    add: lang === "de" ? "Foto hinzufügen" : "Add photo",
    uploading: lang === "de" ? "Wird hochgeladen…" : "Uploading…",
    empty: lang === "de" ? "Noch keine Fotos" : "No photos yet",
    deleteConfirm: lang === "de" ? "Foto wirklich löschen?" : "Really delete this photo?",
    deleted: lang === "de" ? "Foto gelöscht" : "Photo deleted",
    added: lang === "de" ? "Foto hinzugefügt" : "Photo added",
    error: lang === "de" ? "Fehler" : "Error",
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("barber_photos")
      .select("id, image_url, caption, sort_order, active")
      .eq("barber_id", barberId)
      .order("sort_order", { ascending: true });
    setPhotos((data as Photo[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [barberId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${barberId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("barber-photos")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      toast.error(t.error + ": " + upErr.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("barber-photos").getPublicUrl(path);
    const nextOrder = photos.length > 0 ? Math.max(...photos.map(p => p.sort_order)) + 1 : 0;
    const { error: insErr } = await supabase
      .from("barber_photos")
      .insert({ barber_id: barberId, image_url: urlData.publicUrl, sort_order: nextOrder });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (insErr) { toast.error(t.error + ": " + insErr.message); return; }
    toast.success(t.added);
    load();
  };

  const remove = async (id: string) => {
    const ok = await confirm({ description: t.deleteConfirm, destructive: true });
    if (!ok) return;
    const { error } = await supabase.from("barber_photos").delete().eq("id", id);
    if (error) { toast.error(t.error); return; }
    toast.success(t.deleted);
    load();
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-foreground text-sm font-semibold flex items-center gap-1.5">
            <ImageIcon size={14} className="text-copper" /> {t.title} · {barberName}
          </p>
          <p className="text-muted-foreground text-[11px]">{t.subtitle}</p>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 bg-copper text-bg-base text-xs font-semibold rounded-full px-3 py-1.5 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {uploading ? t.uploading : t.add}
        </button>
      </div>

      {loading ? (
        <div className="py-4 flex justify-center">
          <Loader2 size={16} className="animate-spin text-copper" />
        </div>
      ) : photos.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">{t.empty}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-surface border border-border group">
              <img src={p.image_url} alt={p.caption} className="w-full h-full object-cover" loading="lazy" />
              <button
                onClick={() => remove(p.id)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center opacity-90 hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 size={12} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BarberPhotosManager;
