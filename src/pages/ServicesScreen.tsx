import { useState } from "react";
import { ArrowLeft, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = ["All", "Herren", "Damen", "Bart", "Kinder"];

const allServices = [
  // Herren
  { name: "Haarschnitt", price: "€20", duration: "30min", desc: "Klassischer Herrenschnitt, präzise und sauber.", cat: "Herren", icon: "✂️" },
  { name: "Maschinenschnitt", price: "€15", duration: "20min", desc: "Kurz und clean mit der Maschine.", cat: "Herren", icon: "⚡" },
  { name: "Pensionisten Schnitt", price: "€18", duration: "25min", desc: "Spezialtarif für Senioren.", cat: "Herren", icon: "💈" },
  { name: "Haarschnitt + Waschen/Föhnen", price: "€25", duration: "45min", desc: "Schnitt inkl. Waschen und Föhnen.", cat: "Herren", icon: "💧" },
  { name: "Haarschnitt + Komplett Service", price: "€38", duration: "60min", desc: "Vollservice: Schnitt, Waschen, Föhnen & Styling.", cat: "Herren", icon: "⭐" },
  { name: "Haare färben", price: "€35", duration: "60min", desc: "Professionelle Haarfarbe für Herren.", cat: "Herren", icon: "🎨" },
  { name: "Waschen/Föhnen", price: "€10", duration: "15min", desc: "Waschen und Föhnen ohne Schnitt.", cat: "Herren", icon: "🚿" },
  { name: "Augenbrauen zupfen", price: "€7", duration: "10min", desc: "Präzises Zupfen für einen gepflegten Look.", cat: "Herren", icon: "👁️" },
  { name: "Waxing", price: "€7", duration: "10min", desc: "Haarentfernung per Waxing.", cat: "Herren", icon: "🌿" },
  { name: "Maske", price: "€7", duration: "15min", desc: "Pflegende Gesichtsmaske.", cat: "Herren", icon: "✨" },
  // Bart
  { name: "Moderne Bartrasur", price: "€15", duration: "20min", desc: "Modernes Bartshaping und Pflege.", cat: "Bart", icon: "🪒" },
  { name: "Bart Rasur", price: "€10", duration: "15min", desc: "Klassische Rasur, glatt und sauber.", cat: "Bart", icon: "🔥" },
  { name: "Bart färben", price: "€20", duration: "30min", desc: "Professionelles Bartfärben.", cat: "Bart", icon: "🎨" },
  // Damen
  { name: "Trockenschnitt (K/L)", price: "€23 / €28", duration: "30min", desc: "Schnitt ohne Waschen, kurze oder lange Haare.", cat: "Damen", icon: "✂️" },
  { name: "Waschen + Schnitt (K/L)", price: "€28 / €33", duration: "45min", desc: "Waschen und Schnitt für kurze oder lange Haare.", cat: "Damen", icon: "💧" },
  { name: "Waschen + Schnitt + Föhnen (K/L)", price: "€40 / €50", duration: "60min", desc: "Komplett-Service inkl. Föhnen.", cat: "Damen", icon: "⭐" },
  { name: "Waschen + Föhnen (K/L)", price: "€25 / €35", duration: "30min", desc: "Waschen und Föhnen ohne Schnitt.", cat: "Damen", icon: "🚿" },
  { name: "Föhnen (K/L)", price: "€20 / €30", duration: "20min", desc: "Nur Föhnen.", cat: "Damen", icon: "💨" },
  { name: "Färben + Waschen + Föhnen (K/L)", price: "€50 / €60", duration: "75min", desc: "Färben mit Waschen und Föhnen.", cat: "Damen", icon: "🎨" },
  { name: "Ansatz + Waschen + Föhnen (K/L)", price: "€40 / €60", duration: "60min", desc: "Ansatzfarbe mit Waschen und Föhnen.", cat: "Damen", icon: "🌈" },
  { name: "Strähnen (K/L)", price: "€60 / €80", duration: "90min", desc: "Highlights und Strähnen.", cat: "Damen", icon: "✨" },
  { name: "Blondierung (K/L)", price: "€45 / €60", duration: "75min", desc: "Professionelle Blondierung.", cat: "Damen", icon: "⭐" },
  { name: "Ombre", price: "€80 – €180", duration: "120min", desc: "Ombre-Färbung für einen fließenden Farbverlauf.", cat: "Damen", icon: "🌅" },
  { name: "Balayage", price: "€180", duration: "150min", desc: "Handgemalt für natürliche Highlights.", cat: "Damen", icon: "🖌️" },
  { name: "Dauerwelle (K/L)", price: "€60 / €80", duration: "90min", desc: "Klassische oder moderne Dauerwelle.", cat: "Damen", icon: "🌀" },
  { name: "Locken (K/L)", price: "€40 / €55", duration: "60min", desc: "Lockiges Styling für jeden Typ.", cat: "Damen", icon: "💫" },
  { name: "Faden (Gesicht)", price: "€25", duration: "20min", desc: "Fadenepilation für das Gesicht.", cat: "Damen", icon: "🧵" },
  { name: "Augenbrauen zupfen", price: "€8", duration: "10min", desc: "Präzises Brauen-Zupfen.", cat: "Damen", icon: "👁️" },
  { name: "Augenbrauen färben", price: "€8", duration: "15min", desc: "Augenbrauen färben für mehr Ausdruck.", cat: "Damen", icon: "🎨" },
  { name: "Wimpern färben", price: "€10", duration: "15min", desc: "Wimpernfarbe für intensiveren Blick.", cat: "Damen", icon: "👁️" },
  { name: "Oberlippe zupfen", price: "€7", duration: "10min", desc: "Sanfte Haarentfernung der Oberlippe.", cat: "Damen", icon: "🌿" },
  // Kinder
  { name: "Kinder Haarschnitt (bis 10 Jahre)", price: "€16", duration: "20min", desc: "Liebevoller Schnitt für die Kleinen bis 10 Jahre.", cat: "Kinder", icon: "👦" },
  { name: "Kinder Waschen/Föhnen + Schnitt", price: "€20", duration: "30min", desc: "Komplett-Service für Kinder.", cat: "Kinder", icon: "🧒" },
];

const ServicesScreen = () => {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState("All");

  const filtered = activeCat === "All" ? allServices : allServices.filter(s => s.cat === activeCat);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">Services</h1>
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
                <p className="text-muted-foreground text-xs mb-2">{s.desc}</p>
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
                  <Clock size={12} />
                  <span>{s.duration}</span>
                </div>
                <button
                  onClick={() => navigate("/book")}
                  className="text-copper text-xs font-semibold border border-copper rounded-full px-4 py-1.5 hover:bg-copper hover:text-primary-foreground transition-all flex items-center gap-1"
                >
                  Book This Service <ChevronRight size={12} />
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
