import { Bell, Search, MapPin, Star, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const barbers = [
  { id: 1, name: "Marco", specialty: "Classic Cuts & Shaves", rating: 4.9, cuts: 847, years: 12, image: barber1, available: true },
  { id: 2, name: "Lukas", specialty: "Fades & Modern Styles", rating: 4.8, cuts: 623, years: 7, image: barber2, available: true },
  { id: 3, name: "Daniel", specialty: "Beard Sculpting", rating: 4.7, cuts: 510, years: 9, image: barber3, available: false },
];

const HomeDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Announcement strip */}
      <div className="bg-surface border-b border-border px-4 py-2.5 text-center">
        <p className="text-xs text-muted-foreground">
          ✂️ <span className="text-copper font-medium">New:</span> {t.home.announcement}{" "}
          <span className="text-copper cursor-pointer" onClick={() => navigate("/book")}>{t.home.announcementLink}</span>
        </p>
      </div>

      {/* Top bar */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-copper flex items-center justify-center text-primary-foreground font-heading text-lg">
            S
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">{t.home.greeting}</p>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin size={10} />
              <span>{t.home.location}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
            <Bell size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-5 mb-5">
        <div className="bg-surface rounded-xl px-4 py-3 flex items-center gap-3 border border-border">
          <Search size={18} className="text-muted-foreground" />
          <span className="text-muted-foreground text-sm">{t.home.searchPlaceholder}</span>
        </div>
      </div>

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

      {/* Last Appointment */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-lg text-foreground">{t.home.lastAppointment}</h3>
        </div>
        <div className="card-app p-4 flex items-center gap-4">
          <img src={barber1} alt="Marco" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-foreground font-semibold text-sm">{t.home.lastService}</p>
            <p className="text-muted-foreground text-xs">Feb 15, 2026 · 11:00 AM</p>
          </div>
          <button
            onClick={() => navigate("/book")}
            className="text-copper text-xs font-semibold border border-copper rounded-full px-3 py-1.5"
          >
            {t.home.rebook}
          </button>
        </div>
      </div>

      {/* Our Barbers */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h3 className="font-heading text-lg text-foreground">{t.home.ourBarbers}</h3>
          <button className="text-copper text-xs font-medium flex items-center gap-1">
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
          {[
            { name: "Haarschnitt", price: "€20", icon: "✂️" },
            { name: "Maschinenschnitt", price: "€15", icon: "⚡" },
            { name: "Moderne Bartrasur", price: "€15", icon: "🪒" },
            { name: "Komplett Service", price: "€38", icon: "⭐" },
          ].map((s) => (
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
    </div>
  );
};

export default HomeDashboard;
