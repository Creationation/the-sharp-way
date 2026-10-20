import { format } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { Clock, Repeat as RepeatIcon, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { repeatSummary, type Repeat, type RepeatPreset } from "@/lib/admin-appointments";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** 24-hour time picker (no AM/PM, independent of the phone's settings). */
function Time24({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [h, m] = [value.slice(0, 2) || "10", value.slice(3, 5) || "00"];
  const minutes = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort();
  return <div className="flex items-center gap-1">
    <Select value={h} onValueChange={v => onChange(`${v}:${m}`)}>
      <SelectTrigger aria-label={`${label} h`} className="bg-surface border-border text-foreground px-2"><SelectValue /></SelectTrigger>
      <SelectContent className="z-[100] bg-surface border-border max-h-64">{HOURS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
    </Select>
    <span className="text-muted-foreground">:</span>
    <Select value={m} onValueChange={v => onChange(`${h}:${v}`)}>
      <SelectTrigger aria-label={`${label} min`} className="bg-surface border-border text-foreground px-2"><SelectValue /></SelectTrigger>
      <SelectContent className="z-[100] bg-surface border-border max-h-64">{minutes.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}

export function AppointmentTimes({ start, end, onStart, onEnd }: { start: string; end: string; onStart: (s: string) => void; onEnd: (s: string) => void }) {
  const { lang } = useLanguage();
  return <section className="mb-4 grid grid-cols-2 gap-3">
    {[{ value: start, change: onStart, label: lang === "de" ? "Beginn" : "Start", key: "start" }, { value: end, change: onEnd, label: lang === "de" ? "Ende" : "End", key: "end" }].map(field => <div key={field.key} className="min-w-0">
      <span className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><Clock size={12} />{field.label}</span>
      <Time24 value={field.value} onChange={field.change} label={field.label} />
    </div>)}
  </section>;
}

const WEEKDAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function AppointmentRecurrence({ value, onChange, date, disabled = false }: { value: Repeat; onChange: (r: Repeat) => void; date: Date; disabled?: boolean }) {
  const { lang } = useLanguage();
  const de = lang === "de";
  const locale = de ? deLocale : enUS;
  const dayName = format(date, "EEEE", { locale });
  const defaultWeekday = (date.getDay() + 6) % 7;
  const selectedWeekdays = value.weekdays.length > 0 ? value.weekdays : [defaultWeekday];
  const selectedMonthDay = value.monthDay >= 1 ? value.monthDay : date.getDate();

  const presets: [RepeatPreset, string][] = [
    ["none", de ? "Nicht wiederholen" : "Does not repeat"],
    ["weekly", de ? `Jede Woche am ${dayName}` : `Every week on ${dayName}`],
    ["biweekly", de ? `Alle 2 Wochen am ${dayName}` : `Every 2 weeks on ${dayName}`],
    ["monthly", de ? `Jeden Monat am ${date.getDate()}.` : `Every month on day ${date.getDate()}`],
    ["custom", de ? "Benutzerdefiniert" : "Custom"],
  ];
  const units = {
    daily: de ? ["Tag", "Tage"] : ["day", "days"],
    weekly: de ? ["Woche", "Wochen"] : ["week", "weeks"],
    monthly: de ? ["Monat", "Monate"] : ["month", "months"],
    yearly: de ? ["Jahr", "Jahre"] : ["year", "years"],
  }[value.frequency];

  const toggleWeekday = (day: number) => {
    const has = selectedWeekdays.includes(day);
    if (has && selectedWeekdays.length === 1) return;
    onChange({ ...value, weekdays: has ? selectedWeekdays.filter(d => d !== day) : [...selectedWeekdays, day].sort((a, b) => a - b) });
  };
  const chip = (active: boolean) => cn("h-10 rounded-full border text-sm font-medium transition active:scale-95",
    active ? "bg-copper text-background border-copper" : "bg-surface border-border text-muted-foreground");
  const stepper = (val: number, set: (n: number) => void, min: number, max: number, label: string) => (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={de ? "Weniger" : "Less"} disabled={val <= min} onClick={() => set(Math.max(min, val - 1))} className="h-10 w-10 shrink-0 rounded-full border border-border bg-surface text-foreground flex items-center justify-center active:scale-95 disabled:opacity-40"><Minus size={15} /></button>
      <div className="flex-1 h-10 rounded-full border border-copper/50 bg-surface flex items-center justify-center text-sm text-foreground">{label}</div>
      <button type="button" aria-label={de ? "Mehr" : "More"} disabled={val >= max} onClick={() => set(Math.min(max, val + 1))} className="h-10 w-10 shrink-0 rounded-full border border-border bg-surface text-foreground flex items-center justify-center active:scale-95 disabled:opacity-40"><Plus size={15} /></button>
    </div>
  );

  return <section className="mb-5 space-y-4 border-t border-border pt-4">
    <div>
      <span className="text-sm text-foreground flex items-center gap-2 mb-2"><RepeatIcon size={15} className="text-copper" />{de ? "Wiederholung" : "Repeat"}</span>
      <Select value={value.preset} disabled={disabled} onValueChange={p => onChange({ ...value, preset: p as RepeatPreset })}>
        <SelectTrigger aria-label={de ? "Wiederholung" : "Repeat"} className="bg-surface border-border"><SelectValue /></SelectTrigger>
        <SelectContent className="z-[100] bg-surface border-border">{presets.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </div>

    {value.preset === "custom" && <>
      <div className="grid grid-cols-4 gap-1.5">
        {(["daily", "weekly", "monthly", "yearly"] as const).map((f, i) => (
          <button key={f} type="button" onClick={() => onChange({ ...value, frequency: f })} className={cn(chip(value.frequency === f), "text-xs")}>{(de ? ["Täglich", "Wöchentl.", "Monatl.", "Jährlich"] : ["Daily", "Weekly", "Monthly", "Yearly"])[i]}</button>
        ))}
      </div>
      <div>
        <span className="block text-xs text-muted-foreground mb-2">{de ? "Wiederholen alle" : "Repeat every"}</span>
        {stepper(value.interval, n => onChange({ ...value, interval: n }), 1, 100, `${value.interval} ${value.interval === 1 ? units[0] : units[1]}`)}
      </div>
      {value.frequency === "weekly" && <div>
        <span className="block text-xs text-muted-foreground mb-2">{de ? "An welchen Tagen?" : "On which days?"}</span>
        <div className="grid grid-cols-7 gap-1.5">
          {(de ? WEEKDAYS_DE : WEEKDAYS_EN).map((label, day) => <button key={day} type="button" onClick={() => toggleWeekday(day)} className={cn(chip(selectedWeekdays.includes(day)), "w-full text-xs")}>{label}</button>)}
        </div>
      </div>}
      {value.frequency === "monthly" && <div>
        <span className="block text-xs text-muted-foreground mb-2">{de ? "An welchem Tag im Monat?" : "On which day of the month?"}</span>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => <button key={day} type="button" onClick={() => onChange({ ...value, monthDay: day })} className={cn(chip(selectedMonthDay === day), "h-9 w-full text-xs")}>{day}</button>)}
        </div>
      </div>}
    </>}

    {value.preset !== "none" && <div className="space-y-2">
      <span className="block text-xs text-muted-foreground">{de ? "Ende" : "Ends"}</span>
      <div className="grid grid-cols-3 gap-1.5">
        {(["forever", "until", "count"] as const).map((k, i) => (
          <button key={k} type="button" onClick={() => onChange({ ...value, end: { ...value.end, type: k } })} className={cn(chip(value.end.type === k), "text-xs")}>{(de ? ["Für immer", "Bis Datum", "Anzahl"] : ["Forever", "Until date", "Count"])[i]}</button>
        ))}
      </div>
      {value.end.type === "until" && <Input type="date" aria-label={de ? "Bis Datum" : "Until date"} value={value.end.until} min={format(date, "yyyy-MM-dd")} onChange={e => onChange({ ...value, end: { ...value.end, until: e.target.value } })} className="bg-surface border-border text-foreground" />}
      {value.end.type === "count" && <div className="flex items-center gap-2">
        <Input type="number" inputMode="numeric" min={2} max={400} aria-label={de ? "Anzahl" : "Count"} value={value.end.count || ""} onChange={e => onChange({ ...value, end: { ...value.end, count: Math.min(400, Math.max(0, parseInt(e.target.value, 10) || 0)) } })} className="bg-surface border-border text-foreground w-24" />
        <span className="text-sm text-muted-foreground">{de ? "Termine" : "appointments"}</span>
      </div>}
    </div>}
    {value.preset !== "none" && <p className="text-xs text-copper">{repeatSummary(format(date, "yyyy-MM-dd"), value, de)}</p>}
  </section>;
}

export type EditScope = "this" | "following" | "all";
export function SeriesScopeDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (s: EditScope) => void }) {
  const { lang } = useLanguage();
  const de = lang === "de";
  const opts: [EditScope, string][] = [["this", de ? "Nur dieser Termin" : "This appointment only"], ["following", de ? "Dieser und folgende Termine" : "This and following appointments"], ["all", de ? "Alle Termine" : "All appointments"]];
  return <Dialog open={open} onOpenChange={o => !o && onClose()}>
    <DialogContent className="bg-card border-border z-[110] max-w-sm">
      <DialogHeader><DialogTitle className="text-copper">{de ? "Wiederholten Termin ändern" : "Edit repeating appointment"}</DialogTitle></DialogHeader>
      <div className="space-y-2">{opts.map(([k, l]) => <button key={k} type="button" onClick={() => onPick(k)} className="w-full text-left rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground hover:border-copper active:scale-[0.98] transition">{l}</button>)}</div>
    </DialogContent>
  </Dialog>;
}
