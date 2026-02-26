import { Star, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";

const reviews = [
  { name: "Alex M.", barber: "Marco", barberImg: barber1, service: "Fade & Taper", stars: 5, text: "Best barbershop in Vienna. Marco nailed the fade — absolutely clean.", date: "2 days ago" },
  { name: "Thomas R.", barber: "Lukas", barberImg: barber2, service: "Haircut + Beard Combo", stars: 5, text: "These guys know their craft. I walked in scruffy and walked out looking like a different person.", date: "1 week ago" },
  { name: "Stefan K.", barber: "Marco", barberImg: barber1, service: "Hot Towel Shave", stars: 5, text: "The hot towel shave is an experience. Smooth, relaxing, and flawless.", date: "2 weeks ago" },
  { name: "Michael B.", barber: "Lukas", barberImg: barber2, service: "Classic Haircut", stars: 4, text: "Lukas took his time to get the cut exactly right. Professional and friendly.", date: "3 weeks ago" },
];

const ratingBars = [
  { stars: 5, pct: 89 },
  { stars: 4, pct: 8 },
  { stars: 3, pct: 2 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 0 },
];

const ReviewsScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">Reviews</h1>
      </div>

      {/* Overall rating */}
      <div className="px-5 mb-6">
        <div className="card-app p-5 flex items-center gap-6">
          <div className="text-center">
            <p className="font-heading text-5xl text-copper">4.9</p>
            <div className="flex items-center gap-0.5 mt-1 justify-center">
              {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-copper fill-copper" />)}
            </div>
            <p className="text-muted-foreground text-xs mt-1">312 reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingBars.map(r => (
              <div key={r.stars} className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-4">{r.stars}★</span>
                <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full gradient-copper rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-muted-foreground text-[10px] w-8 text-right">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review cards */}
      <div className="px-5 space-y-3">
        {reviews.map((r, i) => (
          <div key={i} className="card-app p-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={r.barberImg} alt={r.barber} className="w-9 h-9 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">{r.name}</p>
                <p className="text-muted-foreground text-[11px]">{r.date}</p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, j) => (
                  <Star key={j} size={12} className="text-copper fill-copper" />
                ))}
              </div>
            </div>
            <span className="inline-block bg-surface text-copper text-[10px] font-medium px-2.5 py-1 rounded-full mb-2">
              {r.service}
            </span>
            <p className="text-muted-foreground text-sm leading-relaxed">"{r.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsScreen;
