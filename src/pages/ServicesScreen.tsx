import { useState } from "react";
import { ArrowLeft, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = ["All", "Hair", "Beard", "Combo", "Special"];

const allServices = [
  { name: "Classic Haircut", price: "€25", duration: "30min", desc: "Timeless precision cut tailored to your style.", cat: "Hair", icon: "✂️" },
  { name: "Fade & Taper", price: "€30", duration: "45min", desc: "Seamless blends and razor-sharp lines.", cat: "Hair", icon: "💈" },
  { name: "Beard Trim", price: "€15", duration: "20min", desc: "Sculpted and shaped to perfection.", cat: "Beard", icon: "🪒" },
  { name: "Haircut + Beard Combo", price: "€40", duration: "60min", desc: "The full experience — cut, trim, and styled.", cat: "Combo", icon: "⭐" },
  { name: "Hot Towel Shave", price: "€35", duration: "45min", desc: "Old-school luxury with a straight razor finish.", cat: "Special", icon: "🔥" },
  { name: "Kids Cut", price: "€18", duration: "25min", desc: "Patient, fun, and stylish cuts for the little ones.", cat: "Hair", icon: "👦" },
  { name: "Hair Color", price: "€45", duration: "75min", desc: "Professional coloring with premium products.", cat: "Special", icon: "🎨" },
  { name: "Buzz Cut", price: "€18", duration: "20min", desc: "Clean and sharp all-over buzz.", cat: "Hair", icon: "⚡" },
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
