import { Lock, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PaymentExplanation() {
  const { lang } = useLanguage();
  const isDE = lang === "de";

  const title = isDE ? "Warum benötigen wir Ihre Kartendaten?" : "Why do we need your card details?";
  const intro = isDE
    ? "Ihre Karte wird bei der Buchung NICHT belastet. Wir verifizieren lediglich Ihre Zahlungsmethode, um Ihren Termin zu sichern."
    : "Your card will NOT be charged at booking. We only verify your payment method to secure your appointment.";
  const howItWorks = isDE ? "So funktioniert es:" : "How it works:";
  const items = isDE
    ? [
        "Bei der Buchung: Ihre Karte wird nur verifiziert, es wird nichts abgebucht",
        "Am Tag Ihres Termins: Die Reservierungsgebühr von 5€ wird automatisch abgebucht",
        "Bei rechtzeitiger Stornierung (mehr als 24 Stunden vorher): Es wird nichts abgebucht",
        "Bei Stornierung weniger als 24 Stunden vorher oder bei Nichterscheinen: Die 5€ Reservierungsgebühr wird einbehalten",
      ]
    : [
        "At booking: Your card is only verified, nothing is charged",
        "On appointment day: The €5 reservation fee is automatically charged",
        "Free cancellation up to 24 hours before: Nothing is charged",
        "Late cancellation or no-show: The €5 reservation fee is kept",
      ];
  const secure = isDE
    ? "Ihre Daten sind sicher. Die Zahlung wird über Stripe verarbeitet, einen der weltweit führenden Zahlungsanbieter."
    : "Your data is safe. Payment is processed via Stripe, one of the world's leading payment providers.";

  return (
    <div className="rounded-xl p-5 mb-5 bg-copper/5 border border-copper/20">
      <div className="flex items-center gap-2 mb-3">
        <Lock size={16} className="text-copper" />
        <h4 className="text-sm font-semibold text-copper">{title}</h4>
      </div>

      <p className="text-xs leading-relaxed mb-3 text-muted-foreground">{intro}</p>

      <div className="text-xs font-semibold mb-2 text-foreground">{howItWorks}</div>

      <ul className="space-y-2 mb-4">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <span className="flex-shrink-0 mt-0.5">
              <ShieldCheck size={13} className="text-copper" />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <p className="text-[11px] leading-relaxed text-muted-foreground">{secure}</p>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-copper/20">
        <Lock size={11} className="text-muted-foreground" />
        <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
          Powered by Stripe
        </span>
      </div>
    </div>
  );
}
