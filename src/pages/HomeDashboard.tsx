import { useState, useEffect } from "react";
import { Bell, Search, MapPin, Star, ChevronRight, X, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const barbers = [
  { id: 1, name: "Marco", specialty: "Classic Cuts & Shaves", rating: 4.9, cuts: 847, years: 12, image: barber1, available: true },
  { id: 2, name: "Lukas", specialty: "Fades & Modern Styles", rating: 4.8, cuts: 623, years: 7, image: barber2, available: true },
  { id: 3, name: "Daniel", specialty: "Beard Sculpting", rating: 4.7, cuts: 510, years: 9, image: barber3, available: false },
];

const quickServices = [
  { name: "Haarschnitt", price: "€20", icon: "✂️" },
  { name: "Maschinenschnitt", price: "€15", icon: "⚡" },
  { name: "Moderne Bartrasur", price: "€15", icon: "🪒" },
  { name: "Komplett Service", price: "€38", icon: "⭐" },
];

interface BookingInfo {
  service_name: string;
  barber_name: string;
  booking_date: string;
  booking_time: string;
}

interface PromoData {
  id: string;
  type: string;
  active: boolean;
  title_en: string;
  title_de: string;
  subtitle_en: string;
  subtitle_de: string;
  link_text_en: string;
  link_text_de: string;
}

const HomeDashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [lastBooking, setLastBooking] = useState<BookingInfo | null>(null);
  const [nextBooking, setNextBooking] = useState<BookingInfo | null>(null);
  const [bannerPromo, setBannerPromo] = useState<PromoData | null>(null);
  const [cardPromo, setCardPromo] = useState<PromoData | null>(null);

  // Fetch promotions
  useEffect(() => {
    supabase
      .from("promotions")
      .select("id, type, active, title_en, title_de, subtitle_en, subtitle_de, link_text_en, link_text_de")
      .eq("active", true)
      .then(({ data }) => {
        if (data) {
          const promos = data as PromoData[];
          setBannerPromo(promos.find(p => p.type === "banner") || null);
          setCardPromo(promos.find(p => p.type === "promo_card") || null);
        }
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    supabase
      .from("bookings")
      .select("service_name, barber_name, booking_date, booking_time")
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .gte("booking_date", today)
      .order("booking_date", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setNextBooking(data[0] as BookingInfo);
      });

    supabase
      .from("bookings")
      .select("service_name, barber_name, booking_date, booking_time")
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .lt("booking_date", today)
      .order("booking_date", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setLastBooking(data[0] as BookingInfo);
      });
  }, [user]);

  const displayName = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ")[0]
    : user?.email?.split("@")[0] ?? "there";

  const initial = (user?.user_metadata?.full_name?.[0] ?? user?.email?.[0] ?? "S").toUpperCase();

  const q = query.toLowerCase().trim();

  const filteredBarbers = q
    ? barbers.filter(b => b.name.toLowerCase().includes(q) || b.specialty.toLowerCase().includes(q))
    : barbers;

  const filteredServices = q
    ? quickServices.filter(s => s.name.toLowerCase().includes(q))
    : quickServices;

  const hasResults = filteredBarbers.length > 0 || filteredServices.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Announcement strip */}
      <div className="bg-surface border-b border-border pt-[env(safe-area-inset-top)] overflow-hidden">
        <div className="py-2.5 whitespace-nowrap animate-marquee">
          <span className="inline-block text-xs text-muted-foreground">
            ✂️ <span className="text-copper font-medium">{lang === "de" ? "Neu:" : "New:"}</span>{" "}
            {t.home.announcement} &nbsp;·&nbsp;{" "}
            <span className="text-copper font-semibold cursor-pointer underline underline-offset-2" onClick={() => navigate("/book")}>{t.home.announcementLink}</span>
          </span>
        </div>
      </div>

      {/* Top bar */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-copper flex items-center justify-center text-primary-foreground font-heading text-lg">
            {initial}
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">
              {user ? `Hi, ${displayName}` : t.home.greeting}
            </p>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin size={10} />
              <span>{t.home.location}</span>
            </div>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <Bell size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-5 mb-5">
        <div className="bg-surface rounded-xl px-4 py-3 flex items-center gap-3 border border-border focus-within:border-copper/50 transition-colors">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* ── SEARCH RESULTS ── */}
      {q && (
        <div className="px-5 mb-6">
          {!hasResults ? (
            <p className="text-muted-foreground text-sm text-center py-6">No results for "{query}"</p>
          ) : (
            <>
              {filteredBarbers.length > 0 && (
                <div className="mb-4">
                  <p className="text-muted-foreground text-xs font-medium mb-2 tracking-widest uppercase">Barbers</p>
                  <div className="space-y-2">
                    {filteredBarbers.map(b => (
                      <button
                        key={b.id}
                        onClick={() => navigate(`/barber/${b.id}`)}
                        className="w-full card-app p-3 flex items-center gap-3"
                      >
                        <img src={b.image} alt={b.name} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1 text-left">
                          <p className="text-foreground text-sm font-medium">{b.name}</p>
                          <p className="text-muted-foreground text-xs">{b.specialty}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-copper fill-copper" />
                          <span className="text-foreground text-xs">{b.rating}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filteredServices.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-2 tracking-widest uppercase">Services</p>
                  <div className="space-y-2">
                    {filteredServices.map(s => (
                      <button
                        key={s.name}
                        onClick={() => navigate("/book")}
                        className="w-full card-app p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{s.icon}</span>
                          <p className="text-foreground text-sm">{s.name}</p>
                        </div>
                        <span className="text-copper text-sm font-semibold">{s.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── NORMAL HOME CONTENT (hidden while searching) ── */}
      {!q && (
        <>
          {/* Promo card */}
          <div className="px-5 mb-6">
            <div className="relative rounded-2xl overflow-hidden border border-copper/30">
              <div className="absolute inset-0 gradient-copper opacity-10" />
              <div className="relative flex items-center p-5">
                <div className="flex-1">
                  <p className="text-copper font-heading text-2xl mb-1">{t.home.promoTitle}</p>
                  <p className="text-muted-foreground text-xs mb-3">{t.home.promoSub}</p>
                  <button
                    onClick={() => navigate("/book")}
                    className="gradient-copper text-primary-foreground text-xs font-semibold px-4 py-2 rounded-full"
                  >
                    {t.home.bookNow}
                  </button>
                </div>
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ml-3">
                  <img src={heroBg} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>

          {/* Next Appointment */}
          {user && (
            <div className="px-5 mb-6">
              <h3 className="font-heading text-lg text-foreground mb-3">{t.home.nextAppointment}</h3>
              {nextBooking ? (
                <div className="card-app p-4 flex items-center gap-4">
                  <img
                    src={nextBooking.barber_name === "Marco" ? barber1 : nextBooking.barber_name === "Lukas" ? barber2 : barber3}
                    alt={nextBooking.barber_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-foreground font-semibold text-sm">{nextBooking.service_name}</p>
                    <p className="text-muted-foreground text-xs">{nextBooking.barber_name}</p>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                      <Calendar size={11} />
                      <span>{format(new Date(nextBooking.booking_date), "dd/MM/yyyy")}</span>
                      <Clock size={11} />
                      <span>{nextBooking.booking_time}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card-app p-4 text-center">
                  <p className="text-muted-foreground text-sm mb-2">{t.common.noAppointments}</p>
                  <button onClick={() => navigate("/book")} className="text-copper text-xs font-semibold">
                    {t.home.bookNow} →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Last Appointment */}
          {user && lastBooking && (
            <div className="px-5 mb-6">
              <h3 className="font-heading text-lg text-foreground mb-3">{t.home.lastAppointment}</h3>
              <div className="card-app p-4 flex items-center gap-4">
                <img
                  src={lastBooking.barber_name === "Marco" ? barber1 : lastBooking.barber_name === "Lukas" ? barber2 : barber3}
                  alt={lastBooking.barber_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-foreground font-semibold text-sm">{lastBooking.service_name}</p>
                  <p className="text-muted-foreground text-xs">{lastBooking.barber_name}</p>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                    <Calendar size={11} />
                    <span>{format(new Date(lastBooking.booking_date), "dd/MM/yyyy")}</span>
                    <Clock size={11} />
                    <span>{lastBooking.booking_time}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/book")}
                  className="text-copper text-xs font-semibold border border-copper rounded-full px-3 py-1.5"
                >
                  {t.home.rebook}
                </button>
              </div>
            </div>
          )}

          {/* Our Barbers */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <h3 className="font-heading text-lg text-foreground">{t.home.ourBarbers}</h3>
              <button onClick={() => navigate("/explore")} className="text-copper text-xs font-medium flex items-center gap-1">
                {t.home.seeAll} <ChevronRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-5 pb-2" style={{ width: "max-content" }}>
                {barbers.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/barber/${b.id}`)}
                    className="w-44 flex-shrink-0 card-app overflow-hidden cursor-pointer group"
                  >
                    <div className="relative h-36">
                      <img src={b.image} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/70 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <div className={`w-2 h-2 rounded-full ${b.available ? "bg-mint animate-pulse-dot" : "bg-muted-foreground"}`} />
                        <span className="text-[9px] text-foreground font-medium">{b.available ? t.home.available : t.home.busy}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-foreground font-semibold text-sm">{b.name}</p>
                      <p className="text-muted-foreground text-[11px] mb-2">{b.specialty}</p>
                      <div className="flex items-center gap-1 mb-3">
                        <Star size={12} className="text-copper fill-copper" />
                        <span className="text-foreground text-xs font-medium">{b.rating}</span>
                      </div>
                      <button className="w-full gradient-copper text-primary-foreground text-[11px] font-semibold py-1.5 rounded-full">
                        {t.home.bookNow} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Services */}
          <div className="px-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg text-foreground">{t.home.quickBook}</h3>
              <button onClick={() => navigate("/services")} className="text-copper text-xs font-medium flex items-center gap-1">
                {t.home.allServices} <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickServices.map((s) => (
                <button
                  key={s.name}
                  onClick={() => navigate("/book")}
                  className="card-app p-4 text-left group hover:border-copper/30 transition-colors"
                >
                  <span className="text-2xl mb-2 block">{s.icon}</span>
                  <p className="text-foreground text-sm font-medium">{s.name}</p>
                  <p className="text-copper text-xs font-semibold">{s.price}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HomeDashboard;
