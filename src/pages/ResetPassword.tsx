import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [form, setForm] = useState({ password: "", confirm: "" });

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const raw = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(raw);

      // Expired / already used link
      if (params.get("error")) {
        if (!cancelled) setValidSession(false);
        return;
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // clean the tokens out of the address bar
        window.history.replaceState({}, "", window.location.pathname);
        if (!cancelled) setValidSession(!error);
        return;
      }

      // PKCE style link (?code=...) — the client exchanges it automatically
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) setValidSession(!!session);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error(t.auth.passwordsDontMatch);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      toast.success(t.auth.passwordUpdated);
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err: any) {
      toast.error(err.message || t.auth.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  if (validSession === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <p className="text-foreground mb-4">{t.auth.invalidResetLink}</p>
        <button
          onClick={() => navigate("/auth")}
          className="text-copper font-semibold"
        >
          {t.auth.backToSignIn}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-heading text-2xl text-foreground">{t.auth.resetTitle}</h1>
      </div>

      <div className="px-5 mt-4">
        <div className="text-center mb-8">
          <img src="/sitdown-logo.png" alt="Sitdown Wien" className="h-44 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">{t.auth.resetSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              placeholder={t.auth.newPassword}
              className="w-full bg-surface border border-border rounded-xl pl-12 pr-12 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
              minLength={6}
              placeholder={t.auth.confirmPassword}
              className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-copper text-primary-foreground font-semibold text-base py-3.5 rounded-full shadow-copper disabled:opacity-50"
          >
            {loading ? t.auth.loading : t.auth.updatePassword}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
