import { useEffect, useState } from "react";
import { Phone, Mail, User, Calendar as CalIcon, Clock, UserCog, XCircle, Loader2, Save } from "lucide-react";
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

const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180];

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
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (!booking) return;
    setBarberName(booking.barber_name);
    setDate(parseISO(booking.booking_date));
    setTime(booking.booking_time.substring(0, 5));
    setDuration(parseDuration(booking.service_duration));

    let cancel = false;
    (async () => {
      setLoadingProfile(true);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("user_id", booking.user_id)
        .maybeSingle();
      if (!cancel) {
        setProfile(data || null);
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

  const handleSave = async () => {
    setSaving(true);
    const newDate = format(date, "yyyy-MM-dd");
    const newTime = time;
    const newDuration = `${duration} min`;
    const changes = {
      date: newDate !== booking.booking_date,
      time: newTime !== booking.booking_time.substring(0, 5),
      barber: barberName !== booking.barber_name,
      duration: newDuration !== booking.service_duration,
    };

    const { error } = await supabase
      .from("bookings")
      .update({
        barber_name: barberName,
        booking_date: newDate,
        booking_time: newTime,
        service_duration: newDuration,
      })
      .eq("id", booking.id);
    if (error) {
      setSaving(false);
      toast({ title: t.error, description: error.message, variant: "destructive" });
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
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);
    if (error) {
      setSaving(false);
      toast({ title: t.error, description: error.message, variant: "destructive" });
      return;
    }

    const results = await Promise.allSettled([
      supabase.functions.invoke("send-booking-update", {
        body: {
          booking_id: booking.id,
          changes: { cancelled: true },
          new_values: {},
        },
      }),
    ]);
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
        <section className="mb-4 grid grid-cols-2 gap-3">
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
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Clock size={12} /> {t.time}
            </label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="bg-surface border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border z-[100] max-h-64">
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Duration */}
        <section className="mb-5">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock size={12} /> {t.duration}
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  duration === d
                    ? "bg-copper text-bg-base border-copper"
                    : "bg-surface text-foreground border-border hover:border-copper/50"
                }`}
              >
                {d} {t.minutes}
              </button>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-2 pb-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-copper text-bg-base font-semibold rounded-lg py-3 text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t.save}
          </button>
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
