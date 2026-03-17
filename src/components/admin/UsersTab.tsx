import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface UsersTabProps {
  t: {
    title: string;
    search: string;
    totalUsers: string;
    name: string;
    email: string;
    phone: string;
    joined: string;
    noUsers: string;
    noPhone: string;
    noName: string;
    loadError: string;
  };
}

const UsersTab = ({ t }: UsersTabProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, phone, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(t.loadError);
      setLoading(false);
      return;
    }
    setUsers((data as Profile[]) || []);
    setLoading(false);
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
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
    <div className="px-5">
      {/* Stats */}
      <div className="card-app p-4 mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full gradient-copper flex items-center justify-center">
          <Users size={18} className="text-primary-foreground" />
        </div>
        <div>
          <p className="text-copper font-heading text-2xl">{users.length}</p>
          <p className="text-muted-foreground text-xs">{t.totalUsers}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper/50"
        />
      </div>

      {/* User list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card-app p-8 text-center">
            <p className="text-muted-foreground">{t.noUsers}</p>
          </div>
        ) : (
          filtered.map((u) => (
            <div key={u.user_id} className="card-app p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={16} className="text-copper" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium text-sm truncate">
                    {u.full_name || <span className="italic text-muted-foreground">{t.noName}</span>}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail size={11} className="text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground text-xs truncate">{u.email || "—"}</p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone size={11} className="text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground text-xs">
                      {u.phone || <span className="italic">{t.noPhone}</span>}
                    </p>
                  </div>

                  <p className="text-muted-foreground text-[10px] mt-1.5">
                    {t.joined} {format(new Date(u.created_at), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersTab;
