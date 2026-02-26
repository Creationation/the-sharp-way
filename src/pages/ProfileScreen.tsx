import { useState } from "react";
import { ArrowLeft, Trophy, Gift, ChevronRight, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stamps = 4;

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [email, setEmail] = useState("");
  const [referred, setReferred] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">Profile</h1>
      </div>

      {/* Loyalty Card */}
      <div className="px-5 mb-6">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 gradient-copper opacity-20" />
          <div className="relative border border-copper/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-heading text-lg text-copper tracking-widest">THE SHARP CUT MEMBER</p>
              <span className="text-foreground text-[10px] bg-surface px-2 py-1 rounded-full">Gold</span>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl flex items-center justify-center text-lg ${
                    i < stamps
                      ? "gradient-copper text-primary-foreground"
                      : i === 9
                      ? "border-2 border-copper border-dashed"
                      : "bg-surface border border-border"
                  }`}
                >
                  {i < stamps ? "✂️" : i === 9 ? "🎁" : ""}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs text-center">
              {stamps}/10 — Every 10th cut is <span className="text-copper font-semibold">FREE</span> ✂️
            </p>
          </div>
        </div>
      </div>

      {/* Points */}
      <div className="px-5 mb-5">
        <div className="card-app p-4 flex items-center gap-4">
          <Trophy size={24} className="text-copper" />
          <div className="flex-1">
            <p className="text-foreground font-semibold text-sm">450 Sharp Points</p>
            <p className="text-muted-foreground text-xs">Earn 50 pts per visit</p>
          </div>
          <button className="text-copper text-xs font-semibold">Redeem →</button>
        </div>
      </div>

      {/* My Bookings */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-lg text-foreground mb-3">My Bookings</h3>
        <div className="flex gap-2 mb-3">
          {(["upcoming", "past"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? "gradient-copper text-primary-foreground"
                  : "bg-surface border border-border text-muted-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {activeTab === "upcoming" ? (
          <div className="card-app p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={16} className="text-copper" />
              <span className="text-foreground text-sm font-medium">Fade & Taper with Marco</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              <Clock size={12} />
              <span>Thu, Feb 27 · 14:00 — 14:45</span>
            </div>
          </div>
        ) : (
          <div className="card-app p-4">
            <p className="text-muted-foreground text-sm">Classic Haircut with Lukas</p>
            <p className="text-muted-foreground text-xs">Feb 10, 2026</p>
          </div>
        )}
      </div>

      {/* Refer a Friend */}
      <div className="px-5 mb-5">
        <div className="card-app p-5 border-copper/30">
          <Gift size={24} className="text-copper mb-3" />
          <h3 className="text-foreground font-semibold text-sm mb-1">Refer a Friend</h3>
          <p className="text-muted-foreground text-xs mb-3">Give €10, Get €10 — Share your code</p>
          <div className="bg-surface rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-copper font-mono font-semibold text-sm">SHARP-FR1END</span>
            <button className="text-foreground text-xs">Copy</button>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-5 space-y-2">
        {[
          { label: "Reviews", action: () => navigate("/reviews") },
          { label: "Contact Us", action: () => navigate("/contact") },
          { label: "About The Sharp Cut", action: () => {} },
        ].map(item => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full card-app p-4 flex items-center justify-between"
          >
            <span className="text-foreground text-sm">{item.label}</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileScreen;
