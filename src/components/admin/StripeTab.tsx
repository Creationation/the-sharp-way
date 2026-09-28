import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, RefreshCw, Wallet, Clock, TrendingUp, Undo2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";

interface Charge {
  id: string; amount: number; amount_refunded: number; currency: string; status: string;
  paid: boolean; refunded: boolean; created: number; description: string | null;
  email: string | null; name: string | null; failure_message: string | null;
  card_brand: string | null; card_last4: string | null;
}
interface Payout { id: string; amount: number; currency: string; status: string; arrival_date: number }
interface Data {
  livemode: boolean;
  balance: { available: number; pending: number };
  charges: Charge[]; payouts: Payout[]; refunds_total: number;
}

const eur = (c: number) => new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(c / 100);

const StripeTab = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase.functions.invoke("stripe-dashboard");
    if (error || data?.error) setError(de ? "Stripe-Daten konnten nicht geladen werden" : "Could not load Stripe data");
    else setData(data as Data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const ok = data.charges.filter(c => c.paid && c.status === "succeeded");
    const failed = data.charges.filter(c => c.status === "failed");
    const revenue = ok.reduce((s, c) => s + c.amount - c.amount_refunded, 0);
    const days: { day: string; amount: number }[] = [];
    const map = new Map<string, number>();
    ok.forEach(c => {
      const k = format(new Date(c.created * 1000), "yyyy-MM-dd");
      map.set(k, (map.get(k) || 0) + c.amount - c.amount_refunded);
    });
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const k = format(d, "yyyy-MM-dd");
      days.push({ day: format(d, "dd.MM"), amount: (map.get(k) || 0) / 100 });
    }
    return {
      revenue, count: ok.length, failed: failed.length,
      avg: ok.length ? revenue / ok.length : 0,
      successRate: data.charges.length ? Math.round((ok.length / data.charges.length) * 100) : 0,
      days,
    };
  }, [data]);

  const statusLabel = (c: Charge) => {
    if (c.refunded) return { t: de ? "Erstattet" : "Refunded", cls: "text-muted-foreground bg-muted" };
    if (c.status === "succeeded") return { t: de ? "Bezahlt" : "Paid", cls: "text-mint bg-mint/15" };
    if (c.status === "failed") return { t: de ? "Fehlgeschlagen" : "Failed", cls: "text-destructive bg-destructive/15" };
    return { t: de ? "Ausstehend" : "Pending", cls: "text-copper bg-copper/15" };
  };

  return (
    <div className="px-5 space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="text-copper" size={20} />
          <h2 className="text-xl font-bold">Stripe</h2>
          {data && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${data.livemode ? "bg-mint/15 text-mint" : "bg-copper/15 text-copper"}`}>
              {data.livemode ? "LIVE" : "TEST"}
            </span>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {loading && !data && <div className="text-muted-foreground text-sm">...</div>}

      {data && stats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Metric icon={Wallet} label={de ? "Verfügbar" : "Available"} value={eur(data.balance.available)} accent />
            <Metric icon={Clock} label={de ? "Ausstehend" : "Pending"} value={eur(data.balance.pending)} />
            <Metric icon={TrendingUp} label={de ? "Umsatz 30 Tage" : "Revenue 30 days"} value={eur(stats.revenue)} />
            <Metric icon={CreditCard} label={de ? "Zahlungen" : "Payments"} value={`${stats.count} · Ø ${eur(stats.avg)}`} />
            <Metric icon={Undo2} label={de ? "Erstattungen" : "Refunds"} value={eur(data.refunds_total)} />
            <Metric icon={AlertTriangle} label={de ? "Erfolgsquote" : "Success rate"} value={`${stats.successRate}% · ${stats.failed} ✕`} />
          </div>

          <div className="bg-card border border-border rounded-2xl p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              {de ? "Umsatz pro Tag (30 Tage)" : "Daily revenue (30 days)"}
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.days}>
                  <defs>
                    <linearGradient id="stripeRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--copper, 36 45% 61%))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--copper, 36 45% 61%))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={35} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                    formatter={(v: number) => [`${v.toFixed(2)} €`, de ? "Umsatz" : "Revenue"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--copper, 36 45% 61%))" fill="url(#stripeRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{de ? "Letzte Zahlungen" : "Recent payments"}</p>
            {data.charges.length === 0 && <div className="text-sm text-muted-foreground">{de ? "Keine Zahlungen" : "No payments"}</div>}
            {data.charges.slice(0, 20).map(c => {
              const st = statusLabel(c);
              return (
                <div key={c.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name || c.email || c.description || c.id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {format(new Date(c.created * 1000), "dd.MM.yyyy HH:mm")}
                      {c.card_last4 && ` · ${c.card_brand?.toUpperCase()} ••${c.card_last4}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">{eur(c.amount)}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.cls}`}>{st.t}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{de ? "Auszahlungen" : "Payouts"}</p>
            {data.payouts.length === 0 && <div className="text-sm text-muted-foreground">{de ? "Keine Auszahlungen" : "No payouts"}</div>}
            {data.payouts.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-3 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{format(new Date(p.arrival_date * 1000), "dd.MM.yyyy")} · {p.status}</div>
                <div className="text-sm font-semibold">{eur(p.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) => (
  <div className={`bg-card border rounded-2xl p-3 ${accent ? "border-copper/40" : "border-border"}`}>
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1"><Icon size={12} /> {label}</div>
    <div className={`text-base font-bold truncate ${accent ? "text-copper" : ""}`}>{value}</div>
  </div>
);

export default StripeTab;
