import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, User, Trash2, XCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Booking {
  id: string;
  user_id: string;
  barber_name: string;
  service_name: string;
  service_price: string;
  service_duration: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null; phone: string | null } | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled">("all");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/home");
      return;
    }
    if (isAdmin) fetchBookings();
  }, [isAdmin, authLoading]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, profiles(full_name, email, phone)")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (error) {
      toast.error("Failed to load bookings");
      return;
    }
    setBookings((data as any) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Error updating booking");
      return;
    }
    toast.success(status === "cancelled" ? "Booking cancelled" : "Status updated");
    fetchBookings();
  };

  const deleteBooking = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      toast.error("Error deleting booking");
      return;
    }
    toast.success("Booking deleted");
    fetchBookings();
  };

  const filtered = bookings.filter(b => filter === "all" || b.status === filter);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="px-5 mb-5 grid grid-cols-3 gap-3">
        <div className="card-app p-3 text-center">
          <p className="text-copper font-heading text-2xl">{bookings.length}</p>
          <p className="text-muted-foreground text-[10px]">Total</p>
        </div>
        <div className="card-app p-3 text-center">
          <p className="text-mint font-heading text-2xl">{bookings.filter(b => b.status === "confirmed").length}</p>
          <p className="text-muted-foreground text-[10px]">Confirmed</p>
        </div>
        <div className="card-app p-3 text-center">
          <p className="text-destructive font-heading text-2xl">{bookings.filter(b => b.status === "cancelled").length}</p>
          <p className="text-muted-foreground text-[10px]">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 mb-4 flex gap-2">
        {(["all", "confirmed", "cancelled"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              filter === f ? "gradient-copper text-primary-foreground" : "bg-surface border border-border text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "confirmed" ? "Confirmed" : "Cancelled"}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="px-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="card-app p-8 text-center">
            <p className="text-muted-foreground">No bookings</p>
          </div>
        ) : (
          filtered.map(b => (
            <div key={b.id} className={`card-app p-4 ${b.status === "cancelled" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-foreground font-medium text-sm">{b.service_name}</p>
                  <p className="text-muted-foreground text-xs">avec {b.barber_name}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  b.status === "confirmed" ? "bg-mint/20 text-mint" : "bg-destructive/20 text-destructive"
                }`}>
                  {b.status === "confirmed" ? "Confirmé" : "Annulé"}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(b.booking_date), "dd/MM/yyyy")}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {b.booking_time}</span>
                <span className="text-copper font-semibold">{b.service_price}</span>
              </div>

              {b.profiles && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <User size={12} />
                  <span>{b.profiles.full_name || b.profiles.email}</span>
                  {b.profiles.phone && <span>· {b.profiles.phone}</span>}
                </div>
              )}

              {b.notes && <p className="text-muted-foreground text-xs italic mb-3">"{b.notes}"</p>}

              <div className="flex gap-2">
                {b.status === "confirmed" && (
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-full"
                  >
                    <XCircle size={12} /> Annuler
                  </button>
                )}
                {b.status === "cancelled" && (
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    className="flex items-center gap-1 text-xs text-mint bg-mint/10 px-3 py-1.5 rounded-full"
                  >
                    <CheckCircle size={12} /> Confirmer
                  </button>
                )}
                <button
                  onClick={() => deleteBooking(b.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground bg-surface px-3 py-1.5 rounded-full"
                >
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
