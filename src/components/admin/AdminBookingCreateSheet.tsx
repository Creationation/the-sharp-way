import { useEffect, useState, useMemo } from "react";
import { Calendar as CalIcon, Clock, UserCog, Loader2, Save, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBarbers } from "@/hooks/useBarbers";
import { useServices } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  defaultDate?: Date;
  defaultBarberName?: string;
  defaultTime?: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const HOUR_OPTIONS = Array.from({ length: 12 * 2 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

const AdminBookingCreateSheet = ({
  open, onOpenChange, onCreated, defaultDate, defaultBarberName, defaultTime,
}: Props) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const dateLocale = lang === "de" ? deLocale : enUS;
  const { toast } = useToast();
  const { barbers } = useBarbers();
  const { services } = useServices();

  const [mode, setMode] = useState<"existing" | "walkin">("walkin");
  const [barberName, setBarberName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Walk-in
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");

  // Existing customer search
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBarberName(defaultBarberName || barbers[0]?.name || "");
    setServiceId("");
    setDate(defaultDate || new Date());
    setTime(defaultTime || "10:00");
    setNotes("");
    setMode("walkin");
    setWalkinName("");
    setWalkinPhone("");
    setSearch("");
    setResults([]);
    setSelectedProfile(null);
  }, [open, defaultBarberName, defaultDate, defaultTime, barbers]);

  useEffect(() => {
    if (mode !== "existing" || search.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancel = false;
    setSearching(true);
    const q = search.trim();
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(8);
      if (!cancel) {
        setResults((data as Profile[]) || []);
        setSearching(false);
      }
    }, 250);
    return () => { cancel = true; clearTimeout(t); };
  }, [search, mode]);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const t = {
    title: lang === "de" ? "Neuer Termin" : "New appointment",
    subtitle: lang === "de" ? "Als Admin einen Termin erstellen" : "Create an appointment as admin",
    customerType: lang === "de" ? "Kunde" : "Customer",
    walkin: lang === "de" ? "Laufkundschaft" : "Walk-in",
    existing: lang === "de" ? "Bestandskunde" : "Existing",
    walkinName: lang === "de" ? "Name" : "Name",
    walkinPhone: lang === "de" ? "Telefon (optional)" : "Phone (optional)",
    searchPlaceholder: lang === "de" ? "Name, E-Mail oder Telefon suchen…" : "Search name, email or phone…",
    noResults: lang === "de" ? "Keine Treffer" : "No results",
    barber: lang === "de" ? "Mitarbeiter" : "Barber",
    service: lang === "de" ? "Dienstleistung" : "Service",
    date: lang === "de" ? "Datum" : "Date",
    time: lang === "de" ? "Uhrzeit" : "Time",
    notes: lang === "de" ? "Notizen (optional)" : "Notes (optional)",
    create: lang === "de" ? "Termin erstellen" : "Create appointment",
    created: lang === "de" ? "Termin erstellt" : "Appointment created",
    error: lang === "de" ? "Fehler beim Erstellen" : "Failed to create",
    missing: lang === "de" ? "Bitte alle Pflichtfelder ausfüllen" : "Please fill in all required fields",
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!barberName || !service) {
      toast({ title: t.missing, variant: "destructive" });
      return;
    }
    let user_id = user.id;
    let noteParts: string[] = [];

    if (mode === "existing") {
      if (!selectedProfile) {
        toast({ title: t.missing, variant: "destructive" });
        return;
      }
      user_id = selectedProfile.user_id;
    } else {
      if (!walkinName.trim()) {
        toast({ title: t.missing, variant: "destructive" });
        return;
      }
      noteParts.push(`${lang === "de" ? "Laufkundschaft" : "Walk-in"}: ${walkinName.trim()}`);
      if (walkinPhone.trim()) noteParts.push(`Tel: ${walkinPhone.trim()}`);
    }
    if (notes.trim()) noteParts.push(notes.trim());

    setSaving(true);
    // Admins may book up to 10 appointments per hour per barber (clients stay limited in the booking flow)
    const { data: sameHour } = await supabase
      .from("bookings")
      .select("id")
      .eq("barber_name", barberName)
      .eq("booking_date", format(date, "yyyy-MM-dd"))
      .like("booking_time", `${time.substring(0, 2)}:%`)
      .neq("status", "cancelled");
    if ((sameHour?.length || 0) >= 10) {
      setSaving(false);
      toast({
        title: lang === "de" ? "Diese Stunde ist voll (max. 10 Termine)" : "This hour is full (max. 10 bookings)",
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase.from("bookings").insert({
      user_id,
      barber_name: barberName,
      service_name: lang === "de" ? service.name : service.name_en || service.name,
      service_price: `${service.price}€`,
      service_duration: `${service.duration_min} min`,
      booking_date: format(date, "yyyy-MM-dd"),
      booking_time: time,
      status: "confirmed",
      notes: noteParts.join(" · ") || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: t.error, description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t.created });
    onCreated?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-copper flex items-center gap-2">
            <UserPlus size={18} /> {t.title}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{t.subtitle}</p>
        </SheetHeader>

        {/* Customer type toggle */}
        <section className="mb-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{t.customerType}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("walkin")}
              className={`py-2 rounded-lg text-sm font-medium border transition ${
                mode === "walkin" ? "bg-copper text-bg-base border-copper" : "bg-surface text-foreground border-border"
              }`}
            >
              {t.walkin}
            </button>
            <button
              onClick={() => setMode("existing")}
              className={`py-2 rounded-lg text-sm font-medium border transition ${
                mode === "existing" ? "bg-copper text-bg-base border-copper" : "bg-surface text-foreground border-border"
              }`}
            >
              {t.existing}
            </button>
          </div>
        </section>

        {mode === "walkin" ? (
          <section className="mb-4 space-y-2">
            <input
              value={walkinName}
              onChange={(e) => setWalkinName(e.target.value)}
              placeholder={t.walkinName}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground"
            />
            <input
              value={walkinPhone}
              onChange={(e) => setWalkinPhone(e.target.value)}
              placeholder={t.walkinPhone}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground"
            />
          </section>
        ) : (
          <section className="mb-4">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground"
              />
            </div>
            {selectedProfile ? (
              <div className="card-app p-3 text-sm">
                <p className="text-foreground font-medium">{selectedProfile.full_name || "—"}</p>
                <p className="text-muted-foreground text-xs">{selectedProfile.email || selectedProfile.phone}</p>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="mt-1 text-xs text-copper underline"
                >
                  {lang === "de" ? "Ändern" : "Change"}
                </button>
              </div>
            ) : searching ? (
              <Loader2 size={16} className="animate-spin text-copper" />
            ) : results.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {results.map((p) => (
                  <button
                    key={p.user_id}
                    onClick={() => setSelectedProfile(p)}
                    className="w-full text-left card-app p-2.5 hover:border-copper/50 transition"
                  >
                    <p className="text-foreground text-sm font-medium">{p.full_name || "—"}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {[p.email, p.phone].filter(Boolean).join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <p className="text-xs text-muted-foreground">{t.noResults}</p>
            ) : null}
          </section>
        )}

        {/* Barber */}
        <section className="mb-3">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <UserCog size={12} /> {t.barber}
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

        {/* Service */}
        <section className="mb-3">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
            {t.service}
          </label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger className="bg-surface border-border text-foreground">
              <SelectValue placeholder={t.service} />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-[100] max-h-72">
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {(lang === "de" ? s.name : s.name_en || s.name)} · {s.price}€ · {s.duration_min}min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Date + Time */}
        <section className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
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
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
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

        {/* Notes */}
        <section className="mb-5">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
            {t.notes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground resize-none"
          />
        </section>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full bg-copper text-bg-base font-semibold rounded-lg py-3 text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {t.create}
        </button>
      </SheetContent>
    </Sheet>
  );
};

export default AdminBookingCreateSheet;
