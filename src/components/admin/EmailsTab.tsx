import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, Inbox, RefreshCw, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

const EmailsTab: React.FC = () => {
  const [view, setView] = useState<"history" | "compose" | "inbox">("history");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Composer
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_send_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Erreur de chargement");
    } else {
      // Deduplicate by message_id (keep most recent)
      const seen = new Set<string>();
      const dedup: LogRow[] = [];
      for (const row of (data as LogRow[]) || []) {
        const key = row.message_id || row.id;
        if (seen.has(key)) continue;
        seen.add(key);
        dedup.push(row);
      }
      setLogs(dedup);
    }
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (search && !(l.recipient_email || "").toLowerCase().includes(search.toLowerCase())
        && !(l.template_name || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [logs, statusFilter, search]);

  const stats = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter(l => l.status === "sent").length;
    const failed = logs.filter(l => ["dlq", "failed", "bounced"].includes(l.status)).length;
    const pending = logs.filter(l => l.status === "pending").length;
    return { total, sent, failed, pending };
  }, [logs]);

  const handleSend = async () => {
    if (!to || !subject || !message) {
      toast.error("Remplis tous les champs");
      return;
    }
    setSending(true);
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "manual-message",
        recipientEmail: to,
        idempotencyKey: `manual-${crypto.randomUUID()}`,
        templateData: { subject, message },
      },
    });
    setSending(false);
    if (error) {
      toast.error(`Échec: ${error.message}`);
    } else {
      toast.success("Email envoyé · en file d'attente");
      setTo(""); setSubject(""); setMessage("");
      setTimeout(loadLogs, 1500);
    }
  };

  const statusColor = (s: string) => {
    if (s === "sent") return "bg-green-500/15 text-green-500 border-green-500/30";
    if (s === "pending") return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
    if (["dlq", "failed", "bounced", "complained"].includes(s)) return "bg-red-500/15 text-red-500 border-red-500/30";
    if (s === "suppressed") return "bg-orange-500/15 text-orange-500 border-orange-500/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="px-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2"><Mail className="text-copper" size={20} /> Emails</h2>
        <Button variant="ghost" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="compose">Composer</TabsTrigger>
          <TabsTrigger value="inbox">Réception</TabsTrigger>
        </TabsList>

        {/* HISTORY */}
        <TabsContent value="history" className="space-y-3 mt-4">
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Envoyés" value={stats.sent} accent="text-green-500" />
            <StatCard label="En file" value={stats.pending} accent="text-yellow-500" />
            <StatCard label="Échecs" value={stats.failed} accent="text-red-500" />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher email ou template..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-background border border-border rounded-md px-2 text-sm">
              <option value="all">Tous</option>
              <option value="sent">Envoyés</option>
              <option value="pending">En file</option>
              <option value="dlq">Échecs</option>
              <option value="suppressed">Supprimés</option>
            </select>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {loading ? "Chargement..." : "Aucun email"}
              </div>
            )}
            {filtered.map(log => (
              <div key={log.id} className="bg-card border border-border rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={statusColor(log.status)}>{log.status}</Badge>
                      <span className="text-xs text-muted-foreground">{log.template_name}</span>
                    </div>
                    <div className="text-sm font-medium truncate">{log.recipient_email}</div>
                    {log.error_message && (
                      <div className="text-xs text-red-500 mt-1 flex items-start gap-1">
                        <AlertCircle size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{log.error_message}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(log.created_at), "dd/MM HH:mm")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* COMPOSE */}
        <TabsContent value="compose" className="space-y-3 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">De</label>
              <Input value="hello@sitdownvienna.app" disabled />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">À</label>
              <Input type="email" placeholder="client@example.com" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Sujet</label>
              <Input placeholder="Sujet de l'email" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Message</label>
              <Textarea rows={8} placeholder="Tape ton message ici..." value={message} onChange={e => setMessage(e.target.value)} />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full bg-copper hover:bg-copper/90">
              <Send size={16} className="mr-2" />
              {sending ? "Envoi..." : "Envoyer"}
            </Button>
            <p className="text-xs text-muted-foreground">
              · Une fois le DNS vérifié (jusqu'à 72h), l'email partira automatiquement.
            </p>
          </div>
        </TabsContent>

        {/* INBOX */}
        <TabsContent value="inbox" className="mt-4">
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
            <Inbox className="mx-auto text-copper" size={36} />
            <h3 className="font-bold">Boîte de réception</h3>
            <p className="text-sm text-muted-foreground">
              Lovable Emails ne stocke que les envois. Pour <strong>recevoir</strong> les réponses sur
              <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">hello@sitdownvienna.app</code>
              (ou les emails Stripe), il faut configurer un transfert vers une adresse Gmail.
            </p>
            <div className="text-xs text-left bg-muted/50 rounded-xl p-3 space-y-2">
              <p><strong>Étapes :</strong></p>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Crée un compte Gmail gratuit (ex: <code>sitdownvienna@gmail.com</code>)</li>
                <li>Une fois le DNS du domaine d'envoi propagé, configure un MX + forwarding sur <code>hello@sitdownvienna.app</code></li>
                <li>Utilise Stripe avec <code>hello@sitdownvienna.app</code> · les notifications arriveront sur ton Gmail</li>
              </ol>
              <p className="text-muted-foreground pt-1">
                Demande-moi quand tu es prêt et je te guide étape par étape.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; accent?: string }> = ({ label, value, accent }) => (
  <div className="bg-card border border-border rounded-2xl p-3">
    <div className={`text-2xl font-bold ${accent || "text-foreground"}`}>{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default EmailsTab;
