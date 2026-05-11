import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"validating" | "valid" | "invalid" | "already" | "submitting" | "done" | "error">("validating");
  const [errMsg, setErrMsg] = useState("");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
          headers: { apikey: anonKey },
        });
        const data = await res.json();
        if (!res.ok) { setState("invalid"); setErrMsg(data.error || ""); return; }
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch (e: any) {
        setState("error"); setErrMsg(e.message);
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success || data.reason === "already_unsubscribed") setState("done");
      else { setState("error"); setErrMsg(data.error || ""); }
    } catch (e: any) { setState("error"); setErrMsg(e.message); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-copper/15 flex items-center justify-center">
          <Mail className="text-copper" size={26} />
        </div>
        <h1 className="text-2xl font-bold">Désabonnement</h1>

        {state === "validating" && (
          <div className="flex justify-center"><Loader2 className="animate-spin text-copper" /></div>
        )}
        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground">Confirme ton désabonnement des emails de Sitdown Vienna.</p>
            <Button onClick={confirm} className="w-full bg-copper hover:bg-copper/90">Confirmer le désabonnement</Button>
          </>
        )}
        {state === "submitting" && (
          <div className="flex justify-center"><Loader2 className="animate-spin text-copper" /></div>
        )}
        {(state === "done" || state === "already") && (
          <>
            <CheckCircle2 className="mx-auto text-green-500" size={36} />
            <p className="text-sm text-muted-foreground">
              {state === "already" ? "Tu es déjà désabonné·e." : "Désabonnement confirmé. Tu ne recevras plus d'emails."}
            </p>
            <Link to="/"><Button variant="outline" className="w-full">Retour à l'accueil</Button></Link>
          </>
        )}
        {(state === "invalid" || state === "error") && (
          <>
            <XCircle className="mx-auto text-red-500" size={36} />
            <p className="text-sm text-muted-foreground">
              {state === "invalid" ? "Lien invalide ou expiré." : `Erreur · ${errMsg}`}
            </p>
            <Link to="/"><Button variant="outline" className="w-full">Retour à l'accueil</Button></Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
