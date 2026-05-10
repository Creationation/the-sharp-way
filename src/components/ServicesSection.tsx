import { Clock, Scissors } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useLanguage } from "@/contexts/LanguageContext";

const ServicesSection = () => {
  const { services, loading } = useServices({ onlyActive: true });
  const { t, lang } = useLanguage();

  const formatPrice = (s: { price: number; is_from_price: boolean }) =>
    s.is_from_price ? `${t.services.fromPrefix} €${s.price}` : `€${s.price}`;

  return (
    <section id="services" className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-copper mb-4">{t.services.title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Crafted with precision · Every cut tells a story.</p>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.id}
                className="group bg-card border border-border hover:border-copper/50 rounded-lg p-6 transition-all duration-300 hover:glow-copper"
              >
                <div className="flex items-start justify-between mb-4">
                  <Scissors className="text-copper" size={24} />
                  <span className="font-heading text-2xl text-copper">{formatPrice(s)}</span>
                </div>
                <h3 className="font-heading text-xl text-foreground mb-1">
                  {lang === "en" ? (s.name_en || s.name) : s.name}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                  <Clock size={14} />
                  <span>{s.duration_min}min</span>
                </div>
                <span className="inline-block text-[10px] uppercase tracking-widest text-muted-foreground mb-6">
                  {s.category === "herren" ? t.services.catHerren : s.category === "damen" ? t.services.catDamen : t.services.catKinder}
                </span>
                <a
                  href="#booking"
                  className="block text-center gradient-copper text-primary-foreground font-heading tracking-widest text-sm py-2.5 rounded-sm hover:opacity-90 transition-opacity"
                >
                  {t.services.bookBtn}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
