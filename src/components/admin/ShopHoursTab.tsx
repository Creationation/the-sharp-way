import { useEffect, useState } from "react";
import { Clock, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShopHour {
  weekday: number; // 0 = Monday … 6 = Sunday
  is_open: boolean;
  open_time: string;
  close_time: string;
}

const DAYS: Record<string, string[]> = {
  de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

const hhmm = (v: string) => String(v).slice(0, 5);

const DEFAULTS: ShopHour[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  is_open: weekday !== 6,
  open_time: "09:00",
  close_time: "19:00",
}));

// JS getDay() (0=Sun) -> our weekday (0=Mon)
const todayIndex = () => (new Date().getDay() + 6) % 7;

const ShopHoursTab = () => {
  const { lang } = useLanguage();
  const de = lang !== "en";
  const days = DAYS[de ? "de" : "en"];

  const [hours, setHours] = useState<ShopHour[]>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("shop_hours")
      .select("weekday, is_open, open_time, close_time")
      .order("weekday");
    const byDay = new Map<number, any>((data ?? []).map((r: any) => [r.weekday, r]));
    setHours(
      DEFAULTS.map(d => {
        const row = byDay.get(d.weekday);
        return row
          ? {
              weekday: d.weekday,
              is_open: row.is_open,
              open_time: hhmm(row.open_time),
              close_time: hhmm(row.close_time),
            }
          : d;
      })
    );
    setLoading(false);
  };

  const updateDay = (weekday: number, patch: Partial<ShopHour>) =>
    setHours(prev => prev.map(h => (h.weekday === weekday ? { ...h, ...patch } : h)));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("shop_hours")
      .upsert(hours, { onConflict: "weekday" });
    setSaving(false);
    if (error) {
      toast.error(de ? "Speichern fehlgeschlagen" : "Save failed");
      return;
    }
    toast.success(de ? "Öffnungszeiten gespeichert" : "Opening hours saved");
    fetchHours();
  };

  const idx = todayIndex();
  const today = hours.find(h => h.weekday === idx);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  const openNow = !!today?.is_open && nowMin >= toMin(today.open_time) && nowMin < toMin(today.close_time);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4">
      {/* Live status */}
      <div className="card-app p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${openNow ? "bg-mint animate-pulse-dot" : "bg-muted-foreground"}`} />
          <span className={`text-xs font-medium ${openNow ? "text-mint" : "text-muted-foreground"}`}>
            {openNow ? (de ? "Jetzt geöffnet" : "Open now") : de ? "Jetzt geschlossen" : "Closed now"}
          </span>
        </div>
        <p className="text-foreground text-sm">
          {days[idx]} ·{" "}
          {today?.is_open
            ? `${today.open_time} – ${today.close_time}`
            : de
            ? "Geschlossen"
            : "Closed"}
        </p>
        <p className="text-muted-foreground text-[11px] mt-1">
          {de ? "Aktuelle Uhrzeit: " : "Current time: "}
          {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Clock size={16} className="text-copper" />
        <h4 className="text-foreground font-heading text-sm tracking-wide">
          {de ? "Öffnungszeiten" : "Opening hours"}
        </h4>
      </div>

      <div className="space-y-2">
        {hours.map(h => (
          <div
            key={h.weekday}
            className={`flex items-center gap-2 bg-surface border rounded-xl px-3 py-2 ${
              h.weekday === idx ? "border-copper/50" : "border-border"
            } ${h.is_open ? "" : "opacity-60"}`}
          >
            <button onClick={() => updateDay(h.weekday, { is_open: !h.is_open })} className="flex-shrink-0">
              {h.is_open ? (
                <ToggleRight size={24} className="text-mint" />
              ) : (
                <ToggleLeft size={24} className="text-muted-foreground" />
              )}
            </button>
            <span className="text-xs text-foreground w-20 flex-shrink-0">{days[h.weekday]}</span>
            <input
              type="time"
              step={1800}
              value={h.open_time}
              disabled={!h.is_open}
              onChange={e => updateDay(h.weekday, { open_time: e.target.value })}
              className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-copper/50 disabled:opacity-50"
            />
            <span className="text-muted-foreground text-xs">·</span>
            <input
              type="time"
              step={1800}
              value={h.close_time}
              disabled={!h.is_open}
              onChange={e => updateDay(h.weekday, { close_time: e.target.value })}
              className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-copper/50 disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full gradient-copper text-primary-foreground font-semibold py-3 rounded-full shadow-copper flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
      >
        <Save size={15} />
        {saving ? "..." : de ? "Öffnungszeiten speichern" : "Save opening hours"}
      </button>

      <p className="text-[11px] text-muted-foreground">
        {de
          ? "Diese Zeiten werden auf der Kontaktseite angezeigt."
          : "These hours are displayed on the contact page."}
      </p>
    </div>
  );
};

export default ShopHoursTab;
