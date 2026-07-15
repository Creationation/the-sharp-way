import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBarbers } from "@/hooks/useBarbers";
import { useTagesplanMode } from "@/hooks/useTagesplanMode";
import ScheduleTab from "@/components/admin/ScheduleTab";
const sitdownLogo = "/sitdown-logo.png";

const TagesplanFullscreen = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { isAdmin, adminChecked, loading } = useAuth();
  const { barbers: dbBarbers } = useBarbers();
  const { setEnabled } = useTagesplanMode();

  // Guard: only admins allowed
  useEffect(() => {
    if (!loading && adminChecked && !isAdmin) {
      navigate("/home", { replace: true });
    }
  }, [loading, adminChecked, isAdmin, navigate]);

  const exitMode = () => {
    setEnabled(false);
    navigate("/home", { replace: true });
  };

  if (loading || !adminChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Status bar spacer — solid black behind device clock/battery */}
      <div className="bg-black pt-safe h-[max(env(safe-area-inset-top),44px)]" />
      {/* Fullscreen header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <img src={sitdownLogo} alt="Sitdown" className="h-8 w-auto opacity-90" />
            <span className="text-copper font-heading text-lg tracking-wider">
              {lang === "de" ? "TAGESPLAN" : "DAILY PLAN"}
            </span>
          </div>
          <button
            onClick={exitMode}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 active:scale-95 transition"
          >
            <LogOut size={13} />
            {lang === "de" ? "Normaler Modus" : "Normal mode"}
          </button>
        </div>
      </header>

      <div className="pt-4">
        <ScheduleTab
          t={{
            title: lang === "de" ? "Tagesplan" : "Daily plan",
            exportCsv: lang === "de" ? "Als Excel exportieren" : "Export as Excel",
            noBookings: lang === "de" ? "Keine Buchungen" : "No bookings",
            hour: lang === "de" ? "Stunde" : "Hour",
          }}
          barbers={dbBarbers.map((b) => ({
            id: b.id,
            name: b.name,
            color: (b as unknown as { color?: string }).color || "#C78D4E",
          }))}
        />
      </div>
    </div>
  );
};

export default TagesplanFullscreen;
