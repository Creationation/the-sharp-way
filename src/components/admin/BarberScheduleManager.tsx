import { useEffect, useState } from "react";
import { Clock, Plane, Plus, Trash2, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConfirm } from "@/hooks/useConfirm";

interface WorkingHour {
  id?: string;
  weekday: number;
  active: boolean;
  start_time: string;
  end_time: string;
}

interface Absence {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

const WEEKDAYS: Record<string, string[]> = {
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

// Monday-first display order
const ORDER = [1, 2, 3, 4, 5, 6, 0];

const DEFAULTS: WorkingHour[] = ORDER.map(weekday => ({
  weekday,
  active: weekday !== 0,
  start_time: "09:00",
  end_time: "18:00",
}));

const hhmm = (v: string) => String(v).slice(0, 5);

const BarberScheduleManager = ({ barberId }: { barberId: string }) => {
  const { lang } = useLanguage();
  const de = lang !== "en";
  const days = WEEKDAYS[de ? "de" : "en"];
  const confirmDialog = useConfirm();

  const [hours, setHours] = useState<WorkingHour[]>(DEFAULTS);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId]);

  const fetchAll = async () => {
    setLoading(true);
    const [hRes, aRes] = await Promise.all([
      supabase
        .from("barber_working_hours")
        .select("id, weekday, active, start_time, end_time")
        .eq("barber_id", barberId),
      supabase
        .from("barber_absences")
        .select("id, start_date, end_date, reason")
        .eq("barber_id", barberId)
        .order("start_date"),
    ]);

    const byDay = new Map<number, any>((hRes.data ?? []).map((r: any) => [r.weekday, r]));
    setHours(
      ORDER.map(weekday => {
        const row = byDay.get(weekday);
        return row
          ? { id: row.id, weekday, active: row.active, start_time: hhmm(row.start_time), end_time: hhmm(row.end_time) }
          : DEFAULTS.find(d => d.weekday === weekday)!;
      })
    );
    setAbsences((aRes.data ?? []) as Absence[]);
    setLoading(false);
  };

  const updateDay = (weekday: number, patch: Partial<WorkingHour>) => {
    setHours(prev => prev.map(h => (h.weekday === weekday ? { ...h, ...patch } : h)));
  };

