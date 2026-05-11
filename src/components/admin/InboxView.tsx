import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  ArrowLeft,
  Archive,
  Trash2,
  Reply,
  Mail,
  MailOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  internalDate: string;
  labelIds: string[];
  unread: boolean;
}

interface GmailDetail extends GmailMessage {
  cc?: string;
  messageIdHeader?: string;
  references?: string;
  html: string;
  text: string;
}

type FilterType = "all" | "unread" | "stripe" | "clients";

const FILTER_QUERIES: Record<FilterType, string> = {
  all: "in:inbox",
  unread: "in:inbox is:unread",
  stripe: "in:inbox from:stripe.com",
  clients: "in:inbox -from:stripe.com -from:noreply",
};

const parseFromName = (from: string) => {
  const match = from.match(/^"?([^"<]+?)"?\s*<(.+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from, email: from };
};

const InboxView: React.FC = () => {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [selected, setSelected] = useState<GmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const loadList = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = [FILTER_QUERIES[filter], search].filter(Boolean).join(" ");
      const { data, error } = await supabase.functions.invoke("gmail-list", {
        body: { q, maxResults: 30 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(data?.messages ?? []);
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const openMessage = async (m: GmailMessage) => {
    setLoadingDetail(true);
    setSelected({ ...m, html: "", text: "" });
    try {
      const { data, error } = await supabase.functions.invoke("gmail-get", {
        body: { id: m.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSelected(data);

      // Mark as read in background
      if (m.unread) {
        supabase.functions
          .invoke("gmail-modify", { body: { id: m.id, action: "markRead" } })
          .then(() => {
            setMessages((prev) =>
              prev.map((x) => (x.id === m.id ? { ...x, unread: false } : x)),
            );
          });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erreur de chargement");
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase.functions.invoke("gmail-modify", {
      body: { id, action: "archive" },
    });
    if (error) return toast.error("Erreur");
    toast.success("Archivé");
    setSelected(null);
    setMessages((prev) => prev.filter((x) => x.id !== id));
  };

  const handleTrash = async (id: string) => {
    const { error } = await supabase.functions.invoke("gmail-modify", {
      body: { id, action: "trash" },
    });
    if (error) return toast.error("Erreur");
    toast.success("Supprimé");
    setSelected(null);
    setMessages((prev) => prev.filter((x) => x.id !== id));
  };

  const handleReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setSending(true);
    try {
      const { name: _n, email } = parseFromName(selected.from);
      const subject = selected.subject.startsWith("Re:")
        ? selected.subject
        : `Re: ${selected.subject}`;
      const refs = [selected.references, selected.messageIdHeader]
        .filter(Boolean)
        .join(" ");

      const { data, error } = await supabase.functions.invoke("gmail-send", {
        body: {
          to: email,
          subject,
          body: replyBody.replace(/\n/g, "<br>"),
          threadId: selected.threadId,
          inReplyTo: selected.messageIdHeader,
          references: refs,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Réponse envoyée");
      setReplyOpen(false);
      setReplyBody("");
    } catch (e: any) {
      toast.error(e.message ?? "Échec d'envoi");
    } finally {
      setSending(false);
    }
  };

  // Detail overlay
  if (selected) {
    const { name, email } = parseFromName(selected.from);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setReplyOpen(false); setReplyBody(""); }}>
            <ArrowLeft size={16} className="mr-1" /> Retour
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleArchive(selected.id)}>
              <Archive size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleTrash(selected.id)}>
              <Trash2 size={16} className="text-red-500" />
            </Button>
            <Button size="sm" className="bg-copper hover:bg-copper/90" onClick={() => setReplyOpen(true)}>
              <Reply size={14} className="mr-1" /> Répondre
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <h2 className="font-bold text-lg leading-tight">{selected.subject || "(sans sujet)"}</h2>
          <div className="flex items-center justify-between text-sm">
            <div className="min-w-0">
              <div className="font-medium truncate">{name}</div>
              <div className="text-xs text-muted-foreground truncate">{email}</div>
            </div>
            <div className="text-xs text-muted-foreground shrink-0 ml-2">
              {selected.date && format(new Date(selected.date), "dd MMM yyyy HH:mm", { locale: fr })}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loadingDetail ? (
            <div className="p-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={16} /> Chargement...
            </div>
          ) : selected.html ? (
            <iframe
              title="email-body"
              sandbox=""
              srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{font-family:Inter,system-ui,sans-serif;color:#0D0D0D;background:#fff;padding:16px;margin:0;font-size:14px;line-height:1.5}img{max-width:100%;height:auto}a{color:#C9A46E}</style></head><body>${selected.html}</body></html>`}
              className="w-full min-h-[400px] bg-white"
            />
          ) : (
            <pre className="p-4 text-sm whitespace-pre-wrap font-sans">{selected.text || selected.snippet}</pre>
          )}
        </div>

        {replyOpen && (
          <div className="bg-card border border-copper/40 rounded-2xl p-4 space-y-3">
            <div className="text-xs text-muted-foreground">À · {email}</div>
            <Textarea
              autoFocus
              rows={6}
              placeholder="Ta réponse..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleReply} disabled={sending || !replyBody.trim()} className="flex-1 bg-copper hover:bg-copper/90">
                {sending ? <Loader2 className="animate-spin" size={16} /> : "Envoyer"}
              </Button>
              <Button variant="ghost" onClick={() => { setReplyOpen(false); setReplyBody(""); }}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
            className="pl-9"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={loadList} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "unread", "stripe", "clients"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${
              filter === f
                ? "bg-copper text-black border-copper"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" && "Tous"}
            {f === "unread" && "Non lus"}
            {f === "stripe" && "Stripe"}
            {f === "clients" && "Clients"}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-start gap-2 text-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-red-500 font-medium">Erreur</div>
            <div className="text-xs text-muted-foreground break-all">{error}</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading && messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={14} /> Chargement...
          </div>
        )}
        {!loading && messages.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucun email
          </div>
        )}
        {messages.map((m) => {
          const { name } = parseFromName(m.from);
          return (
            <button
              key={m.id}
              onClick={() => openMessage(m)}
              className={`w-full text-left bg-card border border-border rounded-2xl p-3 hover:border-copper/40 transition ${
                m.unread ? "border-l-4 border-l-copper" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {m.unread ? (
                    <Mail size={14} className="text-copper shrink-0" />
                  ) : (
                    <MailOpen size={14} className="text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm truncate ${m.unread ? "font-bold" : "font-medium"}`}>
                    {name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {m.internalDate &&
                    formatDistanceToNow(new Date(parseInt(m.internalDate)), { locale: fr, addSuffix: false })}
                </span>
              </div>
              <div className={`text-sm truncate ${m.unread ? "font-semibold" : ""}`}>
                {m.subject || "(sans sujet)"}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {m.snippet}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InboxView;
