import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, RefreshCw, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import InboxView from "./InboxView";
import { useLanguage } from "@/contexts/LanguageContext";

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

const STR = {
  en: {
    title: "Emails",
    tabs: { history: "History", compose: "Compose", inbox: "Inbox" },
    loadError: "Failed to load",
    fillAll: "Fill in all fields",
    sendFailed: "Failed",
    queued: "Email queued",
    stats: { total: "Total", sent: "Sent", pending: "Queued", failed: "Failed" },
    searchPlaceholder: "Search email or template...",
    statusAll: "All",
    statusSent: "Sent",
    statusPending: "Queued",
    statusDlq: "Failed",
    statusSuppressed: "Suppressed",
    loading: "Loading...",
    empty: "No emails",
    from: "From",
    to: "To",
    subject: "Subject",
    subjectPh: "Email subject",
    message: "Message",
    messagePh: "Type your message here...",
    send: "Send",
    sending: "Sending...",
    dnsHint: "· Once DNS is verified (up to 72h), the email will be sent automatically.",
  },
  de: {
    title: "E-Mails",
    tabs: { history: "Verlauf", compose: "Verfassen", inbox: "Posteingang" },
    loadError: "Laden fehlgeschlagen",
    fillAll: "Alle Felder ausfüllen",
    sendFailed: "Fehler",
    queued: "E-Mail in Warteschlange",
    stats: { total: "Gesamt", sent: "Gesendet", pending: "Warteschlange", failed: "Fehler" },
    searchPlaceholder: "E-Mail oder Vorlage suchen...",
    statusAll: "Alle",
    statusSent: "Gesendet",
    statusPending: "Warteschlange",
    statusDlq: "Fehler",
    statusSuppressed: "Unterdrückt",
    loading: "Laden...",
    empty: "Keine E-Mails",
    from: "Von",
    to: "An",
    subject: "Betreff",
    subjectPh: "E-Mail-Betreff",
    message: "Nachricht",
    messagePh: "Nachricht hier eingeben...",
    send: "Senden",
    sending: "Senden...",
    dnsHint: "· Sobald DNS verifiziert ist (bis zu 72h), wird die E-Mail automatisch gesendet.",
  },
};

const EmailsTab: React.FC = () => {
  const { lang } = useLanguage();
  const s = STR[lang];

  const [view, setView] = useState<"history" | "compose" | "inbox">("history");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("email_send_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error(s.loadError);
    } else {
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
      toast.error(s.fillAll);
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("gmail-send", {
      body: {
        to,
        subject,
        body: message,
      },
    });
    setSending(false);
    if (error || data?.error) {
      toast.error(`${s.sendFailed}: ${error?.message || data?.error}`);
    } else {
      toast.success(s.queued);
      setTo(""); setSubject(""); setMessage("");
      setTimeout(loadLogs, 1500);
    }
  };

  const statusColor = (st: string) => {
    if (st === "sent") return "bg-green-500/15 text-green-500 border-green-500/30";
    if (st === "pending") return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
    if (["dlq", "failed", "bounced", "complained"].includes(st)) return "bg-red-500/15 text-red-500 border-red-500/30";
    if (st === "suppressed") return "bg-orange-500/15 text-orange-500 border-orange-500/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="px-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2"><Mail className="text-copper" size={20} /> {s.title}</h2>
        <Button variant="ghost" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="history">{s.tabs.history}</TabsTrigger>
          <TabsTrigger value="compose">{s.tabs.compose}</TabsTrigger>
          <TabsTrigger value="inbox">{s.tabs.inbox}</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-3 mt-4">
          <div className="grid grid-cols-4 gap-2">
            <StatCard label={s.stats.total} value={stats.total} />
            <StatCard label={s.stats.sent} value={stats.sent} accent="text-green-500" />
            <StatCard label={s.stats.pending} value={stats.pending} accent="text-yellow-500" />
            <StatCard label={s.stats.failed} value={stats.failed} accent="text-red-500" />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={s.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-background border border-border rounded-md px-2 text-sm">
              <option value="all">{s.statusAll}</option>
              <option value="sent">{s.statusSent}</option>
              <option value="pending">{s.statusPending}</option>
              <option value="dlq">{s.statusDlq}</option>
              <option value="suppressed">{s.statusSuppressed}</option>
            </select>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {loading ? s.loading : s.empty}
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

        <TabsContent value="compose" className="space-y-3 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">{s.from}</label>
              <Input value="hello@sitdownvienna.app" disabled />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{s.to}</label>
              <Input type="email" placeholder="client@example.com" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{s.subject}</label>
              <Input placeholder={s.subjectPh} value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{s.message}</label>
              <Textarea rows={8} placeholder={s.messagePh} value={message} onChange={e => setMessage(e.target.value)} />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full bg-copper hover:bg-copper/90">
              <Send size={16} className="mr-2" />
              {sending ? s.sending : s.send}
            </Button>
            <p className="text-xs text-muted-foreground">{lang === "de" ? "· Wird sofort über Gmail gesendet." : "· Sent immediately through Gmail."}</p>
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="mt-4">
          <InboxView />
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
