import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

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

const ScheduleTab = ({ t, barbers }: Props) => {
  const { lang } = useLanguage();
  const dateLocale = lang === "de" ? deLocale : enUS;
  const [date, setDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const dateStr = format(date, "yyyy-MM-dd");
      const { data } = await supabase
        .from("bookings")
        .select("barber_name, booking_time, service_name, booking_date")
        .eq("booking_date", dateStr)
        .eq("status", "confirmed");
      setBookings((data as Booking[]) || []);
      setLoading(false);
    };
    fetchBookings();
  }, [date]);

  // Map: hour -> barber_name -> booking
  const grid = useMemo(() => {
    const map: Record<string, Record<string, Booking>> = {};
    for (const h of HOURS) {
      map[h] = {};
    }
    for (const b of bookings) {
      const hourKey = b.booking_time.substring(0, 2) + ":00";
      if (map[hourKey]) {
        map[hourKey][b.barber_name] = b;
      }
    }
    return map;
  }, [bookings]);

  const exportCsv = () => {
    const dateStr = format(date, "yyyy-MM-dd");
    const header = [t.hour, ...barbers.map(b => b.name)].join(",");
    const rows = HOURS.map(h => {
      const cells = barbers.map(b => {
        const booking = grid[h]?.[b.name];
        return booking ? `"${booking.service_name} (${booking.booking_time})"` : "";
      });
      return [h, ...cells].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planning-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-5">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-5 card-app px-4 py-3">
        <button onClick={() => setDate(d => subDays(d, 1))} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
          <ChevronLeft size={16} className="text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-foreground font-semibold text-sm">{format(date, "EEEE", { locale: dateLocale })}</p>
          <p className="text-muted-foreground text-xs">{format(date, "dd MMMM yyyy", { locale: dateLocale })}</p>
        </div>
        <button onClick={() => setDate(d => addDays(d, 1))} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
          <ChevronRight size={16} className="text-foreground" />
        </button>
      </div>

      {/* Export button */}
      <button
        onClick={exportCsv}
        className="w-full mb-5 card-app p-3 flex items-center justify-center gap-2 text-copper font-semibold text-sm hover:bg-copper/5 transition-colors"
      >
        <Download size={16} />
        {t.exportCsv}
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
                    return (
                      <td key={b.id} className="py-2.5 px-2 text-center">
                        {booking ? (
                          <div
                            className="rounded-lg px-2 py-1.5 text-[10px] font-medium leading-tight"
                            style={{
                              backgroundColor: b.color + "25",
                              color: b.color,
                              border: `1px solid ${b.color}40`,
                            }}
                          >
                            {booking.service_name}
                            <br />
                            <span className="opacity-70">{booking.booking_time}</span>
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
