import React, { useEffect, useState } from "react";
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
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface ThreadMessage extends GmailMessage {
  cc?: string;
  messageIdHeader?: string;
  references?: string;
  html: string;
  text: string;
  fromMe?: boolean;
}

type FilterType = "all" | "unread" | "stripe" | "clients";

const FILTER_QUERIES: Record<FilterType, string> = {
  all: "in:anywhere -in:trash -in:spam",
  unread: "is:unread -in:trash -in:spam",
  stripe: "from:stripe.com -in:trash -in:spam",
  clients: "in:anywhere -from:stripe.com -from:noreply -in:trash -in:spam",
};

const STR = {
  en: {
    searchPlaceholder: "Search...",
    filters: { all: "All", unread: "Unread", stripe: "Stripe", clients: "Clients" },
    error: "Error",
    loading: "Loading...",
    empty: "No emails",
    back: "Back",
    reply: "Reply",
    cancel: "Cancel",
    send: "Send",
    archived: "Archived",
    deleted: "Deleted",
    replySent: "Reply sent",
    sendFailed: "Send failed",
    loadFailed: "Failed to load",
    noSubject: "(no subject)",
    to: "To",
    me: "Me",
    replyPlaceholder: "Your reply...",
    messagesInThread: "messages",
  },
  de: {
    searchPlaceholder: "Suchen...",
    filters: { all: "Alle", unread: "Ungelesen", stripe: "Stripe", clients: "Kunden" },
    error: "Fehler",
    loading: "Laden...",
    empty: "Keine E-Mails",
    back: "Zurück",
    reply: "Antworten",
    cancel: "Abbrechen",
    send: "Senden",
    archived: "Archiviert",
    deleted: "Gelöscht",
    replySent: "Antwort gesendet",
    sendFailed: "Senden fehlgeschlagen",
    loadFailed: "Laden fehlgeschlagen",
    noSubject: "(kein Betreff)",
    to: "An",
    me: "Ich",
    replyPlaceholder: "Ihre Antwort...",
    messagesInThread: "Nachrichten",
  },
};

const parseFromName = (from: string) => {
  const match = from.match(/^"?([^"<]+?)"?\s*<(.+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from, email: from };
};

