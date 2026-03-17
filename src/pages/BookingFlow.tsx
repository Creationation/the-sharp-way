import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Star, Check, CalendarDays, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";

const barbers = [
  { id: 1, name: "Marco", rating: 4.9, image: barber1 },
  { id: 2, name: "Lukas", rating: 4.8, image: barber2 },
  { id: 3, name: "Daniel", rating: 4.7, image: barber3 },
];

const services = [
  { name: "Haarschnitt", price: "€20", duration: "30min" },
  { name: "Maschinenschnitt", price: "€15", duration: "20min" },
  { name: "Haarschnitt + Waschen/Föhnen", price: "€25", duration: "45min" },
  { name: "Haarschnitt + Komplett Service", price: "€38", duration: "60min" },
  { name: "Moderne Bartrasur", price: "€15", duration: "20min" },
  { name: "Bart Rasur", price: "€10", duration: "15min" },
  { name: "Haare färben", price: "€35", duration: "60min" },
  { name: "Kinder Haarschnitt (bis 10 J.)", price: "€16", duration: "20min" },
];

const DAY_ABBR: Record<string, string[]> = {
  en: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
  de: ["SO", "MO", "DI", "MI", "DO", "FR", "SA"],
};

const MONTH_ABBR: Record<string, string[]> = {
  en: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
  de: ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"],
};

