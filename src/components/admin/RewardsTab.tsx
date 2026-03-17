import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface RewardRequest {
  id: string;
  user_id: string;
  status: string;
  stamps_at_request: number;
  created_at: string;
  resolved_at: string | null;
  full_name?: string | null;
  email?: string | null;
}

interface Props {
  t: {
    title: string;
    pending: string;
    approved: string;
    rejected: string;
    noRequests: string;
    approve: string;
    reject: string;
    requestedOn: string;
    stampsAtRequest: string;
    loadError: string;
  };
}

const RewardsTab = ({ t }: Props) => {
  const [requests, setRequests] = useState<RewardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const [reqRes, profilesRes] = await Promise.all([
      supabase.from("reward_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);

    if (reqRes.error || profilesRes.error) {
      toast.error(t.loadError);
      setLoading(false);
      return;
    }

    const profiles = new Map(
      (profilesRes.data || []).map((p: any) => [p.user_id, p])
    );

    const merged = (reqRes.data || []).map((r: any) => {
      const profile = profiles.get(r.user_id);
      return {
        ...r,
        full_name: profile?.full_name,
        email: profile?.email,
      };
    });

    setRequests(merged);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("reward_requests")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", id);

    setUpdatingId(null);
    if (error) {
      toast.error("Error updating request");
    } else {
      toast.success(status === "approved" ? "✅ Approved!" : "❌ Rejected");

      // If approved, reset user's stamps to 0 and increment free_cuts_earned
      if (status === "approved") {
        const request = requests.find(r => r.id === id);
        if (request) {
          await supabase
            .from("user_loyalty")
            .update({
              stamps: 0,
              free_cuts_earned: (await supabase
                .from("user_loyalty")
                .select("free_cuts_earned")
                .eq("user_id", request.user_id)
                .single()
                .then(r => (r.data as any)?.free_cuts_earned || 0)) + 1,
            })
            .eq("user_id", request.user_id);
        }
      }

      fetchRequests();
    }
  };

  const filtered = requests.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? "gradient-copper text-primary-foreground"
                : "bg-surface border border-border text-muted-foreground"
            }`}
          >
            {f === "pending" ? t.pending : f === "approved" ? t.approved : t.rejected}
            {f === "pending" && requests.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1.5 bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                {requests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests */}
      {filtered.length === 0 ? (
        <div className="card-app p-8 text-center">
          <Gift size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">{t.noRequests}</p>
        </div>
      ) : (
        filtered.map(r => (
          <div key={r.id} className="card-app p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-foreground font-medium text-sm">{r.full_name || "—"}</p>
                <p className="text-muted-foreground text-xs">{r.email}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                r.status === "pending" ? "bg-copper/20 text-copper" :
                r.status === "approved" ? "bg-mint/20 text-mint" :
                "bg-destructive/20 text-destructive"
              }`}>
                {r.status === "pending" ? t.pending : r.status === "approved" ? t.approved : t.rejected}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{t.requestedOn}: {format(new Date(r.created_at), "dd/MM/yyyy HH:mm")}</span>
              <span>{t.stampsAtRequest}: {r.stamps_at_request}/10</span>
            </div>

            {r.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(r.id, "approved")}
                  disabled={updatingId === r.id}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-mint bg-mint/10 py-2 rounded-full disabled:opacity-50"
                >
                  <CheckCircle size={14} /> {t.approve}
                </button>
                <button
                  onClick={() => updateStatus(r.id, "rejected")}
                  disabled={updatingId === r.id}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 py-2 rounded-full disabled:opacity-50"
                >
                  <XCircle size={14} /> {t.reject}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default RewardsTab;
