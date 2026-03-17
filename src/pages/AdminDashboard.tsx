import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, Calendar, Clock, User, Trash2, XCircle,
  CheckCircle, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addDays, subDays } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import UsersTab from "@/components/admin/UsersTab";
import PromotionsTab from "@/components/admin/PromotionsTab";
import BarbersTab from "@/components/admin/BarbersTab";
import PromoCodesTab from "@/components/admin/PromoCodesTab";
import LoyaltyTab from "@/components/admin/LoyaltyTab";
import { useBarbers } from "@/hooks/useBarbers";

interface Booking {
  id: string;
  user_id: string;
  barber_name: string;
  service_name: string;
  service_price: string;
  service_duration: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

// BARBERS list is now fetched from DB via useBarbers hook

const ALL_SLOTS: string[] = [];
for (let h = 10; h <= 19; h++) {
  ALL_SLOTS.push(`${h.toString().padStart(2, "0")}:00`);
  ALL_SLOTS.push(`${h.toString().padStart(2, "0")}:30`);
}

type SlotState = "available" | "booked" | "blocked";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();

  const { lang } = useLanguage();
  const t = translations[lang];
  const dateLocale = lang === "de" ? deLocale : enUS;
  const [tab, setTab] = useState<"bookings" | "availability" | "users" | "promotions" | "barbers" | "codes">("bookings");
  const { barbers: dbBarbers } = useBarbers();
  const barberNames = dbBarbers.map(b => b.name);

  // — Bookings tab state —
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled">("all");

  // — Availability tab state —
  const [avBarber, setAvBarber] = useState("");
  const [avDate, setAvDate] = useState<Date>(new Date());
  const [dayOff, setDayOff] = useState(false);
  const [slotStates, setSlotStates] = useState<Record<string, SlotState>>({});
  const [loadingAv, setLoadingAv] = useState(false);
  const [savingAv, setSavingAv] = useState(false);

