import { useState } from "react";
import { ArrowLeft, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const allServices = [
  // Herren
  { name: "Haarschnitt", price: "€20", duration: "30min", desc: { en: "Classic men's cut, precise and clean.", de: "Klassischer Herrenschnitt, präzise und sauber." }, cat: "Herren", icon: "✂️" },
  { name: "Maschinenschnitt", price: "€15", duration: "20min", desc: { en: "Short and clean with the clipper.", de: "Kurz und clean mit der Maschine." }, cat: "Herren", icon: "⚡" },
  { name: "Pensionisten Schnitt", price: "€18", duration: "25min", desc: { en: "Special rate for seniors.", de: "Spezialtarif für Senioren." }, cat: "Herren", icon: "💈" },
  { name: "Haarschnitt + Waschen/Föhnen", price: "€25", duration: "45min", desc: { en: "Cut including wash and blow-dry.", de: "Schnitt inkl. Waschen und Föhnen." }, cat: "Herren", icon: "💧" },
  { name: "Haarschnitt + Komplett Service", price: "€38", duration: "60min", desc: { en: "Full service: cut, wash, blow-dry & styling.", de: "Vollservice: Schnitt, Waschen, Föhnen & Styling." }, cat: "Herren", icon: "⭐" },
  { name: "Haare färben", price: "€35", duration: "60min", desc: { en: "Professional hair color for men.", de: "Professionelle Haarfarbe für Herren." }, cat: "Herren", icon: "🎨" },
  { name: "Waschen/Föhnen", price: "€10", duration: "15min", desc: { en: "Wash and blow-dry without cut.", de: "Waschen und Föhnen ohne Schnitt." }, cat: "Herren", icon: "🚿" },
  { name: "Augenbrauen zupfen", price: "€7", duration: "10min", desc: { en: "Precise brow shaping.", de: "Präzises Zupfen für einen gepflegten Look." }, cat: "Herren", icon: "👁️" },
  { name: "Waxing", price: "€7", duration: "10min", desc: { en: "Hair removal by waxing.", de: "Haarentfernung per Waxing." }, cat: "Herren", icon: "🌿" },
  { name: "Maske", price: "€7", duration: "15min", desc: { en: "Nourishing face mask.", de: "Pflegende Gesichtsmaske." }, cat: "Herren", icon: "✨" },
  // Bart
  { name: "Moderne Bartrasur", price: "€15", duration: "20min", desc: { en: "Modern beard shaping and care.", de: "Modernes Bartshaping und Pflege." }, cat: "Bart", icon: "🪒" },
  { name: "Bart Rasur", price: "€10", duration: "15min", desc: { en: "Classic shave, smooth and clean.", de: "Klassische Rasur, glatt und sauber." }, cat: "Bart", icon: "🔥" },
  { name: "Bart färben", price: "€20", duration: "30min", desc: { en: "Professional beard coloring.", de: "Professionelles Bartfärben." }, cat: "Bart", icon: "🎨" },
  // Damen
  { name: "Trockenschnitt (K/L)", price: "€23 / €28", duration: "30min", desc: { en: "Cut without washing, short or long hair.", de: "Schnitt ohne Waschen, kurze oder lange Haare." }, cat: "Damen", icon: "✂️" },
  { name: "Waschen + Schnitt (K/L)", price: "€28 / €33", duration: "45min", desc: { en: "Wash and cut for short or long hair.", de: "Waschen und Schnitt für kurze oder lange Haare." }, cat: "Damen", icon: "💧" },
  { name: "Waschen + Schnitt + Föhnen (K/L)", price: "€40 / €50", duration: "60min", desc: { en: "Full service incl. blow-dry.", de: "Komplett-Service inkl. Föhnen." }, cat: "Damen", icon: "⭐" },
  { name: "Waschen + Föhnen (K/L)", price: "€25 / €35", duration: "30min", desc: { en: "Wash and blow-dry without cut.", de: "Waschen und Föhnen ohne Schnitt." }, cat: "Damen", icon: "🚿" },
  { name: "Föhnen (K/L)", price: "€20 / €30", duration: "20min", desc: { en: "Blow-dry only.", de: "Nur Föhnen." }, cat: "Damen", icon: "💨" },
  { name: "Färben + Waschen + Föhnen (K/L)", price: "€50 / €60", duration: "75min", desc: { en: "Color with wash and blow-dry.", de: "Färben mit Waschen und Föhnen." }, cat: "Damen", icon: "🎨" },
  { name: "Ansatz + Waschen + Föhnen (K/L)", price: "€40 / €60", duration: "60min", desc: { en: "Root color with wash and blow-dry.", de: "Ansatzfarbe mit Waschen und Föhnen." }, cat: "Damen", icon: "🌈" },
  { name: "Strähnen (K/L)", price: "€60 / €80", duration: "90min", desc: { en: "Highlights and streaks.", de: "Highlights und Strähnen." }, cat: "Damen", icon: "✨" },
  { name: "Blondierung (K/L)", price: "€45 / €60", duration: "75min", desc: { en: "Professional bleaching.", de: "Professionelle Blondierung." }, cat: "Damen", icon: "⭐" },
  { name: "Ombre", price: "€80 – €180", duration: "120min", desc: { en: "Ombre coloring for a flowing gradient.", de: "Ombre-Färbung für einen fließenden Farbverlauf." }, cat: "Damen", icon: "🌅" },
  { name: "Balayage", price: "€180", duration: "150min", desc: { en: "Hand-painted for natural highlights.", de: "Handgemalt für natürliche Highlights." }, cat: "Damen", icon: "🖌️" },
  { name: "Dauerwelle (K/L)", price: "€60 / €80", duration: "90min", desc: { en: "Classic or modern perm.", de: "Klassische oder moderne Dauerwelle." }, cat: "Damen", icon: "🌀" },
  { name: "Locken (K/L)", price: "€40 / €55", duration: "60min", desc: { en: "Curly styling for every type.", de: "Lockiges Styling für jeden Typ." }, cat: "Damen", icon: "💫" },
  { name: "Faden (Gesicht)", price: "€25", duration: "20min", desc: { en: "Threading for the face.", de: "Fadenepilation für das Gesicht." }, cat: "Damen", icon: "🧵" },
  { name: "Augenbrauen zupfen", price: "€8", duration: "10min", desc: { en: "Precise brow shaping.", de: "Präzises Brauen-Zupfen." }, cat: "Damen", icon: "👁️" },
  { name: "Augenbrauen färben", price: "€8", duration: "15min", desc: { en: "Brow tinting for more expression.", de: "Augenbrauen färben für mehr Ausdruck." }, cat: "Damen", icon: "🎨" },
  { name: "Wimpern färben", price: "€10", duration: "15min", desc: { en: "Lash tint for an intense look.", de: "Wimpernfarbe für intensiveren Blick." }, cat: "Damen", icon: "👁️" },
  { name: "Oberlippe zupfen", price: "€7", duration: "10min", desc: { en: "Gentle upper lip hair removal.", de: "Sanfte Haarentfernung der Oberlippe." }, cat: "Damen", icon: "🌿" },
  // Kinder
  { name: "Kinder Haarschnitt (bis 10 Jahre)", price: "€16", duration: "20min", desc: { en: "Caring cut for children up to age 10.", de: "Liebevoller Schnitt für die Kleinen bis 10 Jahre." }, cat: "Kinder", icon: "👦" },
  { name: "Kinder Waschen/Föhnen + Schnitt", price: "€20", duration: "30min", desc: { en: "Full service for children.", de: "Komplett-Service für Kinder." }, cat: "Kinder", icon: "🧒" },
];

const ServicesScreen = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [activeCat, setActiveCat] = useState(t.services.allCat);

  const categories = [t.services.allCat, "Herren", "Damen", "Bart", "Kinder"];
  const filtered = activeCat === t.services.allCat
    ? allServices
    : allServices.filter(s => s.cat === activeCat);

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
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all ${
                activeCat === cat
                  ? "gradient-copper text-primary-foreground"
                  : "bg-surface border border-border text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service cards */}
      <div className="px-5 space-y-3">
        {filtered.map(s => (
          <div key={s.name} className="card-app p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-2xl flex-shrink-0">
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-foreground font-semibold text-sm">{s.name}</h3>
                  <span className="text-copper font-semibold text-sm">{s.price}</span>
                </div>
                <p className="text-muted-foreground text-xs mb-2">{s.desc[lang]}</p>
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
                  <Clock size={12} />
                  <span>{s.duration}</span>
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
    </div>
  );
};

export default ServicesScreen;
