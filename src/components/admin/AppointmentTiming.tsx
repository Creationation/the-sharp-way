import { useId } from "react";
import { Clock, Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Recurrence } from "@/lib/admin-appointments";

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

export function AppointmentRecurrence({ value, onChange, disabled = false }: { value: Recurrence; onChange: (r: Recurrence) => void; disabled?: boolean }) {
  const { lang } = useLanguage();
  const de = lang === "de";
  const id = useId();
  return <section className="mb-5 space-y-3 border-t border-border pt-4">
    <div className="flex items-center justify-between gap-3"><label htmlFor={id} className="flex items-center gap-2 text-sm text-foreground"><Repeat size={15} className="text-copper" />{de ? "Wiederholung" : "Repeat"}</label><Switch id={id} checked={value.enabled} disabled={disabled} onCheckedChange={enabled => onChange({ ...value, enabled })} /></div>
    {value.enabled && <>
      <Select value={value.frequency} onValueChange={frequency => onChange({ ...value, frequency: frequency as Recurrence["frequency"] })}>
        <SelectTrigger aria-label={de ? "Wiederholungsrhythmus" : "Repeat frequency"} className="bg-surface border-border"><SelectValue /></SelectTrigger>
        <SelectContent className="z-[100] bg-surface border-border">{(["daily", "weekly", "monthly", "yearly"] as const).map((f, i) => <SelectItem key={f} value={f}>{(de ? ["Täglich", "Wöchentlich", "Monatlich", "Jährlich"] : ["Daily", "Weekly", "Monthly", "Yearly"])[i]}</SelectItem>)}</SelectContent>
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <div><label htmlFor={`${id}-interval`} className="block text-xs text-muted-foreground mb-2">{de ? "Intervall" : "Interval"} ({({ daily: de ? "Tage" : "days", weekly: de ? "Wochen" : "weeks", monthly: de ? "Monate" : "months", yearly: de ? "Jahre" : "years" })[value.frequency]})</label><Input id={`${id}-interval`} type="number" min={1} max={100} value={value.interval} onChange={e => onChange({ ...value, interval: Number(e.target.value) })} className="bg-surface" /></div>
        <div><label htmlFor={`${id}-count`} className="block text-xs text-muted-foreground mb-2">{de ? "Termine insgesamt" : "Total appointments"}</label><Input id={`${id}-count`} type="number" min={2} max={366} value={value.count} onChange={e => onChange({ ...value, count: Number(e.target.value) })} className="bg-surface" /></div>
      </div>
    </>}
  </section>;
}