  // Set initial avBarber when barbers load
  useEffect(() => {
    if (barberNames.length > 0 && !avBarber) setAvBarber(barberNames[0]);
  }, [barberNames]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/home");
      return;
    }
    if (isAdmin) fetchBookings();
  }, [isAdmin, authLoading]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: true });

    if (error) {
      toast.error(t.admin.loadFailed);
      setLoadingBookings(false);
      return;
    }

    const bookingsData = (data as Booking[]) || [];
    setBookings(bookingsData);

    const userIds = [...new Set(bookingsData.map(b => b.user_id))];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);

      if (profilesData) {
        const profileMap = new Map<string, Profile>();
        (profilesData as Profile[]).forEach(p => profileMap.set(p.user_id, p));
        setProfiles(profileMap);
      }
    }
    setLoadingBookings(false);
  };

  const fetchAvailability = useCallback(async () => {
    setLoadingAv(true);
    const dateStr = format(avDate, "yyyy-MM-dd");

    const [bookingsRes, availRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("booking_time")
        .eq("barber_name", avBarber)
        .eq("booking_date", dateStr)
        .eq("status", "confirmed"),
      supabase
        .from("barber_availability")
        .select("blocked_slots, day_off")
        .eq("barber_name", avBarber)
        .eq("date", dateStr)
        .maybeSingle(),
    ]);

    const bookedTimes = new Set(
      (bookingsRes.data ?? []).map((r: { booking_time: string }) => r.booking_time)
    );
    const blocked = new Set<string>(availRes.data?.blocked_slots ?? []);
    const isOff = availRes.data?.day_off ?? false;

    setDayOff(isOff);

    const states: Record<string, SlotState> = {};
    for (const slot of ALL_SLOTS) {
      if (bookedTimes.has(slot)) states[slot] = "booked";
      else if (blocked.has(slot)) states[slot] = "blocked";
      else states[slot] = "available";
    }
    setSlotStates(states);
    setLoadingAv(false);
  }, [avBarber, avDate]);

  useEffect(() => {
    if (isAdmin && tab === "availability") fetchAvailability();
  }, [isAdmin, tab, avBarber, avDate, fetchAvailability]);

  const toggleSlot = (slot: string) => {
    setSlotStates(prev => {
      if (prev[slot] === "booked") return prev; // client-booked, readonly
      return {
        ...prev,
        [slot]: prev[slot] === "blocked" ? "available" : "blocked",
      };
    });
  };

  const saveAvailability = async () => {
    setSavingAv(true);
    const dateStr = format(avDate, "yyyy-MM-dd");
    const blockedSlots = Object.entries(slotStates)
      .filter(([, state]) => state === "blocked")
      .map(([slot]) => slot);

    const { error } = await supabase
      .from("barber_availability")
      .upsert(
        { barber_name: avBarber, date: dateStr, blocked_slots: blockedSlots, day_off: dayOff },
        { onConflict: "barber_name,date" }
      );

    setSavingAv(false);
    if (error) {
      toast.error(t.admin.saveFailed);
    } else {
      toast.success(t.admin.savedSuccess);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(t.admin.updateError); return; }
    toast.success(status === "cancelled" ? t.admin.bookingCancelled : t.admin.statusUpdated);
    fetchBookings();
  };

  const deleteBooking = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) { toast.error(t.admin.deleteError); return; }
    toast.success(t.admin.bookingDeleted);
    fetchBookings();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = bookings.filter(b => filter === "all" || b.status === filter);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">{t.admin.title}</h1>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mb-5 flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setTab("bookings")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            tab === "bookings" ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {t.admin.bookings}
        </button>
        <button
          onClick={() => setTab("availability")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            tab === "availability" ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {t.admin.availability}
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            tab === "users" ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {t.admin.users}
        </button>
        <button
          onClick={() => setTab("promotions")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            tab === "promotions" ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {t.admin.promotions}
        </button>
        <button
          onClick={() => setTab("barbers")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            tab === "barbers" ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {t.admin.barbersTab.title}
        </button>
        <button
          onClick={() => setTab("codes")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            tab === "codes" ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {t.admin.promoCodesTab.title}
        </button>
      </div>

      {/* ═══════════════════ BOOKINGS TAB ═══════════════════ */}
      {tab === "bookings" && (
        <>
          <div className="px-5 mb-5 grid grid-cols-3 gap-3">
            <div className="card-app p-3 text-center">
              <p className="text-copper font-heading text-2xl">{bookings.length}</p>
              <p className="text-muted-foreground text-[10px]">{t.admin.total}</p>
            </div>
            <div className="card-app p-3 text-center">
              <p className="text-mint font-heading text-2xl">{bookings.filter(b => b.status === "confirmed").length}</p>
              <p className="text-muted-foreground text-[10px]">{t.admin.confirmed}</p>
            </div>
            <div className="card-app p-3 text-center">
              <p className="text-destructive font-heading text-2xl">{bookings.filter(b => b.status === "cancelled").length}</p>
              <p className="text-muted-foreground text-[10px]">{t.admin.cancelled}</p>
            </div>
          </div>

          <div className="px-5 mb-4 flex gap-2">
            {(["all", "confirmed", "cancelled"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  filter === f ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
                }`}
              >
                {f === "all" ? t.admin.all : f === "confirmed" ? t.admin.confirmed : t.admin.cancelled}
              </button>
            ))}
          </div>

          {loadingBookings ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="px-5 space-y-3">
              {filtered.length === 0 ? (
                <div className="card-app p-8 text-center">
                  <p className="text-muted-foreground">{t.admin.noBookings}</p>
                </div>
              ) : (
                filtered.map(b => {
                  const profile = profiles.get(b.user_id);
                  return (
                    <div key={b.id} className={`card-app p-4 ${b.status === "cancelled" ? "opacity-60" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-foreground font-medium text-sm">{b.service_name}</p>
                          <p className="text-muted-foreground text-xs">{t.admin.with} {b.barber_name}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                          b.status === "confirmed" ? "bg-mint/20 text-mint" : "bg-destructive/20 text-destructive"
                        }`}>
                          {b.status === "confirmed" ? t.admin.confirmed : t.admin.cancelled}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(b.booking_date), "dd/MM/yyyy")}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {b.booking_time}</span>
                        <span className="text-copper font-semibold">{b.service_price}</span>
                      </div>

                      {profile && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <User size={12} />
                          <span>{profile.full_name || profile.email}</span>
                          {profile.phone && <span>· {profile.phone}</span>}
                        </div>
                      )}

                      {b.notes && <p className="text-muted-foreground text-xs italic mb-3">"{b.notes}"</p>}

                      <div className="flex gap-2">
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => updateStatus(b.id, "cancelled")}
                            className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-full"
                          >
                            <XCircle size={12} /> {t.admin.cancel}
                          </button>
                        )}
                        {b.status === "cancelled" && (
                          <button
                            onClick={() => updateStatus(b.id, "confirmed")}
                            className="flex items-center gap-1 text-xs text-mint bg-mint/10 px-3 py-1.5 rounded-full"
                          >
                            <CheckCircle size={12} /> {t.admin.confirm}
                          </button>
                        )}
                        <button
                          onClick={() => deleteBooking(b.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground bg-surface px-3 py-1.5 rounded-full"
                        >
                          <Trash2 size={12} /> {t.admin.delete}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ AVAILABILITY TAB ═══════════════════ */}
      {tab === "availability" && (
        <div className="px-5">
          {/* Barber selector */}
          <div className="flex gap-2 mb-5">
            {barberNames.map(b => (
              <button
                key={b}
                onClick={() => setAvBarber(b)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  avBarber === b ? "gradient-copper text-primary-foreground shadow-copper" : "bg-surface border border-border text-muted-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center justify-between mb-5 card-app px-4 py-3">
            <button
              onClick={() => setAvDate(d => subDays(d, 1))}
              className="w-8 h-8 rounded-full bg-surface flex items-center justify-center"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>
            <div className="text-center">
              <p className="text-foreground font-semibold text-sm">{format(avDate, "EEEE", { locale: dateLocale })}</p>
              <p className="text-muted-foreground text-xs">{format(avDate, "dd MMMM yyyy", { locale: dateLocale })}</p>
            </div>
            <button
              onClick={() => setAvDate(d => addDays(d, 1))}
              className="w-8 h-8 rounded-full bg-surface flex items-center justify-center"
            >
              <ChevronRight size={16} className="text-foreground" />
            </button>
          </div>

          {/* Day Off toggle */}
          <div className="card-app px-4 py-3 flex items-center justify-between mb-5">
            <div>
              <p className="text-foreground text-sm font-medium">{t.admin.dayOff}</p>
              <p className="text-muted-foreground text-xs">{t.admin.closeDayFor(avBarber)}</p>
            </div>
            <button onClick={() => setDayOff(v => !v)}>
              {dayOff
                ? <ToggleRight size={32} className="text-copper" />
                : <ToggleLeft size={32} className="text-muted-foreground" />
              }
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-mint inline-block" /> {t.admin.available}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-copper inline-block" /> {t.admin.clientBooked}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive inline-block" /> {t.admin.blocked}</span>
          </div>

          {/* Slot grid */}
          {loadingAv ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className={`grid grid-cols-4 gap-2 mb-5 ${dayOff ? "opacity-40 pointer-events-none" : ""}`}>
              {ALL_SLOTS.map(slot => {
                const state = slotStates[slot] ?? "available";
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    disabled={state === "booked"}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all relative ${
                      state === "booked"
                        ? "bg-copper/20 text-copper border border-copper/40 cursor-default"
                        : state === "blocked"
                        ? "bg-destructive/20 text-destructive border border-destructive/40"
                        : "bg-surface border border-border text-foreground hover:border-copper/30"
                    }`}
                  >
                    {slot}
                    {state === "available" && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-mint" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={saveAvailability}
            disabled={savingAv || loadingAv}
            className="w-full gradient-copper text-primary-foreground font-semibold py-3.5 rounded-full shadow-copper flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {savingAv ? t.admin.saving : t.admin.saveAvailability}
          </button>

          <p className="text-center text-muted-foreground text-[10px] mt-3">
            {t.admin.slotHint}
          </p>
        </div>
      )}

      {/* ═══════════════════ USERS TAB ═══════════════════ */}
      {tab === "users" && <UsersTab t={t.admin.usersTab} />}

      {/* ═══════════════════ PROMOTIONS TAB ═══════════════════ */}
      {tab === "promotions" && <PromotionsTab t={t.admin.promosTab} />}

      {/* ═══════════════════ BARBERS TAB ═══════════════════ */}
      {tab === "barbers" && <BarbersTab t={t.admin.barbersTab} />}

      {/* ═══════════════════ PROMO CODES TAB ═══════════════════ */}
      {tab === "codes" && <PromoCodesTab t={t.admin.promoCodesTab} />}
    </div>
  );
};

export default AdminDashboard;
