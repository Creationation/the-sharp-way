import { parseWalkin } from "@/lib/walkin";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, CalendarIcon, Plus, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ExcelJS from "exceljs";
import BookingDetailSheet, { BookingDetail } from "./BookingDetailSheet";
import AdminBookingCreateSheet from "./AdminBookingCreateSheet";
import BlockTimeDialog from "./BlockTimeDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface Barber {
  id: string;
  name: string;
  color: string;
}

interface Booking {
  id: string;
  user_id: string;
  barber_name: string;
  booking_time: string;
  service_name: string;
  service_duration: string;
  booking_date: string;
  status: string;
  service_price?: string | null;
  created_at?: string | null;
  notes?: string | null;
  payment_status?: string | null;
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
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const [slotList, setSlotList] = useState<{ hour: string; barber: Barber; items: Booking[] } | null>(null);


  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("id, user_id, barber_name, booking_time, service_name, service_duration, booking_date, status, service_price, created_at, notes, payment_status")
      .eq("booking_date", dateStr)
      .order("booking_time");
    const list = (data as Booking[]) || [];
    setBookings(list);
    const ids = [...new Set(list.map(b => b.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      const m: Record<string, string> = {};
      (profs || []).forEach(p => { if (p.full_name) m[p.user_id] = p.full_name; });
      setNames(m);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Live updates — refetch when bookings table changes
  useRealtimeBookings(fetchBookings);

  // Map: hour -> barber_name -> booking
  const grid = useMemo(() => {
    const map: Record<string, Record<string, Booking[]>> = {};
    for (const h of HOURS) map[h] = {};
    for (const b of bookings) {
      const hourKey = b.booking_time.substring(0, 2) + ":00";
      if (map[hourKey]) (map[hourKey][b.barber_name] ||= []).push(b);
    }
    // Active bookings first, then by time
    for (const h of HOURS) for (const k in map[h]) map[h][k].sort((a, c) =>
      (a.status === "cancelled" ? 1 : 0) - (c.status === "cancelled" ? 1 : 0) || a.booking_time.localeCompare(c.booking_time));
    return map;
  }, [bookings]);

  const clientName = (b: Booking) => parseWalkin(b.notes)?.name || names[b.user_id] || "";

  const barberColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    barbers.forEach(b => { map[b.name] = b.color; });
    return map;
  }, [barbers]);

  const exportXlsx = async () => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dateLabel = format(date, "EEEE dd MMMM yyyy", { locale: dateLocale });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Sitdown Wien";
    wb.created = new Date();
    const ws = wb.addWorksheet("Tagesplan", {
      views: [{ state: "frozen", ySplit: 3 }],
    });

    // Column widths
    ws.columns = [
      { width: 10 },
      ...barbers.map(() => ({ width: 34 })),
    ];

    // Title row
    const titleRow = ws.addRow([`${lang === "de" ? "Tagesplan" : "Daily schedule"} · ${dateLabel}`]);
    ws.mergeCells(1, 1, 1, barbers.length + 1);
    titleRow.font = { name: "Inter", size: 14, bold: true, color: { argb: "FF1A1A1A" } };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.height = 28;
    titleRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5EFE6" },
    };

    // Spacer
    ws.addRow([]);

