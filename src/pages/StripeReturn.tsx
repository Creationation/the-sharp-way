import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X } from "lucide-react";

export default function StripeReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      try { localStorage.removeItem("stripe_booking_confirmed"); } catch {}
      return;
    }

    supabase.functions
      .invoke("verify-setup", { body: { session_id: sessionId } })
      .then(({ data, error }) => {
        if (error || !data?.verified) {
          setStatus("error");
          try {
            localStorage.removeItem("stripe_booking_confirmed");
            localStorage.setItem("stripe_confirmation", JSON.stringify({ verified: false, timestamp: Date.now() }));
          } catch {}
          return;
        }

        const confirmation = {
          verified: true,
          payment_status: data.payment_status,
          booking_id: data.booking_id,
          timestamp: Date.now(),
        };
        try {
          localStorage.setItem("stripe_confirmation", JSON.stringify(confirmation));
          localStorage.setItem("stripe_booking_confirmed", "1");
        } catch {}

        try {
          window.opener?.postMessage({ type: "STRIPE_BOOKING_CONFIRMED" }, window.location.origin);
        } catch {}

        setStatus("success");

        setTimeout(() => {
          if (window.opener && !window.opener.closed) {
            window.close();
          }
          setTimeout(() => {
            navigate("/profile", { replace: true });
          }, 400);
        }, 1200);
      })
      .catch(() => {
        try { localStorage.removeItem("stripe_booking_confirmed"); } catch {}
        setStatus("error");
      });
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center px-8">
        {status === "verifying" && (
          <>
            <Loader2 size={48} className="text-copper mx-auto mb-4 animate-spin" />
            <h2 className="font-heading text-xl text-foreground mb-2">Karte wird überprüft...</h2>
            <p className="text-muted-foreground text-sm">Bitte warte einen Moment</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-mint/20 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-mint" />
            </div>
            <h2 className="font-heading text-xl text-foreground mb-2">Zahlung bestätigt ✓</h2>
            <p className="text-muted-foreground text-sm">Dieses Fenster schließt sich automatisch...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <X size={28} className="text-destructive" />
            </div>
            <h2 className="font-heading text-xl text-foreground mb-2">Fehler bei der Verifizierung</h2>
            <p className="text-muted-foreground text-sm">Du kannst dieses Fenster schließen und es erneut versuchen.</p>
          </>
        )}
      </div>
    </div>
  );
}