  const saveHours = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("barber_working_hours")
      .upsert(
        hours.map(h => ({
          barber_id: barberId,
          weekday: h.weekday,
          active: h.active,
          start_time: h.start_time,
          end_time: h.end_time,
        })),
        { onConflict: "barber_id,weekday" }
      );
    setSaving(false);
    if (error) {
      toast.error(de ? "Speichern fehlgeschlagen" : "Save failed");
      return;
    }
    toast.success(de ? "Arbeitszeiten gespeichert" : "Working hours saved");
    fetchAll();
  };

  const addAbsence = async () => {
    if (!newStart || !newEnd) {
      toast.error(de ? "Bitte Start- und Enddatum wählen" : "Please pick start and end date");
      return;
    }
    if (newEnd < newStart) {
      toast.error(de ? "Enddatum liegt vor dem Startdatum" : "End date is before start date");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("barber_absences").insert({
      barber_id: barberId,
      start_date: newStart,
      end_date: newEnd,
      reason: newReason,
    });
    setAdding(false);
    if (error) {
      toast.error(de ? "Hinzufügen fehlgeschlagen" : "Could not add absence");
      return;
    }
    setNewStart("");
    setNewEnd("");
    setNewReason("");
    toast.success(de ? "Abwesenheit hinzugefügt" : "Absence added");
    fetchAll();
  };

  const deleteAbsence = async (id: string) => {
    const ok = await confirmDialog({
      description: de ? "Diese Abwesenheit wirklich löschen?" : "Delete this absence?",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("barber_absences").delete().eq("id", id);
    if (error) {
      toast.error(de ? "Löschen fehlgeschlagen" : "Delete failed");
      return;
    }
    setAbsences(prev => prev.filter(a => a.id !== id));
    toast.success(de ? "Abwesenheit gelöscht" : "Absence deleted");
  };

  const fmt = (d: string) => {
    const [y, m, day] = d.split("-");
    return de ? `${day}.${m}.${y}` : `${y}-${m}-${day}`;
  };

  const restDays = hours.filter(h => !h.active).map(h => days[h.weekday]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-5">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-copper" />
        <h4 className="text-foreground font-heading text-sm tracking-wide">
          {de ? "Arbeitszeiten & Abwesenheiten" : "Working hours & absences"}
        </h4>
      </div>

      {/* Weekly hours */}
      <div className="space-y-2">
        {hours.map(h => (
          <div
            key={h.weekday}
            className={`flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 ${h.active ? "" : "opacity-60"}`}
          >
            <button onClick={() => updateDay(h.weekday, { active: !h.active })} className="flex-shrink-0">
              {h.active ? (
                <ToggleRight size={24} className="text-mint" />
              ) : (
                <ToggleLeft size={24} className="text-muted-foreground" />
              )}
            </button>
            <span className="text-xs text-foreground w-24 flex-shrink-0">{days[h.weekday]}</span>
            <input
              type="time"
              step={1800}
              value={h.start_time}
              disabled={!h.active}
              onChange={e => updateDay(h.weekday, { start_time: e.target.value })}
              className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-copper/50 disabled:opacity-50"
            />
            <span className="text-muted-foreground text-xs">·</span>
            <input
              type="time"
              step={1800}
              value={h.end_time}
              disabled={!h.active}
              onChange={e => updateDay(h.weekday, { end_time: e.target.value })}
              className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-copper/50 disabled:opacity-50"
            />
          </div>
        ))}

        <p className="text-[11px] text-muted-foreground">
          {de ? "Ruhetage: " : "Days off: "}
          {restDays.length ? restDays.join(" · ") : de ? "keine" : "none"}
        </p>

        <button
          onClick={saveHours}
          disabled={saving}
          className="w-full gradient-copper text-primary-foreground font-semibold py-2.5 rounded-full shadow-copper flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          <Save size={14} />
          {saving ? "..." : de ? "Arbeitszeiten speichern" : "Save working hours"}
        </button>
      </div>

      {/* Absences */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Plane size={15} className="text-copper" />
          <h5 className="text-foreground text-xs font-medium">
            {de ? "Urlaub / Abwesenheiten" : "Vacation / absences"}
          </h5>
        </div>

        {absences.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            {de ? "Keine Abwesenheiten hinterlegt" : "No absences yet"}
          </p>
        )}

        {absences.map(a => (
          <div key={a.id} className="flex items-center justify-between bg-surface border border-border rounded-xl px-3 py-2">
            <div>
              <p className="text-xs text-foreground">
                {fmt(a.start_date)} · {fmt(a.end_date)}
              </p>
              {a.reason && <p className="text-[11px] text-muted-foreground">{a.reason}</p>}
            </div>
            <button
              onClick={() => deleteAbsence(a.id)}
              className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0"
            >
              <Trash2 size={13} className="text-destructive" />
            </button>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={newStart}
            onChange={e => setNewStart(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-copper/50"
          />
          <input
            type="date"
            value={newEnd}
            onChange={e => setNewEnd(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-copper/50"
          />
        </div>
        <input
          value={newReason}
          onChange={e => setNewReason(e.target.value)}
          placeholder={de ? "Grund (optional)" : "Reason (optional)"}
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-copper/50"
        />
        <button
          onClick={addAbsence}
          disabled={adding}
          className="w-full card-app py-2.5 flex items-center justify-center gap-2 text-copper font-semibold text-xs border-dashed border-2 border-copper/30 hover:border-copper/50 transition-colors disabled:opacity-50"
        >
          <Plus size={15} />
          {de ? "Abwesenheit hinzufügen" : "Add absence"}
        </button>
      </div>
    </div>
  );
};

export default BarberScheduleManager;
