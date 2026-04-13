import { useEffect, useState } from "react";
import { Search, Save, Trophy, Scissors, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserLoyalty {
  user_id: string;
  full_name: string | null;
  email: string | null;
  stamps: number;
  total_points: number;
  free_cuts_earned: number;
}

interface Props {
  t: {
    title: string;
    search: string;
    stamps: string;
    points: string;
    freeCuts: string;
    save: string;
    saved: string;
    saveError: string;
    loadError: string;
    noUsers: string;
    stampsOf10: string;
  };
}

const LoyaltyTab = ({ t }: Props) => {
  const [users, setUsers] = useState<UserLoyalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch profiles and loyalty data
    const [profilesRes, loyaltyRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email"),
      supabase.from("user_loyalty").select("user_id, stamps, total_points, free_cuts_earned"),
    ]);

    if (profilesRes.error || loyaltyRes.error) {
      toast.error(t.loadError);
      setLoading(false);
      return;
    }

    const profiles = (profilesRes.data || []) as any[];
    const loyalty = (loyaltyRes.data || []) as any[];
    const loyaltyMap = new Map(loyalty.map((l: any) => [l.user_id, l]));

    const merged: UserLoyalty[] = profiles.map((p: any) => {
      const l = loyaltyMap.get(p.user_id);
      return {
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        stamps: l?.stamps ?? 0,
        total_points: l?.total_points ?? 0,
        free_cuts_earned: l?.free_cuts_earned ?? 0,
      };
    });

    setUsers(merged);
    setLoading(false);
  };

  const updateField = (userId: string, field: keyof UserLoyalty, value: number) => {
    setUsers(prev =>
      prev.map(u => (u.user_id === userId ? { ...u, [field]: Math.max(0, value) } : u))
    );
  };

  const saveUser = async (u: UserLoyalty) => {
    setSavingId(u.user_id);
    const { error } = await supabase
      .from("user_loyalty")
      .upsert({
        user_id: u.user_id,
        stamps: u.stamps,
        total_points: u.total_points,
        free_cuts_earned: u.free_cuts_earned,
      }, { onConflict: "user_id" });
    setSavingId(null);
    if (error) toast.error(t.saveError);
    else toast.success(t.saved);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.search}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper/50"
        />
      </div>

      {/* Users */}
      {filtered.length === 0 ? (
        <div className="card-app p-8 text-center">
          <p className="text-muted-foreground text-sm">{t.noUsers}</p>
        </div>
      ) : (
        filtered.map(u => (
          <div key={u.user_id} className="card-app p-5 space-y-4">
            {/* User header */}
            <div>
              <p className="text-foreground font-medium text-sm">{u.full_name || "—"}</p>
              <p className="text-muted-foreground text-xs">{u.email}</p>
            </div>

            {/* Stamps visual */}
            <div>
              <label className="text-muted-foreground text-xs mb-2 block">
                {t.stamps} · {u.stamps}/10 ({t.stampsOf10})
              </label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                      i < u.stamps
                        ? "gradient-copper text-primary-foreground"
                        : i === 9
                        ? "border-2 border-copper border-dashed"
                        : "bg-surface border border-border"
                    }`}
                  >
                    {i < u.stamps ? "✂️" : i === 9 ? "🎁" : ""}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateField(u.user_id, "stamps", u.stamps - 1)}
                  className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center"
                >
                  <Minus size={14} className="text-foreground" />
                </button>
                <span className="text-foreground text-sm font-mono w-8 text-center">{u.stamps}</span>
                <button
                  onClick={() => updateField(u.user_id, "stamps", Math.min(u.stamps + 1, 10))}
                  className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center"
                >
                  <Plus size={14} className="text-foreground" />
                </button>
              </div>
            </div>

            {/* Points */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block flex items-center gap-1">
                  <Trophy size={12} className="text-copper" /> {t.points}
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={u.total_points}
                  onChange={e => updateField(u.user_id, "total_points", parseInt(e.target.value) || 0)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block flex items-center gap-1">
                  <Scissors size={12} className="text-copper" /> {t.freeCuts}
                </label>
                <input
                  type="number"
                  min="0"
                  value={u.free_cuts_earned}
                  onChange={e => updateField(u.user_id, "free_cuts_earned", parseInt(e.target.value) || 0)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-copper/50 transition-colors"
                />
              </div>
            </div>

            {/* Save */}
            <button
              onClick={() => saveUser(u)}
              disabled={savingId === u.user_id}
              className="w-full gradient-copper text-primary-foreground font-semibold py-2.5 rounded-full shadow-copper flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              <Save size={14} />
              {savingId === u.user_id ? "..." : t.save}
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default LoyaltyTab;
