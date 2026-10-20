import { AppointmentTimes, AppointmentRecurrence, SeriesScopeDialog, type EditScope } from "./AppointmentTiming";
import { defaultRepeat, parseRRule, buildRRule, rruleDates, truncateRRule, ruleStart, addDays, durationBetween, endTime, slotOverlaps, localYmd } from "@/lib/admin-appointments";
import { Button } from "@/components/ui/button";
import { parseWalkin } from "@/lib/walkin";
import { useEffect, useState } from "react";
import { Phone, Mail, User, Calendar as CalIcon, Clock, UserCog, XCircle, Loader2, Save, Ban, Minus, Plus, Users, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BookingDetail {
  id: string;
  user_id: string;
  barber_name: string;
  service_name: string;
  service_duration: string;
  booking_date: string;
  booking_time: string;
  status: string;
  service_price?: string | null;
  created_at?: string | null;
  notes?: string | null;
  payment_status?: string | null;
}

interface Barber {
  id: string;
  name: string;
  color: string;
}

interface Props {
  booking: BookingDetail | null;
  barbers: Barber[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const HOUR_OPTIONS = Array.from({ length: 12 * 2 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

const END_OPTIONS = [...HOUR_OPTIONS.slice(1), "21:00"];
const PERSONS_RE = /\+(\d+) (?:Person(?:en)?|persons?)/;


const parseDuration = (d: string): number => {
  const m = d.match(/\d+/);
  return m ? parseInt(m[0], 10) : 30;
};

const BookingDetailSheet = ({ booking, barbers, open, onOpenChange, onChanged }: Props) => {
  const { lang } = useLanguage();
  const dateLocale = lang === "de" ? deLocale : enUS;
  const confirm = useConfirm();
  const { toast } = useToast();

  const [profile, setProfile] = useState<{ full_name?: string; phone?: string; email?: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  const [barberName, setBarberName] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("09:00");
  const [extraPersons, setExtraPersons] = useState(0);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [dayOff, setDayOff] = useState(false);
  const [blockUntil, setBlockUntil] = useState("");
  const [end, setEnd] = useState("09:30");
  const [recurrence, setRecurrence] = useState(defaultRepeat);
  const [series, setSeries] = useState<{ id: string | null; rrule: string | null }>({ id: null, rrule: null });
  const [scopeFor, setScopeFor] = useState<null | "save" | "cancel">(null);

  useEffect(() => {
    if (!booking) return;
    setBarberName(booking.barber_name);
    setDate(parseISO(booking.booking_date));
    setTime(booking.booking_time.substring(0, 5));
    setEnd(endTime(booking.booking_time, parseDuration(booking.service_duration)));
    setRecurrence(defaultRepeat());
    setSeries({ id: null, rrule: null });
    supabase.from("bookings").select("recurrence_series_id, recurrence_rrule").eq("id", booking.id).maybeSingle().then(({ data }) => {
      if (cancel || !data) return;
      setSeries({ id: data.recurrence_series_id, rrule: data.recurrence_rrule });
      setRecurrence(parseRRule(data.recurrence_rrule));
    });

    let cancel = false;
    setExtraPersons(parseInt(booking.notes?.match(PERSONS_RE)?.[1] || "0", 10));
    setBlockUntil("");
    supabase
      .from("barber_availability")
      .select("blocked_slots, day_off")
      .eq("barber_name", booking.barber_name)
      .eq("date", booking.booking_date)
      .maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        setBlocked(data?.blocked_slots ?? []);
        setDayOff(data?.day_off ?? false);
      });
    (async () => {
      setLoadingProfile(true);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("user_id", booking.user_id)
        .maybeSingle();
      if (!cancel) {
        const w = parseWalkin(booking.notes);
        setProfile(w ? { full_name: w.name, phone: w.phone } : data || null);
        setLoadingProfile(false);
      }
    })();
    return () => { cancel = true; };
  }, [booking]);

  if (!booking) return null;

  const t = {
    title: lang === "de" ? "Termin-Details" : "Appointment details",
    customer: lang === "de" ? "Kunde" : "Customer",
    noProfile: lang === "de" ? "Kein Profil verfügbar" : "No profile available",
    call: lang === "de" ? "Anrufen" : "Call",
    email: lang === "de" ? "E-Mail" : "Email",
    assignBarber: lang === "de" ? "Mitarbeiter" : "Barber",
    date: lang === "de" ? "Datum" : "Date",
    time: lang === "de" ? "Uhrzeit" : "Time",
    duration: lang === "de" ? "Dauer" : "Duration",
    minutes: lang === "de" ? "Min" : "min",
    save: lang === "de" ? "Änderungen speichern" : "Save changes",
    cancelBooking: lang === "de" ? "Termin stornieren" : "Cancel booking",
    cancelConfirmTitle: lang === "de" ? "Termin stornieren?" : "Cancel booking?",
    cancelConfirmDesc: lang === "de"
      ? "Der Termin wird als storniert markiert und aus dem aktiven Plan entfernt."
      : "The booking will be marked as cancelled and removed from the active plan.",
    saved: lang === "de" ? "Gespeichert" : "Saved",
    cancelled: lang === "de" ? "Storniert" : "Cancelled",
    error: lang === "de" ? "Fehler beim Speichern" : "Failed to save",
  };

  const de = lang === "de";
  const start = booking.booking_time.substring(0, 5);
  // Continuous blocked range starting at this booking's time
  const myBlock: string[] = [];
  for (let i = HOUR_OPTIONS.findIndex(slot => slotOverlaps(slot, start, endTime(start, 1))); i >= 0 && i < HOUR_OPTIONS.length && blocked.includes(HOUR_OPTIONS[i]); i++) myBlock.push(HOUR_OPTIONS[i]);
  const myBlockEnd = myBlock.length ? END_OPTIONS[HOUR_OPTIONS.indexOf(myBlock[myBlock.length - 1])] : null;
  const untilValue = blockUntil || myBlockEnd || END_OPTIONS.find(o => o > start) || "";
  const durMin = parseInt(booking.service_duration) || 30;
  const endAt = new Date(`${booking.booking_date}T${start}:00`);
  endAt.setMinutes(endAt.getMinutes() + durMin);
  const isOver = booking.status === "completed" || endAt.getTime() < Date.now();

  const saveBlocked = async (slots: string[]) => {
    const { error } = await supabase.from("barber_availability").upsert(
      { barber_name: booking.barber_name, date: booking.booking_date, blocked_slots: slots, day_off: dayOff },
      { onConflict: "barber_name,date" }
    );
    if (error) { toast({ title: t.error, description: error.message, variant: "destructive" }); return false; }
    setBlocked(slots);
    onChanged();
    return true;
  };

  const handleBlock = async () => {
    setSaving(true);
    const range = HOUR_OPTIONS.filter(o => slotOverlaps(o, start, untilValue));
    const ok = await saveBlocked([...new Set([...blocked.filter(s => !myBlock.includes(s)), ...range])].sort());
    setSaving(false);
    if (ok) toast({ title: de ? `${booking.barber_name} blockiert ${start}–${untilValue}` : `${booking.barber_name} blocked ${start}–${untilValue}` });
  };

  const handleFinish = async () => {
    setSaving(true);
    const now = new Date();
    const isToday = booking.booking_date === format(now, "yyyy-MM-dd");
    const nowStr = format(now, "HH:mm");
    // Free every blocked slot of this booking from now on (or the whole block if not today)
    const toFree = myBlock.filter(s => !isToday || END_OPTIONS[HOUR_OPTIONS.indexOf(s)] > nowStr);
    const ok = await saveBlocked(blocked.filter(s => !toFree.includes(s)));
    if (ok && isToday && nowStr > start) {
      const [h, m] = start.split(":").map(Number);
      const elapsed = Math.max(30, Math.ceil(((now.getHours() * 60 + now.getMinutes()) - (h * 60 + m)) / 30) * 30);
      if (elapsed < parseDuration(booking.service_duration)) {
        await supabase.from("bookings").update({ service_duration: `${elapsed} min` }).eq("id", booking.id);
      }
    }
    setSaving(false);
    if (ok) {
      toast({ title: de ? `Termin beendet · ${booking.barber_name} wieder online buchbar` : `Appointment finished · ${booking.barber_name} bookable online again` });
      onChanged();
      onOpenChange(false);
    }
  };

  const handleSave = () => {
    if (series.id && series.rrule) setScopeFor("save");
    else save("following");
  };

  const save = async (scope: EditScope) => {
    setScopeFor(null);
    const newDate = format(date, "yyyy-MM-dd");
    let dates: string[] = [newDate];
    let rrule: string | null = null;
    let prevRule: string | null = null;
    let duration: number;
    try {
      duration = durationBetween(time, end);
      if (scope !== "this") {
        if (scope === "all" && series.rrule) {
          // keep the series start, shifted by however far this appointment moved
          const shift = Math.round((new Date(newDate).getTime() - new Date(booking.booking_date).getTime()) / 86400000);
          rrule = buildRRule(addDays(ruleStart(series.rrule), shift), recurrence);
        } else rrule = buildRRule(newDate, recurrence);
        if (rrule) {
          const today = localYmd(new Date());
          const from = scope === "all" ? today : newDate;
          dates = [newDate, ...rruleDates(rrule, from).filter(d => d !== newDate)];
        }
        if (scope === "following" && series.rrule) prevRule = truncateRRule(series.rrule, booking.booking_date);
      }
    } catch { toast({ title: de ? "Bitte Beginn, Ende und Wiederholung prüfen" : "Please check start, end and repetition", variant: "destructive" }); return; }
    setSaving(true);
    const newTime = time;
    const newDuration = `${duration} min`;
    const changes = {
      date: newDate !== booking.booking_date,
      time: newTime !== booking.booking_time.substring(0, 5),
      barber: barberName !== booking.barber_name,
      duration: newDuration !== booking.service_duration,
    };

    const { error } = await supabase.rpc("admin_save_series", { _source_id: booking.id, _dates: dates, _rrule: rrule, _scope: scope, _prev_rrule: prevRule, _booking: {
        barber_name: barberName,
        booking_date: newDate,
        booking_time: newTime,
        service_duration: newDuration,
        notes: (() => {
          const base = (booking.notes || "").replace(PERSONS_RE, "").replace(/(^\s*·\s*|\s*·\s*$)/g, "").replace(/\s*·\s*·\s*/g, " · ").trim();
          const tag = extraPersons > 0 ? (de ? `+${extraPersons} Person${extraPersons > 1 ? "en" : ""}` : `+${extraPersons} person${extraPersons > 1 ? "s" : ""}`) : "";
          return [tag, base].filter(Boolean).join(" · ") || null;
        })(),
      } });
    if (error) {
      setSaving(false);
      toast({ title: t.error, description: error.message.includes("Hour full") ? (de ? "Eine Stunde ist voll (max. 10 Termine). Es wurde nichts gespeichert." : "An hour is full (max. 10 appointments). Nothing was saved.") : error.message, variant: "destructive" });
      return;
    }

    if (changes.date || changes.time || changes.barber || changes.duration) {
      const results = await Promise.allSettled([
        supabase.functions.invoke("send-booking-update", {
          body: {
            booking_id: booking.id,
            changes,
            new_values: {
              date: newDate,
              time: newTime,
              barber: barberName,
              duration: newDuration,
            },
          },
        }),
      ]);
      results.forEach((r) => {
        if (r.status === "rejected") console.error("[booking-update] notify failed:", r.reason);
      });
    }

    setSaving(false);
    toast({ title: t.saved });
    onChanged();
    onOpenChange(false);
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: t.cancelConfirmTitle,
      description: t.cancelConfirmDesc,
      destructive: true,
      confirmText: t.cancelBooking,
    });
    if (!ok) return;
    if (series.id && series.rrule) setScopeFor("cancel");
    else cancelScope("this");
  };

  const cancelScope = async (scope: EditScope) => {
    setScopeFor(null);
    setSaving(true);
    const { data: ids, error } = await supabase.rpc("admin_remove_series", {
      _source_id: booking.id, _scope: scope, _mode: "cancel",
      _prev_rrule: scope === "following" && series.rrule ? truncateRRule(series.rrule, booking.booking_date) : null,
    });
    if (error) {
      setSaving(false);
      toast({ title: t.error, description: error.message, variant: "destructive" });
      return;
    }

    // One notification only (for this appointment), not one per copy
    void ids;
    const results = await Promise.allSettled([
      supabase.functions.invoke("send-booking-update", {
        body: { booking_id: booking.id, changes: { cancelled: true }, new_values: {} },
      })]);
    results.forEach((r) => {
      if (r.status === "rejected") console.error("[booking-cancel] notify failed:", r.reason);
    });

    setSaving(false);
    toast({ title: t.cancelled });
    onChanged();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <span className="text-copper">{booking.service_name}</span>
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(booking.booking_date), "EEEE dd MMM yyyy", { locale: dateLocale })} · {booking.booking_time.substring(0, 5)}
          </p>
        </SheetHeader>

        {/* Customer */}
        <section className="mb-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{t.customer}</p>
          <div className="card-app p-3 space-y-2">
            {loadingProfile ? (
              <Loader2 className="animate-spin text-copper" size={16} />
            ) : profile ? (
              <>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <User size={14} className="text-copper" />
                  <span>{profile.full_name || "—"}</span>
                </div>
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-sm text-copper hover:underline">
                    <Phone size={14} />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-sm text-copper hover:underline break-all">
                    <Mail size={14} />
                    <span>{profile.email}</span>
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noProfile}</p>
            )}
          </div>
        </section>

        {/* Booking info */}
        <section className="mb-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            {lang === "de" ? "Termin-Infos" : "Booking info"}
          </p>
          <div className="card-app p-3 space-y-1.5 text-sm">
            {[
              [lang === "de" ? "Mitarbeiter" : "Barber", booking.barber_name],
              [lang === "de" ? "Leistung" : "Service", booking.service_name],
              [lang === "de" ? "Preis" : "Price", booking.service_price],
              [t.duration, booking.service_duration],
              [lang === "de" ? "Status" : "Status", booking.status],
              [lang === "de" ? "Zahlung" : "Payment", booking.payment_status],
              [
                lang === "de" ? "Gebucht am" : "Booked on",
                booking.created_at ? format(parseISO(booking.created_at), "dd.MM.yyyy · HH:mm", { locale: dateLocale }) : null,
              ],
              [lang === "de" ? "Notiz" : "Note", booking.notes],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground text-right break-words">{v}</span>
                </div>
              ))}
          </div>
        </section>

        {/* Assign barber */}
        <section className="mb-4">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <UserCog size={12} /> {t.assignBarber}
          </label>
          <Select value={barberName} onValueChange={setBarberName}>
            <SelectTrigger className="bg-surface border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-[100]">
              {barbers.map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Date + Time */}
        <section className="mb-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <CalIcon size={12} /> {t.date}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground text-left">
                  {format(date, "dd MMM yyyy", { locale: dateLocale })}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface border-border z-[100]" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={dateLocale}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </section>
        <AppointmentTimes start={time} end={end} onStart={setTime} onEnd={setEnd} />
        <AppointmentRecurrence value={recurrence} onChange={setRecurrence} date={date} disabled={booking.status === "cancelled" || isOver} />
        <SeriesScopeDialog open={scopeFor !== null} onClose={() => setScopeFor(null)} onPick={s => scopeFor === "cancel" ? cancelScope(s) : save(s)} title={scopeFor === "cancel" ? (de ? "Wiederholten Termin stornieren" : "Cancel repeating appointment") : undefined} />

        {/* Extra persons */}
        <section className="mb-4">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users size={12} /> {de ? "Zusätzliche Personen" : "Additional people"}
          </label>
          <div className="flex items-center justify-between bg-surface border border-border rounded-md px-2 py-1.5">
            <button type="button" aria-label="-" onClick={() => setExtraPersons(n => Math.max(0, n - 1))} disabled={extraPersons === 0}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground active:scale-95 disabled:opacity-40">
              <Minus size={14} />
            </button>
            <span className="text-sm font-semibold text-foreground">{extraPersons === 0 ? (de ? "Keine" : "None") : `+${extraPersons}`}</span>
            <button type="button" aria-label="+" onClick={() => setExtraPersons(n => Math.min(9, n + 1))} disabled={extraPersons === 9}
              className="w-8 h-8 rounded-full border border-copper text-copper flex items-center justify-center active:scale-95 disabled:opacity-40">
              <Plus size={14} />
            </button>
          </div>
        </section>

        {/* Block time for this booking */}
        {booking.status !== "cancelled" && !isOver && (
          <section className="mb-5 card-app p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Ban size={14} className="text-copper" />
                {de ? `Zeit für ${booking.barber_name} blockieren` : `Block time for ${booking.barber_name}`}
              </span>
              {myBlockEnd && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-copper/15 text-copper">
                  {start}–{myBlockEnd}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">{de ? `Ab ${start} bis` : `From ${start} to`}</span>
              <Select value={untilValue} onValueChange={setBlockUntil}>
                <SelectTrigger className="bg-surface border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface border-border z-[100] max-h-64">
                  {END_OPTIONS.filter(o => o > start).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <button type="button" onClick={handleBlock} disabled={saving || !untilValue}
              className="w-full border border-copper text-copper font-semibold rounded-lg py-2.5 text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50">
              <Ban size={15} />
              {myBlockEnd ? (de ? "Blockierung ändern" : "Update block") : (de ? "Zeit blockieren" : "Block time")}
            </button>
            {myBlockEnd && (
              <button type="button" onClick={handleFinish} disabled={saving}
                className="w-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold rounded-lg py-2.5 text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50">
                <CheckCircle2 size={15} />
                {de ? "Termin beendet · Zeit freigeben" : "Appointment finished · free time"}
              </button>
            )}
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pb-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-copper text-bg-base font-semibold rounded-lg py-3 text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t.save}
          </Button>
          {booking.status !== "cancelled" && (
            <button
              onClick={handleCancel}
              disabled={saving}
              className="w-full bg-destructive/10 text-destructive border border-destructive/30 font-semibold rounded-lg py-3 text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle size={16} />
              {t.cancelBooking}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingDetailSheet;
