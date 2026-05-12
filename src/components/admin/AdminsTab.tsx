import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Trash2, Plus, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

interface AdminRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

const STR = {
  en: {
    title: "Admins",
    current: "Current admins",
    add: "Promote a user to admin",
    searchPh: "Search user by name or email...",
    promote: "Make admin",
    remove: "Remove",
    confirmRemove: "Remove admin access?",
    promoted: "User promoted to admin",
    removed: "Admin access removed",
    loadFail: "Failed to load",
    actionFail: "Action failed",
    self: "You",
    noResults: "No users found",
    noAdmins: "No admins yet",
  },
  de: {
    title: "Admins",
    current: "Aktuelle Admins",
    add: "Benutzer zum Admin machen",
    searchPh: "Benutzer nach Name oder E-Mail suchen...",
    promote: "Admin machen",
    remove: "Entfernen",
    confirmRemove: "Adminrechte entfernen?",
    promoted: "Benutzer wurde Admin",
    removed: "Adminrechte entfernt",
    loadFail: "Laden fehlgeschlagen",
    actionFail: "Aktion fehlgeschlagen",
    self: "Du",
    noResults: "Keine Benutzer gefunden",
    noAdmins: "Noch keine Admins",
  },
};

const AdminsTab = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const s = STR[lang];

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    const { data: roleRows, error } = await supabase
      .from("user_roles")
      .select("id, user_id")
      .eq("role", "admin");
    if (error) {
      toast.error(s.loadFail);
      setLoading(false);
      return;
    }
    const ids = (roleRows || []).map(r => r.user_id);
    let profilesMap = new Map<string, ProfileRow>();
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ids);
      (profs as ProfileRow[] | null)?.forEach(p => profilesMap.set(p.user_id, p));
    }
    const merged: AdminRow[] = (roleRows || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      full_name: profilesMap.get(r.user_id)?.full_name ?? null,
      email: profilesMap.get(r.user_id)?.email ?? null,
    }));
    setAdmins(merged);
    setLoading(false);
  };

  useEffect(() => { loadAdmins(); }, []);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setResults([]); return; }
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(20);
      const adminIds = new Set(admins.map(a => a.user_id));
      setResults(((data as ProfileRow[]) || []).filter(p => !adminIds.has(p.user_id)));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, admins]);

  const promote = async (userId: string) => {
    setBusyId(userId);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    setBusyId(null);
    if (error) { toast.error(s.actionFail); return; }
    toast.success(s.promoted);
    setSearch("");
    setResults([]);
    loadAdmins();
  };

  const remove = async (rowId: string) => {
    if (!confirm(s.confirmRemove)) return;
    setBusyId(rowId);
    const { error } = await supabase.from("user_roles").delete().eq("id", rowId);
    setBusyId(null);
    if (error) { toast.error(s.actionFail); return; }
    toast.success(s.removed);
    loadAdmins();
  };

  return (
    <div className="px-5 space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="text-copper" size={20} />
        <h2 className="text-xl font-bold">{s.title}</h2>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.current}</p>
        {loading && <div className="text-muted-foreground text-sm">...</div>}
        {!loading && admins.length === 0 && (
          <div className="text-muted-foreground text-sm">{s.noAdmins}</div>
        )}
        {admins.map(a => (
          <div key={a.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-copper/15 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-copper" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {a.full_name || a.email || a.user_id}
                {user?.id === a.user_id && (
                  <span className="ml-2 text-[10px] text-copper">({s.self})</span>
                )}
              </div>
              {a.email && <div className="text-xs text-muted-foreground truncate">{a.email}</div>}
            </div>
            {user?.id !== a.user_id && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === a.id}
                onClick={() => remove(a.id)}
                className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <UserPlus size={12} /> {s.add}
        </p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={s.searchPh}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search.trim().length >= 2 && (
          <div className="space-y-2">
            {results.length === 0 && (
              <div className="text-xs text-muted-foreground py-2">{s.noResults}</div>
            )}
            {results.map(p => (
              <div key={p.user_id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                </div>
                <Button
                  size="sm"
                  disabled={busyId === p.user_id}
                  onClick={() => promote(p.user_id)}
                  className="bg-copper hover:bg-copper/90"
                >
                  <Plus size={14} className="mr-1" /> {s.promote}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminsTab;