// Generate next 6 open days from a start date (Tue–Sat, skip Monday=1 and Sunday=0)
function getAvailableDates(from?: Date): Date[] {
  const result: Date[] = [];
  const d = from ? new Date(from) : new Date();
  if (!from) d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  while (result.length < 6) {
    if (d.getDay() !== 1 && d.getDay() !== 0) result.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return result;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTH_NAMES: Record<string, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
};

const allTimeSlots: string[] = [];
for (let h = 10; h <= 19; h++) {
  allTimeSlots.push(`${h.toString().padStart(2, "0")}:00`);
  allTimeSlots.push(`${h.toString().padStart(2, "0")}:30`);
}

const BookingFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const availableDates = getAvailableDates();

  const [selectedBarber, setSelectedBarber] = useState(barbers[0]);
  const [selectedServices, setSelectedServices] = useState<typeof services>([services[0]]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleService = (s: typeof services[0]) => {
    setSelectedServices(prev => {
      const exists = prev.some(p => p.name === s.name);
      if (exists && prev.length === 1) return prev; // keep at least one
      return exists ? prev.filter(p => p.name !== s.name) : [...prev, s];
    });
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + parseInt(s.price.replace("€", "")), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + parseInt(s.duration), 0);

  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [dayOff, setDayOff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const selectedDate = availableDates[selectedDayIdx];
  const dayAbbr = DAY_ABBR[lang] ?? DAY_ABBR.en;
  const monthAbbr = MONTH_ABBR[lang] ?? MONTH_ABBR.en;

  useEffect(() => {
    fetchAvailability();
  }, [selectedBarber.name, selectedDayIdx]);

  const fetchAvailability = async () => {
    setLoadingSlots(true);
    const dateStr = toDateStr(selectedDate);

    const [bookingsRes, availRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("booking_time")
        .eq("barber_name", selectedBarber.name)
        .eq("booking_date", dateStr)
        .eq("status", "confirmed"),
      supabase
        .from("barber_availability")
        .select("blocked_slots, day_off")
        .eq("barber_name", selectedBarber.name)
        .eq("date", dateStr)
        .maybeSingle(),
    ]);

    const bookedTimes = (bookingsRes.data ?? []).map((r: { booking_time: string }) => r.booking_time);
    const blocked = availRes.data?.blocked_slots ?? [];
    const isOff = availRes.data?.day_off ?? false;

    setTakenSlots([...bookedTimes, ...blocked]);
    setDayOff(isOff);

    // Reset time selection if now taken
    if ([...bookedTimes, ...blocked].includes(selectedTime) || isOff) {
      const firstFree = allTimeSlots.find(s => ![...bookedTimes, ...blocked].includes(s));
      if (firstFree) setSelectedTime(firstFree);
    }
    setLoadingSlots(false);
  };

  const handleConfirm = async () => {
    if (!user) {
      toast.error(t.toasts.signInToBook);
      navigate("/auth");
      return;
    }
    if (dayOff) return;

    setSaving(true);
    const dateStr = toDateStr(selectedDate);

    const serviceNames = selectedServices.map(s => s.name).join(", ");
    const servicePrices = `€${totalPrice}`;
    const serviceDurations = `${totalDuration}min`;

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      barber_name: selectedBarber.name,
      service_name: serviceNames,
      service_price: servicePrices,
      service_duration: serviceDurations,
      booking_date: dateStr,
      booking_time: selectedTime,
      status: "confirmed",
    });

    setSaving(false);

    if (error) {
      toast.error(t.toasts.bookingFailed);
      return;
    }

    // Send confirmation email (non-blocking — failure doesn't affect booking)
    if (user.email) {
      const displayName = user.user_metadata?.full_name || user.email.split("@")[0];
      supabase.functions.invoke("send-booking-confirmation", {
        body: {
          email: user.email,
          name: displayName,
          service: serviceNames,
          barber: selectedBarber.name,
          date: `${dayAbbr[selectedDate.getDay()]} ${selectedDate.getDate()} ${monthAbbr[selectedDate.getMonth()]}`,
          time: selectedTime,
          price: servicePrices,
          lang,
        },
      }).catch(() => {}); // silent fail
    }

    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 pb-20">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full gradient-copper mx-auto mb-6 flex items-center justify-center animate-fade-up">
            <Check size={36} className="text-primary-foreground" />
          </div>
          <h2 className="font-heading text-4xl text-copper mb-2 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards", opacity: 0 }}>{t.booking.booked}</h2>
          <p className="text-muted-foreground mb-2 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards", opacity: 0 }}>
            {selectedServices.map(s => s.name).join(", ")} {t.booking.bookedWith} {selectedBarber.name}
          </p>
          <p className="text-foreground font-medium mb-1 animate-fade-up" style={{ animationDelay: "300ms", animationFillMode: "forwards", opacity: 0 }}>
            {dayAbbr[selectedDate.getDay()]}, {selectedDate.getDate()} {monthAbbr[selectedDate.getMonth()]} · {selectedTime}
          </p>
          <p className="text-muted-foreground text-xs mb-8 animate-fade-up" style={{ animationDelay: "400ms", animationFillMode: "forwards", opacity: 0 }}>
            {t.booking.cancellation}
          </p>
          <button
            onClick={() => navigate("/home")}
            className="gradient-copper text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-copper animate-fade-up"
            style={{ animationDelay: "500ms", animationFillMode: "forwards", opacity: 0 }}
          >
            {t.booking.backHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-44">
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground flex-1">{t.booking.title}</h1>
        <img src={selectedBarber.image} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-copper" />
      </div>

      {/* Select Barber */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-sm text-muted-foreground mb-3 tracking-widest">{t.booking.selectBarber}</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {barbers.map(b => {
            const isSelected = selectedBarber.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBarber(b)}
                className={`flex items-center gap-3 card-app px-4 py-3 flex-shrink-0 transition-all ${isSelected ? "border-copper ring-2 ring-copper/40 bg-copper/10" : "opacity-60"}`}
              >
                <div className="relative">
                  <img src={b.image} alt={b.name} className={`w-10 h-10 rounded-full object-cover transition-all ${isSelected ? "ring-2 ring-copper" : ""}`} />
                  {isSelected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full gradient-copper flex items-center justify-center">
                      <Check size={10} className="text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-foreground text-sm font-medium">{b.name}</p>
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-copper fill-copper" />
                    <span className="text-muted-foreground text-[11px]">{b.rating}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day strip */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-sm text-muted-foreground mb-3 tracking-widest">{t.booking.availableSlots}</h3>
        <div className="flex gap-2 mb-4">
          {availableDates.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDayIdx(i)}
              className={`flex-1 py-3 rounded-xl text-center transition-all ${
                selectedDayIdx === i ? "gradient-copper shadow-copper" : "bg-surface border border-border"
              }`}
            >
              <p className={`text-[10px] font-medium ${selectedDayIdx === i ? "text-primary-foreground" : "text-muted-foreground"}`}>
                {dayAbbr[d.getDay()]}
              </p>
              <p className={`text-lg font-semibold ${selectedDayIdx === i ? "text-primary-foreground" : "text-foreground"}`}>
                {d.getDate()}
              </p>
              <p className={`text-[10px] ${selectedDayIdx === i ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {monthAbbr[d.getMonth()]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-sm text-muted-foreground mb-3 tracking-widest">{t.booking.selectTime}</h3>

        {dayOff ? (
          <div className="card-app p-4 text-center">
            <p className="text-muted-foreground text-sm">
              {t.common.barberUnavailable}
            </p>
          </div>
        ) : loadingSlots ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-copper border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {allTimeSlots.map(slot => {
              const taken = takenSlots.includes(slot);
              const selected = selectedTime === slot;
              return (
                <button
                  key={slot}
                  disabled={taken}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                    selected
                      ? "gradient-copper text-primary-foreground shadow-copper"
                      : taken
                      ? "bg-surface text-muted-foreground/40 cursor-not-allowed"
                      : "bg-surface border border-border text-foreground hover:border-copper/30"
                  }`}
                >
                  {slot}
                  {!taken && !selected && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-mint" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Service selection */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-sm text-muted-foreground mb-3 tracking-widest">{t.booking.selectService}</h3>
        <div className="space-y-2">
          {services.map(s => {
            const isSelected = selectedServices.some(sel => sel.name === s.name);
            return (
              <button
                key={s.name}
                onClick={() => toggleService(s)}
                className={`w-full card-app p-4 flex items-center justify-between transition-all ${
                  isSelected ? "border-copper" : ""
                }`}
              >
                <div className="text-left">
                  <p className="text-foreground text-sm font-medium">{s.name}</p>
                  <p className="text-muted-foreground text-xs">{s.duration}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-copper font-semibold text-sm">{s.price}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full gradient-copper flex items-center justify-center">
                      <Check size={12} className="text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 mb-6">
        <div className="card-app p-4 border-copper/30">
          {selectedServices.map((s, i) => (
            <div key={s.name} className={`flex items-center justify-between ${i < selectedServices.length - 1 ? "mb-2" : "mb-2"}`}>
              <div>
                <span className="text-foreground text-sm font-medium">{s.name}</span>
                <span className="text-muted-foreground text-xs ml-2">({s.duration})</span>
              </div>
              <span className="text-copper font-semibold text-sm">{s.price}</span>
            </div>
          ))}
          <div className="flex items-center justify-between mb-2 mt-1">
            <span className="text-muted-foreground text-xs">{t.booking.barber}</span>
            <span className="text-foreground text-sm">{selectedBarber.name}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-xs">{t.booking.dateTime}</span>
            <span className="text-foreground text-sm">
              {dayAbbr[selectedDate.getDay()]} {selectedDate.getDate()} {monthAbbr[selectedDate.getMonth()]} · {selectedTime}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-xs">{t.booking.duration}</span>
            <span className="text-foreground text-sm">{totalDuration}min</span>
          </div>
          <div className="border-t border-border my-3" />
          <div className="flex items-center justify-between">
            <span className="text-foreground font-semibold">{t.booking.total}</span>
            <span className="text-copper font-heading text-2xl">€{totalPrice}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-5 pt-3 pb-8 bg-background border-t border-border">
        <button
          onClick={handleConfirm}
          disabled={saving || dayOff}
          className="w-full gradient-copper text-primary-foreground font-semibold text-base py-3.5 rounded-full shadow-copper disabled:opacity-50"
        >
          {saving ? t.booking.saving : t.booking.confirm}
        </button>
        <p className="text-center text-muted-foreground text-[10px] mt-1">{t.booking.cancellation}</p>
      </div>
    </div>
  );
};

export default BookingFlow;
