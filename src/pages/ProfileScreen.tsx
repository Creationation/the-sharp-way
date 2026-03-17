import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Gift, ChevronRight, Calendar, Clock, LogOut, Shield, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { toast } from "sonner";

interface Booking {
  id: string;
  barber_name: string;
  service_name: string;
  service_price: string;
  booking_date: string;
  booking_time: string;
  status: string;
}

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [stamps, setStamps] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [rewardPending, setRewardPending] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBookings();
    fetchLoyalty();
  }, [user, authLoading]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true });
    setBookings((data as Booking[]) || []);
    setLoading(false);
  };

  const cancelBooking = async (id: string) => {
    setCancelling(id);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);
    setCancelling(null);
    if (error) {
      toast.error(t.toasts.cancelError);
    } else {
      toast.success(t.toasts.bookingCancelled);
      fetchBookings();
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter(b => b.booking_date >= today && b.status === "confirmed");
  const past = bookings.filter(b => b.booking_date < today || b.status === "cancelled");

  const fetchLoyalty = async () => {
    const [loyaltyRes, rewardRes] = await Promise.all([
      supabase
        .from("user_loyalty")
        .select("stamps, total_points")
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase
        .from("reward_requests")
        .select("id")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .limit(1),
    ]);
    if (loyaltyRes.data) {
      setStamps((loyaltyRes.data as any).stamps ?? 0);
      setTotalPoints((loyaltyRes.data as any).total_points ?? 0);
    }
    setRewardPending((rewardRes.data?.length ?? 0) > 0);
  };

  const claimReward = async () => {
    setClaimingReward(true);
    const { error } = await supabase
      .from("reward_requests")
      .insert({ user_id: user!.id, stamps_at_request: stamps });
    setClaimingReward(false);
    if (error) {
      toast.error("Error submitting request");
    } else {
      toast.success(t.profile.rewardClaimed);
      setRewardPending(true);
    }
  };


  const handleSignOut = async () => {
    await signOut();
    navigate("/home");
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground flex-1">{t.profile.title}</h1>
        <button onClick={handleSignOut} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <LogOut size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* User info */}
      <div className="px-5 mb-5">
        <div className="card-app p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-copper flex items-center justify-center text-primary-foreground font-heading text-xl">
            {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-foreground font-medium text-sm">{user.user_metadata?.full_name || "User"}</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Loyalty Card */}
      <div className="px-5 mb-6">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 gradient-copper opacity-20" />
          <div className="relative border border-copper/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-heading text-lg text-copper tracking-widest">{t.profile.member}</p>
              <span className="text-foreground text-[10px] bg-surface px-2 py-1 rounded-full">{t.profile.gold}</span>
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
              {t.profile.stampsLabel(stamps)}
            </p>

            {stamps >= 10 && !rewardPending && (
              <button
                onClick={claimReward}
                disabled={claimingReward}
                className="mt-3 w-full gradient-copper text-primary-foreground font-semibold py-3 rounded-full shadow-copper text-sm animate-pulse disabled:opacity-50 disabled:animate-none"
              >
                {claimingReward ? "..." : t.profile.claimReward}
              </button>
            )}
            {rewardPending && (
              <p className="mt-3 text-copper text-xs text-center font-medium">
                {t.profile.rewardPending}
              </p>
            )}
          </div>
        </div>
      </div>


      {/* My Bookings */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-lg text-foreground mb-3">{t.profile.myBookings}</h3>
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
              {tab === "upcoming" ? t.profile.upcoming : t.profile.past}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card-app p-8 text-center">
            <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (activeTab === "upcoming" ? upcoming : past).length === 0 ? (
          <div className="card-app p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {activeTab === "upcoming" ? t.profile.noUpcoming : t.profile.noPast}
            </p>
            {activeTab === "upcoming" && (
              <button onClick={() => navigate("/book")} className="text-copper text-sm font-semibold mt-2">
                {t.profile.bookNow}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {(activeTab === "upcoming" ? upcoming : past).map(b => (
              <div key={b.id} className={`card-app p-4 ${b.status === "cancelled" ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-copper flex-shrink-0" />
                    <span className="text-foreground text-sm font-medium">
                      {b.service_name} {t.profile.with} {b.barber_name}
                    </span>
                  </div>
                  {b.status === "cancelled" && (
                    <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full flex-shrink-0">
                      {t.common.cancelled}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-xs mb-3">
                  <Clock size={12} />
                  <span>{format(new Date(b.booking_date), "dd/MM/yyyy")} · {b.booking_time}</span>
                  <span className="text-copper font-semibold">{b.service_price}</span>
                </div>
                {activeTab === "upcoming" && b.status === "confirmed" && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    disabled={cancelling === b.id}
                    className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-full disabled:opacity-50"
                  >
                    <XCircle size={12} />
                    {cancelling === b.id
                      ? t.toasts.cancelling
                      : t.common.cancelBooking}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Language selector */}
      <div className="px-5 mb-5">
        <div className="card-app p-4">
          <p className="text-foreground text-sm font-medium mb-3">{t.profile.language}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLang("de")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                lang === "de"
                  ? "gradient-copper text-primary-foreground border-transparent shadow-copper"
                  : "bg-surface border-border text-muted-foreground"
              }`}
            >
              🇩🇪 Deutsch
            </button>
            <button
              onClick={() => setLang("en")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                lang === "en"
                  ? "gradient-copper text-primary-foreground border-transparent shadow-copper"
                  : "bg-surface border-border text-muted-foreground"
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-5 space-y-2">
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="w-full card-app p-4 flex items-center justify-between border-copper/30"
          >
            <span className="text-copper text-sm font-semibold flex items-center gap-2">
              <Shield size={16} /> {t.profile.adminDashboard}
            </span>
            <ChevronRight size={16} className="text-copper" />
          </button>
        )}
        {[
          { label: t.profile.reviews, action: () => navigate("/reviews") },
          { label: t.profile.contact, action: () => navigate("/contact") },
          
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
