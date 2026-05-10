import { useState, useMemo } from "react";
import { ArrowLeft, Clock, ChevronRight, Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useServices, type ServiceCategory } from "@/hooks/useServices";

const ServicesScreen = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { services, loading } = useServices({ onlyActive: true });
  const [activeCat, setActiveCat] = useState<"all" | ServiceCategory>("all");

  const categories: { key: "all" | ServiceCategory; label: string }[] = [
    { key: "all", label: t.services.allCat },
    { key: "herren", label: t.services.catHerren },
    { key: "damen", label: t.services.catDamen },
    { key: "kinder", label: t.services.catKinder },
  ];

  const filtered = useMemo(
    () => activeCat === "all" ? services : services.filter(s => s.category === activeCat),
    [services, activeCat]
  );

  const formatPrice = (s: { price: number; is_from_price: boolean }) =>
    s.is_from_price ? `${t.services.fromPrefix} ${s.price}€` : `${s.price}€`;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">{t.services.title}</h1>
      </div>

      {/* Category tabs */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all ${
                activeCat === cat.key
                  ? "gradient-copper text-primary-foreground"
                  : "bg-surface border border-border text-muted-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service cards */}
      {loading ? (
        <div className="px-5 py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="card-app p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-copper flex-shrink-0">
                  <Scissors size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <h3 className="text-foreground font-semibold text-sm">{lang === "en" ? (s.name_en || s.name) : s.name}</h3>
                    <span className="text-copper font-semibold text-sm whitespace-nowrap">{formatPrice(s)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
                    <Clock size={12} />
                    <span>{s.duration_min}min</span>
                  </div>
                  <button
                    onClick={() => navigate("/book")}
                    className="text-copper text-xs font-semibold border border-copper rounded-full px-4 py-1.5 hover:bg-copper hover:text-primary-foreground transition-all flex items-center gap-1"
                  >
                    {t.services.bookBtn} <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesScreen;
