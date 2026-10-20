import { useId } from "react";
import { Clock, Repeat, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Recurrence } from "@/lib/admin-appointments";
import { cn } from "@/lib/utils";

export function AppointmentTimes({ start, end, onStart, onEnd }: { start: string; end: string; onStart: (s: string) => void; onEnd: (s: string) => void }) {
  const { lang } = useLanguage();
  const id = useId();
  return <section className="mb-4 grid grid-cols-2 gap-3">
    {[{ value: start, change: onStart, label: lang === "de" ? "Beginn" : "Start", key: "start" }, { value: end, change: onEnd, label: lang === "de" ? "Ende" : "End", key: "end" }].map(field => <div key={field.key} className="min-w-0">
      <label htmlFor={`${id}-${field.key}`} className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><Clock size={12} />{field.label}</label>
      <Input id={`${id}-${field.key}`} type="time" value={field.value} onChange={e => field.change(e.target.value)} className="bg-surface border-border text-foreground min-w-0" required />
    </div>)}
  </section>;
}

const WEEKDAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const COUNT_OPTIONS = [4, 8, 12, 24, 52];

export function AppointmentRecurrence({ value, onChange, date, disabled = false }: { value: Recurrence; onChange: (r: Recurrence) => void; date: Date; disabled?: boolean }) {
  const { lang } = useLanguage();
  const de = lang === "de";
  const id = useId();

  const defaultWeekday = (date.getDay() + 6) % 7; // 0 = Monday
  const selectedWeekdays = value.weekdays.length > 0 ? value.weekdays : [defaultWeekday];
  const selectedMonthDay = value.monthDay >= 1 ? value.monthDay : date.getDate();

  const units = {
    daily: de ? ["Tag", "Tage"] : ["day", "days"],
    weekly: de ? ["Woche", "Wochen"] : ["week", "weeks"],
    monthly: de ? ["Monat", "Monate"] : ["month", "months"],
    yearly: de ? ["Jahr", "Jahre"] : ["year", "years"],
  }[value.frequency];

  const toggleWeekday = (day: number) => {
    const has = selectedWeekdays.includes(day);
    if (has && selectedWeekdays.length === 1) return; // keep at least one day
    onChange({ ...value, weekdays: has ? selectedWeekdays.filter(d => d !== day) : [...selectedWeekdays, day].sort((a, b) => a - b) });
  };

  const chip = (active: boolean) => cn(
    "h-10 rounded-full border text-sm font-medium transition active:scale-95",
    active ? "bg-copper text-background border-copper" : "bg-surface border-border text-muted-foreground"
  );

  return <section className="mb-5 space-y-4 border-t border-border pt-4">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="flex items-center gap-2 text-sm text-foreground"><Repeat size={15} className="text-copper" />{de ? "Wiederholung" : "Repeat"}</label>
      <Switch id={id} checked={value.enabled} disabled={disabled} onCheckedChange={enabled => onChange({ ...value, enabled })} />
    </div>
    {value.enabled && <>
      <Select value={value.frequency} onValueChange={frequency => onChange({ ...value, frequency: frequency as Recurrence["frequency"] })}>
        <SelectTrigger aria-label={de ? "Wiederholungsrhythmus" : "Repeat frequency"} className="bg-surface border-border"><SelectValue /></SelectTrigger>
        <SelectContent className="z-[100] bg-surface border-border">{(["daily", "weekly", "monthly", "yearly"] as const).map((f, i) => <SelectItem key={f} value={f}>{(de ? ["Täglich", "Wöchentlich", "Monatlich", "Jährlich"] : ["Daily", "Weekly", "Monthly", "Yearly"])[i]}</SelectItem>)}</SelectContent>
      </Select>

      {/* Interval stepper: "Nach 1 Woche" */}
      <div>
        <span className="block text-xs text-muted-foreground mb-2">{de ? "Wiederholen alle" : "Repeat every"}</span>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={de ? "Weniger" : "Less"} disabled={value.interval <= 1} onClick={() => onChange({ ...value, interval: Math.max(1, value.interval - 1) })} className="h-10 w-10 shrink-0 rounded-full border border-border bg-surface text-foreground flex items-center justify-center active:scale-95 transition disabled:opacity-40"><Minus size={15} /></button>
          <div className="flex-1 h-10 rounded-full border border-copper/50 bg-surface flex items-center justify-center text-sm text-foreground">
            {value.interval} {value.interval === 1 ? units[0] : units[1]}
          </div>
          <button type="button" aria-label={de ? "Mehr" : "More"} disabled={value.interval >= 100} onClick={() => onChange({ ...value, interval: Math.min(100, value.interval + 1) })} className="h-10 w-10 shrink-0 rounded-full border border-border bg-surface text-foreground flex items-center justify-center active:scale-95 transition disabled:opacity-40"><Plus size={15} /></button>
        </div>
      </div>

      {/* Weekly: weekday circles */}
      {value.frequency === "weekly" && <div>
        <span className="block text-xs text-muted-foreground mb-2">{de ? "An welchen Tagen?" : "On which days?"}</span>
        <div className="grid grid-cols-7 gap-1.5">
          {(de ? WEEKDAYS_DE : WEEKDAYS_EN).map((label, day) => (
            <button key={day} type="button" onClick={() => toggleWeekday(day)} className={cn(chip(selectedWeekdays.includes(day)), "h-10 w-full text-xs")}>{label}</button>
          ))}
        </div>
      </div>}

      {/* Monthly: day of month */}
      {value.frequency === "monthly" && <div>
        <span className="block text-xs text-muted-foreground mb-2">{de ? "An welchem Tag im Monat?" : "On which day of the month?"}</span>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <button key={day} type="button" onClick={() => onChange({ ...value, monthDay: day })} className={cn(chip(selectedMonthDay === day), "h-9 w-full text-xs")}>{day}</button>
          ))}
        </div>
      </div>}

      {/* Count: preset buttons instead of a number field */}
      <div>
        <span className="block text-xs text-muted-foreground mb-2">{de ? "Wie oft insgesamt?" : "How many times in total?"}</span>
        <div className="grid grid-cols-5 gap-1.5">
          {COUNT_OPTIONS.map(count => (
            <button key={count} type="button" onClick={() => onChange({ ...value, count })} className={cn(chip(value.count === count), "h-10 w-full text-sm")}>{count}×</button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {de ? `${value.count} Termine werden erstellt.` : `${value.count} appointments will be created.`}
        </p>
      </div>
    </>}
  </section>;
}
