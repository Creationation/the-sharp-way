import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { toast } from "sonner";
import {
  TrendingUp, Calendar, Users, Scissors, AlertTriangle, XCircle, Euro, UserPlus, Info,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays, startOfDay, endOfDay, parseISO, isSameDay } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";

interface Booking {
  id: string;
  user_id: string;
  barber_name: string;
  service_name: string;
  service_price: string;
  booking_date: string;
  booking_time: string;
  status: string;
  attendance_status: string | null;
  created_at: string;
}

const COPPER = "#C9A46E";
const COPPER_LIGHT = "#E8C48A";
const MINT = "#00E5A0";
const RED = "hsl(0 84% 60%)";
const ORANGE = "hsl(38 92% 50%)";
const PIE_COLORS = [COPPER, MINT, "#7DD3FC", "#F472B6", "#A78BFA", "#FB923C", "#FBBF24", "#34D399"];

const parsePrice = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const m = String(raw).replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

const fmtEur = (n: number) => `€${n.toFixed(0)}`;

const StatsTab = ({ isActive }: { isActive: boolean }) => {
  const { lang } = useLanguage();
  const t = translations[lang].admin.statsTab;
  const dateLocale = lang === "de" ? deLocale : enUS;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [newClientsMonth, setNewClientsMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const since = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const [bookingsRes, profilesRes, newProfilesRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id,user_id,barber_name,service_name,service_price,booking_date,booking_time,status,attendance_status,created_at")
          .gte("booking_date", since)
          .order("booking_date", { ascending: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", subDays(new Date(), 30).toISOString()),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      setBookings((bookingsRes.data as unknown as Booking[]) || []);
      setTotalClients(profilesRes.count ?? 0);
      setNewClientsMonth(newProfilesRes.count ?? 0);
    } catch {
      toast.error(t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) fetchData();
  }, [isActive]);

  // Live updates while tab is open
  useRealtimeBookings(() => {
    if (isActive) fetchData();
  }, isActive);

  const stats = useMemo(() => {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const d7 = format(subDays(now, 6), "yyyy-MM-dd");
    const d30 = format(subDays(now, 29), "yyyy-MM-dd");

    const confirmed = bookings.filter(b => b.status === "confirmed");
    const cancelled = bookings.filter(b => b.status === "cancelled");
    const noShows = bookings.filter(b => b.attendance_status === "no_show");

    const inRange = (b: Booking, from: string) => b.booking_date >= from && b.booking_date <= today;

    const revToday = confirmed.filter(b => b.booking_date === today).reduce((s, b) => s + parsePrice(b.service_price), 0);
    const revWeek = confirmed.filter(b => inRange(b, d7)).reduce((s, b) => s + parsePrice(b.service_price), 0);
    const revMonth = confirmed.filter(b => inRange(b, d30)).reduce((s, b) => s + parsePrice(b.service_price), 0);

    const bkToday = bookings.filter(b => b.booking_date === today).length;
    const bkWeek = bookings.filter(b => inRange(b, d7)).length;
    const bkMonth = bookings.length;

    const totalPast = bookings.filter(b => b.booking_date <= today);
    const noShowRate = totalPast.length > 0 ? (noShows.length / totalPast.length) * 100 : 0;
    const cancelRate = bookings.length > 0 ? (cancelled.length / bookings.length) * 100 : 0;
    const avgTicket = confirmed.length > 0 ? revMonth / confirmed.filter(b => inRange(b, d30)).length : 0;

    // Top services
    const svcMap = new Map<string, { count: number; revenue: number }>();
    confirmed.forEach(b => {
      const key = b.service_name;
      const cur = svcMap.get(key) || { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += parsePrice(b.service_price);
      svcMap.set(key, cur);
    });
    const topServices = [...svcMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top barbers
    const brbMap = new Map<string, { count: number; revenue: number }>();
    confirmed.forEach(b => {
      const cur = brbMap.get(b.barber_name) || { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += parsePrice(b.service_price);
      brbMap.set(b.barber_name, cur);
    });
    const topBarbers = [...brbMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Revenue last 30 days (line chart)
    const revSeries: { date: string; label: string; revenue: number; bookings: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i);
      const key = format(d, "yyyy-MM-dd");
      const dayConfirmed = confirmed.filter(b => b.booking_date === key);
      revSeries.push({
        date: key,
        label: format(d, "dd.MM", { locale: dateLocale }),
        revenue: dayConfirmed.reduce((s, b) => s + parsePrice(b.service_price), 0),
        bookings: bookings.filter(b => b.booking_date === key).length,
      });
    }

    // Bookings by weekday (Mon=0)
    const wd = [0, 0, 0, 0, 0, 0, 0];
    bookings.forEach(b => {
      const day = parseISO(b.booking_date).getDay(); // 0=Sun..6=Sat
      const idx = day === 0 ? 6 : day - 1;
      wd[idx] += 1;
    });
    const wdSeries = t.weekdays.map((label, i) => ({ label, count: wd[i] }));

    return {
      revToday, revWeek, revMonth,
      bkToday, bkWeek, bkMonth,
      noShowRate, cancelRate, avgTicket,
      topServices, topBarbers,
      revSeries, wdSeries,
    };
  }, [bookings, t.weekdays, dateLocale]);

  if (loading) {
    return (
      <div className="px-5 py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Kpi = ({
    icon: Icon, label, value, accent = "copper",
  }: { icon: React.ElementType; label: string; value: string; accent?: "copper" | "mint" | "red" | "orange" }) => {
    const color =
      accent === "mint" ? "text-mint"
      : accent === "red" ? "text-[hsl(0_84%_60%)]"
      : accent === "orange" ? "text-[hsl(38_92%_50%)]"
      : "text-copper";
    return (
      <div className="card-app p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
          <Icon size={14} className={color} />
        </div>
        <p className={`font-heading text-xl ${color}`}>{value}</p>
      </div>
    );
  };

  return (
    <div className="px-5 space-y-5">
      {/* KPIs revenue */}
      <div className="grid grid-cols-3 gap-2.5">
        <Kpi icon={Euro} label={t.revenueToday} value={fmtEur(stats.revToday)} />
        <Kpi icon={Euro} label={t.revenueWeek} value={fmtEur(stats.revWeek)} />
        <Kpi icon={Euro} label={t.revenueMonth} value={fmtEur(stats.revMonth)} accent="mint" />
      </div>

      {/* KPIs bookings */}
      <div className="grid grid-cols-3 gap-2.5">
        <Kpi icon={Calendar} label={t.bookingsToday} value={String(stats.bkToday)} />
        <Kpi icon={Calendar} label={t.bookingsWeek} value={String(stats.bkWeek)} />
        <Kpi icon={Calendar} label={t.bookingsMonth} value={String(stats.bkMonth)} />
      </div>

      {/* Quality KPIs */}
      <div className="grid grid-cols-3 gap-2.5">
        <Kpi icon={AlertTriangle} label={t.noShowRate} value={`${stats.noShowRate.toFixed(1)}%`} accent="red" />
        <Kpi icon={XCircle} label={t.cancelRate} value={`${stats.cancelRate.toFixed(1)}%`} accent="orange" />
        <Kpi icon={TrendingUp} label={t.avgTicket} value={fmtEur(stats.avgTicket)} accent="mint" />
      </div>

      {/* Clients */}
      <div className="grid grid-cols-2 gap-2.5">
        <Kpi icon={Users} label={t.totalClients} value={String(totalClients)} />
        <Kpi icon={UserPlus} label={t.newClientsMonth} value={String(newClientsMonth)} accent="mint" />
      </div>

      {/* Revenue trend */}
      <div className="card-app p-4">
        <h3 className="font-heading text-sm text-foreground mb-3">{t.revenueLast30}</h3>
        {stats.revMonth === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-8">{t.noData}</p>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revSeries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COPPER_LIGHT} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={COPPER} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: COPPER_LIGHT }}
                  formatter={(v: number) => [`€${v}`, t.revenue]}
                />
                <Area type="monotone" dataKey="revenue" stroke={COPPER} strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bookings by weekday */}
      <div className="card-app p-4">
        <h3 className="font-heading text-sm text-foreground mb-3">{t.bookingsByWeekday}</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.wdSeries} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: COPPER_LIGHT }}
                formatter={(v: number) => [v, t.bookings]}
              />
              <Bar dataKey="count" fill={COPPER} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Services breakdown pie */}
      {stats.topServices.length > 0 && (
        <div className="card-app p-4">
          <h3 className="font-heading text-sm text-foreground mb-3">{t.servicesBreakdown}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.topServices}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  paddingAngle={2}
                >
                  {stats.topServices.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number, _n, p: any) => [`${v} · €${p.payload.revenue.toFixed(0)}`, p.payload.name]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top services list */}
      <div className="card-app p-4">
        <h3 className="font-heading text-sm text-foreground mb-3 flex items-center gap-2">
          <Scissors size={14} className="text-copper" />
          {t.topServices}
        </h3>
        {stats.topServices.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t.noData}</p>
        ) : (
          <div className="space-y-2">
            {stats.topServices.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="font-heading text-copper text-sm w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm truncate">{s.name}</p>
                  <p className="text-muted-foreground text-[10px]">{s.count} · {fmtEur(s.revenue)}</p>
                </div>
                <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-copper"
                    style={{ width: `${(s.revenue / stats.topServices[0].revenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top barbers list */}
      <div className="card-app p-4">
        <h3 className="font-heading text-sm text-foreground mb-3 flex items-center gap-2">
          <Users size={14} className="text-copper" />
          {t.topBarbers}
        </h3>
        {stats.topBarbers.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t.noData}</p>
        ) : (
          <div className="space-y-2">
            {stats.topBarbers.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3">
                <span className="font-heading text-copper text-sm w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm truncate">{b.name}</p>
                  <p className="text-muted-foreground text-[10px]">{b.count} · {fmtEur(b.revenue)}</p>
                </div>
                <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-copper"
                    style={{ width: `${(b.revenue / stats.topBarbers[0].revenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="card-app p-3 flex items-start gap-2.5 border border-copper/20">
        <Info size={14} className="text-copper mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-copper text-xs font-semibold">{t.tip}</p>
          <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{t.tipDesc}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