const InboxView: React.FC = () => {
  const { lang } = useLanguage();
  const s = STR[lang];
  const dateLocale = lang === "de" ? deLocale : enUS;

  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [thread, setThread] = useState<ThreadMessage[] | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null);

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
      setError(e.message ?? s.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const openThread = async (m: GmailMessage) => {
    setLoadingThread(true);
    setThreadId(m.threadId);
    setThread(null);
    try {
      const { data, error } = await supabase.functions.invoke("gmail-thread", {
        body: { id: m.threadId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const msgs: ThreadMessage[] = data.messages ?? [];
      setThread(msgs);
      setExpandedMsgId(msgs[msgs.length - 1]?.id ?? null);

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
      toast.error(e.message ?? s.loadFailed);
      setThread(null);
      setThreadId(null);
    } finally {
      setLoadingThread(false);
    }
  };

  const closeThread = () => {
    setThread(null);
    setThreadId(null);
    setReplyOpen(false);
    setReplyBody("");
    setExpandedMsgId(null);
  };

  const handleArchive = async () => {
    if (!thread || !threadId) return;
    for (const m of thread) {
      await supabase.functions.invoke("gmail-modify", {
        body: { id: m.id, action: "archive" },
      });
    }
    toast.success(s.archived);
    setMessages((prev) => prev.filter((x) => x.threadId !== threadId));
    closeThread();
  };

  const handleTrash = async () => {
    if (!thread || !threadId) return;
    for (const m of thread) {
      await supabase.functions.invoke("gmail-modify", {
        body: { id: m.id, action: "trash" },
      });
    }
    toast.success(s.deleted);
    setMessages((prev) => prev.filter((x) => x.threadId !== threadId));
    closeThread();
  };

  const handleReply = async () => {
    if (!thread || !replyBody.trim()) return;
    const last = thread[thread.length - 1];
    setSending(true);
    try {
      const { email } = parseFromName(last.fromMe ? last.to : last.from);
      const subject = (last.subject || "").startsWith("Re:")
        ? last.subject
        : `Re: ${last.subject}`;
      const { data, error } = await supabase.functions.invoke("gmail-send", {
        body: {
          to: email,
          subject,
          body: replyBody,
          threadId: last.threadId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(s.replySent);
      setReplyOpen(false);
      setReplyBody("");
      // reload thread to show the just-sent reply
      await openThread({ ...last } as any);
    } catch (e: any) {
      toast.error(e.message ?? s.sendFailed);
    } finally {
      setSending(false);
    }
  };

  // ---------- Thread (conversation) view ----------
  if (threadId) {
    const subject = thread?.[0]?.subject || s.noSubject;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={closeThread}>
            <ArrowLeft size={16} className="mr-1" /> {s.back}
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleArchive}>
              <Archive size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleTrash}>
              <Trash2 size={16} className="text-red-500" />
            </Button>
            <Button size="sm" className="bg-copper hover:bg-copper/90 text-black" onClick={() => setReplyOpen(true)}>
              <Reply size={14} className="mr-1" /> {s.reply}
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-bold text-lg leading-tight">{subject}</h2>
          {thread && (
            <div className="text-xs text-muted-foreground mt-1">
              {thread.length} {s.messagesInThread}
            </div>
          )}
        </div>

        {loadingThread && (
          <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={16} /> {s.loading}
          </div>
        )}

        {thread && (
          <div className="space-y-2">
            {thread.map((m) => {
              const { name, email } = parseFromName(m.fromMe ? (m.to || "") : m.from);
              const expanded = expandedMsgId === m.id;
              const senderLabel = m.fromMe ? s.me : name;
              return (
                <div
                  key={m.id}
                  className={`border rounded-2xl overflow-hidden ${
                    m.fromMe
                      ? "bg-copper/5 border-copper/30 ml-4"
                      : "bg-card border-border mr-4"
                  }`}
                >
                  <button
                    onClick={() => setExpandedMsgId(expanded ? null : m.id)}
                    className="w-full text-left p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {m.fromMe && <span className="text-copper">{s.me} → </span>}
                        {senderLabel}
                      </div>
                      {!expanded && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {m.snippet}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {m.internalDate &&
                        formatDistanceToNow(new Date(parseInt(m.internalDate)), {
                          locale: dateLocale,
                          addSuffix: false,
                        })}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-border/50">
                      <div className="px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                        <div className="truncate">{email}</div>
                        <div>
                          {m.date &&
                            format(new Date(m.date), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                        </div>
                      </div>
                      {m.html ? (
                        <iframe
                          title={`email-${m.id}`}
                          sandbox=""
                          srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{font-family:Inter,system-ui,sans-serif;color:#0D0D0D;background:#fff;padding:12px;margin:0;font-size:14px;line-height:1.5}img{max-width:100%;height:auto}a{color:#C9A46E}blockquote{border-left:3px solid #ddd;padding-left:10px;color:#666;margin:10px 0}</style></head><body>${m.html}</body></html>`}
                          className="w-full min-h-[300px] bg-white"
                        />
                      ) : (
                        <pre className="p-3 text-sm whitespace-pre-wrap font-sans bg-white text-black">
                          {m.text || m.snippet}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {replyOpen && thread && (
          <div className="bg-card border border-copper/40 rounded-2xl p-4 space-y-3 sticky bottom-2">
            <div className="text-xs text-muted-foreground">
              {s.to} · {parseFromName(thread[thread.length - 1].fromMe ? (thread[thread.length - 1].to || "") : thread[thread.length - 1].from).email}
            </div>
            <Textarea
              autoFocus
              rows={5}
              placeholder={s.replyPlaceholder}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReply}
                disabled={sending || !replyBody.trim()}
                className="flex-1 bg-copper hover:bg-copper/90 text-black"
              >
                {sending ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} className="mr-1" /> {s.send}</>}
              </Button>
              <Button variant="ghost" onClick={() => { setReplyOpen(false); setReplyBody(""); }}>
                {s.cancel}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- List view ----------
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={s.searchPlaceholder}
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
            {s.filters[f]}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-start gap-2 text-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-red-500 font-medium">{s.error}</div>
            <div className="text-xs text-muted-foreground break-all">{error}</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading && messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={14} /> {s.loading}
          </div>
        )}
        {!loading && messages.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {s.empty}
          </div>
        )}
        {messages.map((m) => {
          const { name } = parseFromName(m.from);
          return (
            <button
              key={m.id}
              onClick={() => openThread(m)}
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
                    formatDistanceToNow(new Date(parseInt(m.internalDate)), { locale: dateLocale, addSuffix: false })}
                </span>
              </div>
              <div className={`text-sm truncate ${m.unread ? "font-semibold" : ""}`}>
                {m.subject || s.noSubject}
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
