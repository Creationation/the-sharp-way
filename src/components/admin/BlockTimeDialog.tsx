import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Ban, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Barber { id: string; name: string; color: string }

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: Date;
  barbers: Barber[];
  onChanged: () => void;
}

// 30-minute slots of the working day
const SLOTS = Array.from({ length: 20 }, (_, i) => {
  const m = 9 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const END_OPTIONS = [...SLOTS.slice(1), "19:00"];

/** Group sorted slots into continuous ranges "09:00–10:30" */
const toRanges = (slots: string[]) => {
  const sorted = [...slots].sort();
  const ranges: { from: string; to: string; slots: string[] }[] = [];
  for (const s of sorted) {
    const idx = SLOTS.indexOf(s);
    const last = ranges[ranges.length - 1];
    if (last && SLOTS.indexOf(last.slots[last.slots.length - 1]) === idx - 1) {
      last.slots.push(s);
      last.to = END_OPTIONS[idx] ?? s;
    } else {
      ranges.push({ from: s, to: END_OPTIONS[idx] ?? s, slots: [s] });
    }
  }
  return ranges;
};

const BlockTimeDialog = ({ open, onOpenChange, date, barbers, onChanged }: Props) => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const [barber, setBarber] = useState("");
  const [from, setFrom] = useState("12:00");
  const [to, setTo] = useState("13:00");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [dayOff, setDayOff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const dateStr = format(date, "yyyy-MM-dd");

  useEffect(() => {
    if (open && !barber && barbers[0]) setBarber(barbers[0].name);
  }, [open, barbers, barber]);

  useEffect(() => {
    if (!open || !barber) return;
    let cancel = false;
    setLoading(true);
    supabase
      .from("barber_availability")
      .select("blocked_slots, day_off")
      .eq("barber_name", barber)
      .eq("date", dateStr)
      .maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        setBlocked(data?.blocked_slots ?? []);
        setDayOff(data?.day_off ?? false);
        setLoading(false);
      });
    return () => { cancel = true; };
  }, [open, barber, dateStr]);

  const save = async (slots: string[], off: boolean, msg: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("barber_availability")
      .upsert({ barber_name: barber, date: dateStr, blocked_slots: slots, day_off: off }, { onConflict: "barber_name,date" });
    setSaving(false);
    if (error) {
      toast({ title: de ? "Fehler beim Speichern" : "Error while saving", variant: "destructive" });
      return;
    }
    setBlocked(slots);
    setDayOff(off);
    toast({ title: msg });
    onChanged();
  };

  const addRange = () => {
    if (to <= from) {
      toast({ title: de ? "Ende muss nach dem Beginn liegen" : "End must be after start", variant: "destructive" });
      return;
    }
    const range = SLOTS.filter(s => s >= from && s < to);
    save([...new Set([...blocked, ...range])].sort(), dayOff, de ? `${barber} blockiert ${from}–${to}` : `${barber} blocked ${from}–${to}`);
  };

  const ranges = toRanges(blocked);
  const btn = "w-full rounded-lg py-3 text-sm font-semibold active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-[92vw] sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Ban size={18} className="text-copper" />
            {de ? "Zeit blockieren" : "Block time"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground text-left">
            {format(date, "dd.MM.yyyy")} · {de ? "Kunden können in dieser Zeit nicht buchen" : "Clients cannot book during this time"}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barber chips */}
          <div className="flex flex-wrap gap-2">
            {barbers.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBarber(b.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${barber === b.name ? "border-copper ring-1 ring-copper text-foreground" : "border-border text-muted-foreground opacity-60"}`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                {b.name}
              </button>
            ))}
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: de ? "Von" : "From", value: from, set: setFrom, opts: SLOTS },
              { label: de ? "Bis" : "To", value: to, set: setTo, opts: END_OPTIONS },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{f.label}</p>
                <Select value={f.value} onValueChange={f.set}>
                  <SelectTrigger className="bg-surface border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {f.opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <button type="button" disabled={saving || !barber || dayOff} onClick={addRange} className={`${btn} gradient-copper text-primary-foreground`}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            {de ? "Zeitraum blockieren" : "Block this time"}
          </button>

          <button
            type="button"
            disabled={saving || !barber}
            onClick={() => save(blocked, !dayOff, dayOff
              ? (de ? `${barber} ist wieder verfügbar` : `${barber} is available again`)
              : (de ? `${barber} ganzer Tag blockiert` : `${barber} blocked all day`))}
            className={`${btn} border ${dayOff ? "border-copper text-copper" : "border-border text-foreground"}`}
          >
            {dayOff ? (de ? "Ganzen Tag wieder freigeben" : "Unblock whole day") : (de ? "Ganzen Tag blockieren" : "Block whole day")}
          </button>

          {/* Current blocks */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              {de ? "Aktuelle Blockierungen" : "Current blocks"}
            </p>
            {loading ? (
              <Loader2 size={16} className="animate-spin text-copper" />
            ) : dayOff ? (
              <p className="text-sm text-foreground">{de ? "Ganzer Tag blockiert" : "Whole day blocked"}</p>
            ) : ranges.length === 0 ? (
              <p className="text-sm text-muted-foreground">{de ? "Keine Blockierungen" : "No blocks"}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ranges.map(r => (
                  <span key={r.from} className="flex items-center gap-1.5 bg-surface border border-border rounded-full pl-3 pr-1 py-1 text-xs text-foreground">
                    {r.from}–{r.to}
                    <button
                      type="button"
                      aria-label={de ? "Freigeben" : "Unblock"}
                      disabled={saving}
                      onClick={() => save(blocked.filter(s => !r.slots.includes(s)), dayOff, de ? `${r.from}–${r.to} freigegeben` : `${r.from}–${r.to} unblocked`)}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-muted"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockTimeDialog;
