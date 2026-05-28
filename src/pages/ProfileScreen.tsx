import { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Calendar, Clock, LogOut, Shield, XCircle, AlertTriangle } from "lucide-react";
import { DE, GB } from "country-flag-icons/react/3x2";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [confirmCancelDate, setConfirmCancelDate] = useState<string>("");
  const [confirmCancelTime, setConfirmCancelTime] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBookings();
  }, [user, authLoading]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const timeout = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error("bookings fetch timeout") }), 10000)
      );
      const query = supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("booking_date", { ascending: true });
      const { data, error } = (await Promise.race([query, timeout])) as { data: Booking[] | null; error: unknown };
      if (error) {
        console.error("[Profile] fetchBookings error", error);
        toast.error(lang === "de" ? "Buchungen konnten nicht geladen werden" : "Could not load bookings");
      }
      setBookings((data as Booking[]) || []);
    } catch (err) {
      console.error("[Profile] fetchBookings exception", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id: string) => {
    setCancelling(id);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-booking", {
        body: { booking_id: id },
      });
      if (error) throw error;
      if (data?.charged) {
        toast.warning(t.toasts.cancelledCharged);
      } else {
        toast.success(t.toasts.cancelledFree);
      }
      fetchBookings();
    } catch {
      toast.error(t.toasts.cancelError);
    }
    setCancelling(null);
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter(b => b.booking_date >= today && b.status === "confirmed");
  const past = bookings.filter(b => b.booking_date < today || b.status === "cancelled");

  const handleSignOut = async () => {
    try { await signOut(); } catch {}
    // Hard reload to clear any cached state
    window.location.href = "/home";
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
                    onClick={() => {
                      setConfirmCancelId(b.id);
                      setConfirmCancelDate(b.booking_date);
                      setConfirmCancelTime(b.booking_time);
                    }}
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
              <DE title="Deutschland" className="w-5 h-auto rounded-sm shadow-sm" /> Deutsch
            </button>
            <button
              onClick={() => setLang("en")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                lang === "en"
                  ? "gradient-copper text-primary-foreground border-transparent shadow-copper"
                  : "bg-surface border-border text-muted-foreground"
              }`}
            >
              <GB title="United Kingdom" className="w-5 h-auto rounded-sm shadow-sm" /> English
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
          { label: t.profile.replayIntro, action: () => { localStorage.removeItem("sitdown_visited"); navigate("/"); } },
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

      {/* Cancel confirmation dialog */}
      <AlertDialog open={!!confirmCancelId} onOpenChange={(open) => { if (!open) setConfirmCancelId(null); }}>
        <AlertDialogContent className="bg-surface border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle size={18} className="text-copper" />
              {t.common.confirmCancelTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {(() => {
                const appt = new Date(`${confirmCancelDate}T${confirmCancelTime || "10:00"}:00`);
                const hoursUntil = (appt.getTime() - Date.now()) / (1000 * 60 * 60);
                return hoursUntil >= 24 ? t.common.confirmCancelFree : t.common.confirmCancelCharged;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-surface border-border text-foreground">
              {t.common.cancelBtn}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCancelId) cancelBooking(confirmCancelId);
                setConfirmCancelId(null);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              {t.common.confirmCancelBtn}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileScreen;