    // Header row
    const headerRow = ws.addRow([t.hour, ...barbers.map(b => b.name)]);
    headerRow.height = 22;
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { name: "Inter", bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
      if (colNumber === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF333333" } };
      } else {
        const barber = barbers[colNumber - 2];
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: hexToArgb(barber.color) },
        };
      }
    });

    // Data rows
    for (const h of HOURS) {
      const rowValues: string[] = [h];
      for (const b of barbers) {
        const items = grid[h]?.[b.name] || [];
        rowValues.push(items.map(booking => {
          const statusLabel = STATUS_LABELS[booking.status]?.[lang] || booking.status;
          const who = clientName(booking) ? `${clientName(booking)} · ` : "";
          return `${who}${booking.service_name} · ${booking.booking_time} · ${statusLabel}`;
        }).join("\n"));
      }
      const row = ws.addRow(rowValues);
      const maxItems = Math.max(1, ...barbers.map(b => (grid[h]?.[b.name] || []).length));
      row.height = 32 * maxItems;
      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E5E5" } },
          bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
          left: { style: "thin", color: { argb: "FFE5E5E5" } },
          right: { style: "thin", color: { argb: "FFE5E5E5" } },
        };
        if (colNumber === 1) {
          cell.font = { name: "Inter", bold: true, size: 11, color: { argb: "FF555555" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F8F8" } };
        } else {
          const barber = barbers[colNumber - 2];
          const booking = grid[h]?.[barber.name]?.length;
          if (booking) {
            cell.font = { name: "Inter", bold: true, size: 10, color: { argb: hexToArgb(barber.color) } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: hexToLightArgb(barber.color) } };
          }
        }
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tagesplan-${dateStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex-1 mx-2 text-center active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              <div>
                <p className="text-foreground font-semibold text-sm capitalize">{format(date, "EEEE", { locale: dateLocale })}</p>
                <p className="text-muted-foreground text-xs">{format(date, "dd MMMM yyyy", { locale: dateLocale })}</p>
              </div>
              <CalendarIcon size={14} className="text-copper" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-surface border-border" align="center">
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

      {/* Actions row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setCreateOpen(true)}
          className="card-app p-3 flex items-center justify-center gap-2 text-copper font-semibold text-sm hover:bg-copper/5 active:scale-[0.98] transition-all border-copper/30"
        >
          <Plus size={16} />
          {lang === "de" ? "Neuer Termin" : "New appointment"}
        </button>
        <button
          onClick={exportXlsx}
          className="card-app p-3 flex items-center justify-center gap-2 text-copper font-semibold text-sm hover:bg-copper/5 active:scale-[0.98] transition-all"
        >
          <Download size={16} />
          {lang === "de" ? "Excel Export" : "Excel export"}
        </button>
      </div>


      <button
        onClick={() => setBlockOpen(true)}
        className="w-full card-app p-3 mb-4 flex items-center justify-center gap-2 text-foreground font-semibold text-sm hover:bg-copper/5 active:scale-[0.98] transition-all"
      >
        <Ban size={16} className="text-copper" />
        {lang === "de" ? "Zeit blockieren" : "Block time"}
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
                    const items = grid[hour]?.[b.name] || [];
                    const booking = items[0];
                    const extra = items.length - 1;
                    const statusStyle = booking ? getStatusStyle(booking.status) : null;
                    return (
                      <td key={b.id} className="py-2.5 px-2 text-center">
                        {booking ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (items.length > 1) {
                                setSlotList({ hour, barber: b, items });
                              } else {
                                setSelectedBooking(booking as BookingDetail);
                                setSheetOpen(true);
                              }
                            }}
                            className={`relative w-full rounded-lg px-2 py-1.5 text-[10px] font-medium leading-tight border ${statusStyle!.border} active:scale-[0.97] transition-transform`}
                            style={{ backgroundColor: b.color + "18" }}
                          >
                            {extra > 0 && (
                              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full gradient-copper text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-copper animate-scale-in">
                                +{extra}
                              </span>
                            )}
                            <span style={{ color: b.color }}>{clientName(booking) || booking.service_name}</span>
                            <br />
                            <span className="opacity-70" style={{ color: b.color }}>{booking.booking_time}</span>
                            <br />
                            <span className={`text-[9px] font-semibold ${statusStyle!.text}`}>
                              {extra > 0
                                ? (lang === "de" ? `${items.length} Termine` : `${items.length} bookings`)
                                : (STATUS_LABELS[booking.status]?.[lang] || booking.status)}
                            </span>
                          </button>
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

      <Dialog open={!!slotList} onOpenChange={(o) => !o && setSlotList(null)}>
        <DialogContent className="bg-card border-border max-w-[92vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slotList?.barber.color }} />
              {slotList?.barber.name} · {slotList?.hour}
            </DialogTitle>
            <p className="text-xs text-muted-foreground text-left">
              {slotList?.items.length} {lang === "de" ? "Termine in dieser Stunde" : "bookings in this hour"}
            </p>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {slotList?.items.map(item => {
              const st = getStatusStyle(item.status);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedBooking(item as BookingDetail);
                    setSlotList(null);
                    setSheetOpen(true);
                  }}
                  className={`w-full text-left card-app p-3 flex items-center gap-3 border ${st.border} hover:bg-copper/5 active:scale-[0.98] transition-all`}
                >
                  <div className="font-mono text-sm font-bold text-copper w-12 shrink-0">{item.booking_time.substring(0, 5)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {clientName(item) || (lang === "de" ? "Unbekannter Kunde" : "Unknown customer")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{item.service_name}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                    {STATUS_LABELS[item.status]?.[lang] || item.status}
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <BookingDetailSheet
        booking={selectedBooking}
        barbers={barbers}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onChanged={fetchBookings}
      />

      <BlockTimeDialog open={blockOpen} onOpenChange={setBlockOpen} date={date} barbers={barbers} onChanged={fetchBookings} />

      <AdminBookingCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchBookings}
        defaultDate={date}
      />

      {/* Floating action button */}
      <button
        onClick={() => setCreateOpen(true)}
        aria-label={lang === "de" ? "Neuer Termin" : "New appointment"}
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full gradient-copper shadow-copper flex items-center justify-center active:scale-95 transition"
      >
        <Plus size={24} className="text-primary-foreground" />
      </button>
    </div>
  );
};

export default ScheduleTab;

