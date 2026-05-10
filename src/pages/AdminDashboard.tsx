import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, User, Trash2, XCircle,
  CheckCircle, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Save,
  Menu, X, Tag, Scissors, Trophy, Gift, Bell, LayoutGrid, BarChart3,
  Search, Download, RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import UsersTab from "@/components/admin/UsersTab";
import PromotionsTab from "@/components/admin/PromotionsTab";
import BarbersTab from "@/components/admin/BarbersTab";
import PromoCodesTab from "@/components/admin/PromoCodesTab";
import LoyaltyTab from "@/components/admin/LoyaltyTab";
import RewardsTab from "@/components/admin/RewardsTab";
import NotificationsTab from "@/components/admin/NotificationsTab";
import ScheduleTab from "@/components/admin/ScheduleTab";
import StatsTab from "@/components/admin/StatsTab";
import ServicesTab from "@/components/admin/ServicesTab";
import { useBarbers } from "@/hooks/useBarbers";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";

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
  attendance_status: string | null;
  payment_status: string | null;
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
  type TabId = "bookings" | "schedule" | "stats" | "availability" | "users" | "promotions" | "barbers" | "services" | "codes" | "loyalty" | "rewards" | "notifications";
  const [tab, setTab] = useState<TabId>("bookings");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingRewards, setPendingRewards] = useState(0);
  const { barbers: dbBarbers } = useBarbers();
  const barberNames = dbBarbers.map(b => b.name);

  const ADMIN_TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: "bookings",      label: t.admin.bookings,                                 Icon: CalendarIcon  },
    { id: "schedule",      label: t.admin.scheduleTab.title,                        Icon: LayoutGrid    },
    { id: "stats",         label: t.admin.statsTab.title,                           Icon: BarChart3     },
    { id: "availability",  label: t.admin.availability,                             Icon: Clock     },
    { id: "users",         label: t.admin.users,                                    Icon: User      },
    { id: "promotions",    label: t.admin.promotions,                               Icon: Tag       },
    { id: "barbers",       label: t.admin.barbersTab.title,                         Icon: Scissors  },
    { id: "services",      label: t.admin.servicesTab.title,                        Icon: Scissors  },
    { id: "codes",         label: t.admin.promoCodesTab.title,                      Icon: Tag       },
    { id: "loyalty",       label: t.admin.loyaltyTab.title,                         Icon: Trophy    },
    { id: "rewards",       label: t.admin.rewardsTab.title,                         Icon: Gift      },
    { id: "notifications", label: t.admin.notificationsTab.title,                   Icon: Bell      },
  ];

  // — Bookings tab state —
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [barberFilter, setBarberFilter] = useState<string>("all");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    if (isAdmin) {
      fetchBookings();
      fetchPendingRewardsCount();
    }
  }, [isAdmin, authLoading]);

  // Live updates: refetch bookings whenever the table changes (new booking, cancel, status, ...)
  useRealtimeBookings(() => {
    if (isAdmin) {
      fetchBookings();
      if (tab === "availability") fetchAvailability();
    }
  }, isAdmin);

  const fetchPendingRewardsCount = async () => {
    const { count } = await supabase
      .from("reward_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingRewards(count ?? 0);
  };

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

    const bookingsData = (data as unknown as Booking[]) || [];
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

  const markAttendance = async (id: string, status: "attended" | "no_show") => {
    const { error } = await supabase
      .from("bookings")
      .update({ attendance_status: status } as any)
      .eq("id", id);
    if (error) { toast.error(t.admin.updateError); return; }
    toast.success(
      status === "attended" ? t.admin.stampAwarded : t.admin.noShow
    );
    fetchBookings();
  };

  // Compute booking counts per date for the calendar
  const bookingCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    const barberFiltered = bookings.filter(b => barberFilter === "all" || b.barber_name === barberFilter);
    barberFiltered.forEach(b => {
      counts[b.booking_date] = (counts[b.booking_date] || 0) + 1;
    });
    return counts;
  }, [bookings, barberFilter]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = bookings
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => barberFilter === "all" || b.barber_name === barberFilter)
    .filter(b => !calendarDate || b.booking_date === format(calendarDate, "yyyy-MM-dd"))
    .filter(b => !dateFrom || b.booking_date >= dateFrom)
    .filter(b => !dateTo || b.booking_date <= dateTo)
    .filter(b => {
      if (!normalizedQuery) return true;
      const profile = profiles.get(b.user_id);
      const haystack = [
        profile?.full_name, profile?.email, profile?.phone,
        b.barber_name, b.service_name, b.notes,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error(t.admin.exportNoData);
      return;
    }
    const headers = ["Date","Time","Status","Payment","Barber","Service","Price","Duration","Customer","Email","Phone","Notes"];
    const escape = (v: string | null | undefined) => {
      const s = (v ?? "").toString().replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const rows = filtered.map(b => {
      const p = profiles.get(b.user_id);
      return [
        b.booking_date, b.booking_time, b.status, b.payment_status ?? "",
        b.barber_name, b.service_name, b.service_price, b.service_duration,
        p?.full_name ?? "", p?.email ?? "", p?.phone ?? "", b.notes ?? "",
      ].map(escape).join(",");
    });
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t.admin.exportSuccess);
  };

  const resetFilters = () => {
    setFilter("all");
    setBarberFilter("all");
    setCalendarDate(undefined);
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground flex-1">{t.admin.title}</h1>

        {/* Burger menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 bg-surface border border-border px-3 py-2 rounded-full relative"
          >
            <span className="text-foreground text-xs font-medium max-w-[90px] truncate">
              {ADMIN_TABS.find(x => x.id === tab)?.label}
            </span>
            {menuOpen ? <X size={14} className="text-muted-foreground" /> : <Menu size={14} className="text-muted-foreground" />}
            {pendingRewards > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-copper rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                {pendingRewards}
              </span>
            )}
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 w-52 bg-[#111] border border-border rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
                {ADMIN_TABS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setTab(item.id); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      tab === item.id
                        ? "bg-copper/15 text-copper font-semibold"
                        : "text-foreground hover:bg-white/5"
                    }`}
                  >
                    <item.Icon size={14} className={tab === item.id ? "text-copper" : "text-muted-foreground"} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === "rewards" && pendingRewards > 0 && (
                      <span className="bg-copper text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingRewards}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════ BOOKINGS TAB ═══════════════════ */}
      {tab === "bookings" && (
        <>
          {/* Barber filter */}
          <div className="px-5 mb-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2" style={{ width: "max-content" }}>
              <button
                onClick={() => { setBarberFilter("all"); setCalendarDate(undefined); }}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  barberFilter === "all" ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
                }`}
              >
                {t.admin.allBarbers}
              </button>
              {barberNames.map(name => (
                <button
                  key={name}
                  onClick={() => { setBarberFilter(name); setCalendarDate(undefined); }}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    barberFilter === name ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Search + actions */}
          <div className="px-5 mb-3 space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.admin.searchPlaceholder}
                className="w-full pl-9 pr-9 py-2.5 rounded-full bg-surface border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-copper/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t.admin.clearSearch}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border ${
                  showAdvanced || dateFrom || dateTo
                    ? "bg-copper/15 border-copper/40 text-copper"
                    : "bg-surface border-border text-muted-foreground"
                }`}
              >
                <CalendarIcon size={12} /> {t.admin.advancedFilters}
              </button>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-surface border border-border text-foreground hover:border-copper/40"
              >
                <Download size={12} /> {t.admin.exportCsv}
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-surface border border-border text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={12} /> {t.admin.resetFilters}
              </button>
              <span className="ml-auto self-center text-[11px] text-muted-foreground">
                {t.admin.searchResults(filtered.length)}
              </span>
            </div>

            {showAdvanced && (
              <div className="card-app p-3 grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.admin.fromDate}</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-copper/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.admin.toDate}</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1 w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-copper/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Calendar with booking density */}
          <div className="px-5 mb-5">
            <div className="card-app p-3">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={(d) => setCalendarDate(d === calendarDate ? undefined : d)}
                locale={dateLocale}
                className="pointer-events-auto mx-auto"
                modifiers={{
                  light: (date) => { const c = bookingCountsByDate[format(date, "yyyy-MM-dd")] || 0; return c >= 1 && c <= 5; },
                  medium: (date) => { const c = bookingCountsByDate[format(date, "yyyy-MM-dd")] || 0; return c >= 6 && c <= 10; },
                  hot: (date) => { const c = bookingCountsByDate[format(date, "yyyy-MM-dd")] || 0; return c > 10; },
                }}
                modifiersStyles={{
                  light: { backgroundColor: "hsl(142 71% 45% / 0.25)", color: "hsl(142 71% 45%)", fontWeight: 600 },
                  medium: { backgroundColor: "hsl(38 92% 50% / 0.25)", color: "hsl(38 92% 50%)", fontWeight: 600 },
                  hot: { backgroundColor: "hsl(0 84% 60% / 0.25)", color: "hsl(0 84% 60%)", fontWeight: 700 },
                }}
              />
              {/* Legend */}
              <div className="flex flex-wrap gap-3 justify-center mt-3 pt-3 border-t border-border">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "hsl(142 71% 45% / 0.4)" }} />
                  {t.admin.bookings1to5}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "hsl(38 92% 50% / 0.4)" }} />
                  {t.admin.bookings6to10}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "hsl(0 84% 60% / 0.4)" }} />
                  {t.admin.bookingsOver10}
                </span>
              </div>
              {calendarDate && (
                <button
                  onClick={() => setCalendarDate(undefined)}
                  className="w-full mt-2 text-copper text-xs font-medium underline underline-offset-2"
                >
                  {t.admin.all} {t.admin.bookings.toLowerCase()}
                </button>
              )}
            </div>
          </div>

          <div className="px-5 mb-5 grid grid-cols-3 gap-3">
            <div className="card-app p-3 text-center">
              <p className="text-copper font-heading text-2xl">{filtered.length}</p>
              <p className="text-muted-foreground text-[10px]">{t.admin.total}</p>
            </div>
            <div className="card-app p-3 text-center">
              <p className="text-mint font-heading text-2xl">{filtered.filter(b => b.status === "confirmed").length}</p>
              <p className="text-muted-foreground text-[10px]">{t.admin.confirmed}</p>
            </div>
            <div className="card-app p-3 text-center">
              <p className="text-destructive font-heading text-2xl">{filtered.filter(b => b.status === "cancelled").length}</p>
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
                        <div className="flex items-center gap-2">
                          {b.payment_status && b.payment_status !== "pending" && (
                            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                              b.payment_status === "verified" ? "bg-blue-500/20 text-blue-400" :
                              b.payment_status === "charged" ? "bg-copper/20 text-copper" :
                              b.payment_status === "released" ? "bg-muted/20 text-muted-foreground" :
                              b.payment_status === "failed" ? "bg-destructive/20 text-destructive" :
                              "bg-muted/20 text-muted-foreground"
                            }`}>
                              {b.payment_status === "verified" ? t.common.paymentVerified :
                               b.payment_status === "charged" ? t.common.paymentCharged :
                               b.payment_status === "released" ? t.common.paymentReleased :
                               b.payment_status === "failed" ? t.common.paymentFailed :
                               b.payment_status}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                            b.status === "confirmed" ? "bg-mint/20 text-mint" : "bg-destructive/20 text-destructive"
                          }`}>
                            {b.status === "confirmed" ? t.admin.confirmed : t.admin.cancelled}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarIcon size={12} /> {format(new Date(b.booking_date), "dd/MM/yyyy")}</span>
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

                      {/* ── Attendance — visible for past confirmed bookings ── */}
                      {b.status === "confirmed" && new Date(b.booking_date + "T23:59:59") < new Date() && (
                        <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 flex-wrap">
                          <span className="text-muted-foreground text-[10px] font-medium">
                            {t.admin.attendanceQuestion}
                          </span>
                          {!b.attendance_status ? (
                            <>
                              <button
                                onClick={() => markAttendance(b.id, "attended")}
                                className="flex items-center gap-1 text-[11px] text-mint bg-mint/10 px-3 py-1 rounded-full border border-mint/20"
                              >
                                <CheckCircle size={11} /> {t.admin.markAttended}
                              </button>
                              <button
                                onClick={() => markAttendance(b.id, "no_show")}
                                className="flex items-center gap-1 text-[11px] text-muted-foreground bg-surface border border-border px-3 py-1 rounded-full"
                              >
                                <XCircle size={11} /> {t.admin.markNoShow}
                              </button>
                            </>
                          ) : b.attendance_status === "attended" ? (
                            <span className="flex items-center gap-1 text-[11px] text-mint bg-mint/10 px-3 py-1 rounded-full border border-mint/20">
                              <CheckCircle size={11} /> {t.admin.stampAwarded}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-surface border border-border px-3 py-1 rounded-full">
                              <XCircle size={11} /> {t.admin.noShow}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ SCHEDULE TAB ═══════════════════ */}
      {tab === "schedule" && (
        <ScheduleTab
          t={t.admin.scheduleTab}
          barbers={dbBarbers.map(b => ({ id: b.id, name: b.name, color: (b as any).color || '#C78D4E' }))}
        />
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

      {/* ═══════════════════ LOYALTY TAB ═══════════════════ */}
      {tab === "loyalty" && <LoyaltyTab t={t.admin.loyaltyTab} />}

      {/* ═══════════════════ REWARDS TAB ═══════════════════ */}
      {tab === "rewards" && <RewardsTab t={t.admin.rewardsTab} />}

      {/* ═══════════════════ STATS TAB ═══════════════════ */}
      {tab === "stats" && <StatsTab isActive={tab === "stats"} />}

      {/* ═══════════════════ NOTIFICATIONS TAB ═══════════════════ */}
      {tab === "notifications" && (
        <div className="px-5">
          <NotificationsTab t={t.admin.notificationsTab} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
