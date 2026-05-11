import { ArrowLeft, Star, Scissors, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBarbers } from "@/hooks/useBarbers";

const ExploreBarbers = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { barbers, loading } = useBarbers();

  const getBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("ibo")) return {
      label: lang === "de" ? "Chef Barbier" : "Head Barber",
      style: "bg-copper/20 text-copper border border-copper/30",
    };
    if (lower.includes("cetin")) return {
      label: lang === "de" ? "Frauen Spezialistin" : "Women's Specialist",
      style: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    };
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-surface flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div>
          <h1 className="font-heading text-2xl text-foreground">
            {lang === "de" ? "Unsere Barbiere" : "Our Barbers"}
          </h1>
          <p className="text-muted-foreground text-xs">Sitdown Wien · 1220</p>
        </div>
      </div>

      {/* Intro card */}
      <div className="px-5 mb-6">
        <div className="card-app p-4">
          <div className="flex items-center gap-3 mb-2">
            <Scissors size={18} className="text-copper" />
            <p className="text-foreground font-semibold text-sm">
              {lang === "de"
                ? "Professionelle Barbiere in Wien"
                : "Professional Barbers in Vienna"}
            </p>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {lang === "de"
              ? "Unser Team aus erfahrenen Barbieren steht für Präzision, Stil und erstklassigen Service. Jeder Schnitt ist eine Kunstarbeit, abgestimmt auf deinen persönlichen Look."
              : "Our team of experienced barbers stands for precision, style and top-notch service. Every cut is a work of art, tailored to your personal look."}
          </p>
        </div>
      </div>

      {/* Barber cards */}
      <div className="px-5 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          barbers.map((b) => {
            const badge = getBadge(b.name);
            return (
              <div key={b.id} className="card-app overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Photo */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={b.image}
                      alt={b.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div
                      className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-card ${
                        b.available ? "bg-mint" : "bg-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-heading text-xl text-foreground">{b.name}</h3>
                      {badge && (
                        <span
                          className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-semibold border ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>

                    <p className="text-muted-foreground text-xs mb-3">
                      {lang === "de" ? b.specialty_de : b.specialty_en}
                    </p>

                    <div className="flex items-center gap-3 text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-copper fill-copper" />
                        <span className="text-foreground font-semibold">{b.rating}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {b.cuts}+ {lang === "de" ? "Schnitte" : "cuts"}
                      </span>
                      <span className="text-muted-foreground">
                        {b.years}+ {lang === "de" ? "Jahre" : "yrs"}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        b.available
                          ? "bg-mint/15 text-mint"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${b.available ? "bg-mint" : "bg-muted-foreground"}`} />
                      {b.available
                        ? lang === "de" ? "Verfügbar" : "Available"
                        : lang === "de" ? "Besetzt" : "Busy"}
                    </span>
                  </div>
                </div>

                {/* Book CTA */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => navigate("/book")}
                    className="w-full gradient-copper text-primary-foreground font-semibold text-sm py-2.5 rounded-full shadow-copper"
                  >
                    {lang === "de"
                      ? `Mit ${b.name} buchen →`
                      : `Book with ${b.name} →`}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Salon info footer */}
      <div className="px-5 mt-8">
        <div className="card-app p-5 text-center border-copper/20">
          <p className="font-heading text-xl text-copper tracking-widest mb-3">
            SITDOWN <span className="text-foreground">WIEN</span>
          </p>
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
            <MapPin size={12} className="text-copper" />
            <span>Lavaterstraße 2 · 1220 Wien</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-4">
            <Clock size={12} className="text-copper" />
            <span>
              {lang === "de"
                ? "Di–Sa · 09:00–19:00 · Mo & So geschlossen"
                : "Tue–Sat · 09:00–19:00 · Mon & Sun closed"}
            </span>
          </div>
          <button
            onClick={() => navigate("/book")}
            className="gradient-copper text-primary-foreground font-semibold text-sm px-8 py-3 rounded-full shadow-copper"
          >
            {lang === "de" ? "Jetzt buchen →" : "Book now →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExploreBarbers;
