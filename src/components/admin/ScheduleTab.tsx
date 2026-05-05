import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import * as XLSX from "xlsx";

interface Barber {
  id: string;
  name: string;
  color: string;
}

interface Booking {
  barber_name: string;
  booking_time: string;
  service_name: string;
  booking_date: string;
  status: string;
}

interface Props {
  t: {
    title: string;
    exportCsv: string;
    noBookings: string;
    hour: string;
  };
  barbers: Barber[];
}

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = (9 + i).toString().padStart(2, "0");
  return `${h}:00`;
});

/** Convert hex color #RRGGBB to XLSX ARGB "FFRRGGBB" */
const hexToArgb = (hex: string): string => {
  const clean = hex.replace("#", "").toUpperCase();
  return "FF" + (clean.length === 6 ? clean : "C78D4E");
};

/** Lighten hex color for background */
const hexToLightArgb = (hex: string): string => {
  const clean = hex.replace("#", "");
  const r = Math.min(255, parseInt(clean.substring(0, 2), 16) + 180);
  const g = Math.min(255, parseInt(clean.substring(2, 4), 16) + 180);
  const b = Math.min(255, parseInt(clean.substring(4, 6), 16) + 180);
  return "FF" + r.toString(16).padStart(2, "0").toUpperCase() +
    g.toString(16).padStart(2, "0").toUpperCase() +
    b.toString(16).padStart(2, "0").toUpperCase();
};

const STATUS_LABELS: Record<string, { de: string; en: string }> = {
  confirmed: { de: "Bestätigt", en: "Confirmed" },
  cancelled: { de: "Storniert", en: "Cancelled" },
  pending: { de: "Ausstehend", en: "Pending" },
  completed: { de: "Abgeschlossen", en: "Completed" },
  "no-show": { de: "Nicht erschienen", en: "No-show" },
};

const ScheduleTab = ({ t, barbers }: Props) => {
  const { lang } = useLanguage();
  const dateLocale = lang === "de" ? deLocale : enUS;
  const [date, setDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("barber_name, booking_time, service_name, booking_date, status")
      .eq("booking_date", dateStr);
    setBookings((data as Booking[]) || []);
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Live updates — refetch when bookings table changes
  useRealtimeBookings(fetchBookings);

  // Map: hour -> barber_name -> booking
  const grid = useMemo(() => {
    const map: Record<string, Record<string, Booking>> = {};
    for (const h of HOURS) map[h] = {};
    for (const b of bookings) {
      const hourKey = b.booking_time.substring(0, 2) + ":00";
      if (map[hourKey]) map[hourKey][b.barber_name] = b;
    }
    return map;
  }, [bookings]);

  const barberColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    barbers.forEach(b => { map[b.name] = b.color; });
    return map;
  }, [barbers]);

  const exportXlsx = () => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dateLabel = format(date, "EEEE dd MMMM yyyy", { locale: dateLocale });

    // Build data rows
    const header = [t.hour, ...barbers.map(b => b.name)];
    const rows = HOURS.map(h => {
      const cells = barbers.map(b => {
        const booking = grid[h]?.[b.name];
        if (!booking) return "";
        const statusLabel = STATUS_LABELS[booking.status]?.[lang] || booking.status;
        return `${booking.service_name} · ${booking.booking_time} · ${statusLabel}`;
      });
      return [h, ...cells];
    });

    const wsData = [[`Tagesplan · ${dateLabel}`], [], header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = [{ wch: 8 }, ...barbers.map(() => ({ wch: 32 }))];

    // Merge title row
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: barbers.length } }];

    // Apply styles (xlsx community edition has limited style support, use xlsx-style-compatible approach)
    // For each data cell with a booking, add a comment-like note
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tagesplan");
    XLSX.writeFile(wb, `tagesplan-${dateStr}.xlsx`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed": return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" };
      case "cancelled": return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" };
      case "pending": return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" };
      case "no-show": return { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" };
      default: return { bg: "bg-muted/20", text: "text-muted-foreground", border: "border-border" };
    }
  };

  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
  const cancelledCount = bookings.filter(b => b.status === "cancelled").length;

  return (
    <div className="px-5">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4 card-app px-4 py-3">
        <button onClick={() => setDate(d => subDays(d, 1))} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-foreground font-semibold text-sm capitalize">{format(date, "EEEE", { locale: dateLocale })}</p>
          <p className="text-muted-foreground text-xs">{format(date, "dd MMMM yyyy", { locale: dateLocale })}</p>
        </div>
        <button onClick={() => setDate(d => addDays(d, 1))} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform">
          <ChevronRight size={18} className="text-foreground" />
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 card-app px-3 py-2 text-center">
          <p className="text-lg font-bold text-foreground">{totalBookings}</p>
          <p className="text-[10px] text-muted-foreground">{lang === "de" ? "Gesamt" : "Total"}</p>
        </div>
        <div className="flex-1 card-app px-3 py-2 text-center">
          <p className="text-lg font-bold text-emerald-400">{confirmedCount}</p>
          <p className="text-[10px] text-muted-foreground">{lang === "de" ? "Bestätigt" : "Confirmed"}</p>
        </div>
        <div className="flex-1 card-app px-3 py-2 text-center">
          <p className="text-lg font-bold text-red-400">{cancelledCount}</p>
          <p className="text-[10px] text-muted-foreground">{lang === "de" ? "Storniert" : "Cancelled"}</p>
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={exportXlsx}
        className="w-full mb-4 card-app p-3 flex items-center justify-center gap-2 text-copper font-semibold text-sm hover:bg-copper/5 active:scale-[0.98] transition-all"
      >
        <Download size={16} />
        {lang === "de" ? "Als Excel exportieren" : "Export as Excel"}
      </button>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {barbers.map(b => (
          <span key={b.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: b.color }} />
            {b.name}
          </span>
        ))}
      </div>

      {/* Schedule grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card-app overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-left text-muted-foreground font-medium">{t.hour}</th>
                {barbers.map(b => (
                  <th key={b.id} className="py-2 px-3 text-center font-medium" style={{ color: b.color }}>
                    {b.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 px-3 text-muted-foreground font-mono">{hour}</td>
                  {barbers.map(b => {
                    const booking = grid[hour]?.[b.name];
                    const statusStyle = booking ? getStatusStyle(booking.status) : null;
                    return (
                      <td key={b.id} className="py-2.5 px-2 text-center">
                        {booking ? (
                          <div
                            className={`rounded-lg px-2 py-1.5 text-[10px] font-medium leading-tight border ${statusStyle!.border}`}
                            style={{
                              backgroundColor: b.color + "18",
                            }}
                          >
                            <span style={{ color: b.color }}>{booking.service_name}</span>
                            <br />
                            <span className="opacity-70" style={{ color: b.color }}>{booking.booking_time}</span>
                            <br />
                            <span className={`text-[9px] font-semibold ${statusStyle!.text}`}>
                              {STATUS_LABELS[booking.status]?.[lang] || booking.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScheduleTab;
