import { useState } from "react";
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const AuthScreen = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        await supabase.functions.invoke("send-password-reset", {
          body: {
            email: form.email,
            lang: localStorage.getItem("sitdown_lang") || "de",
            redirectTo: `${window.location.origin}/reset-password`,
          },
        });
        // Always show the same success message — no email enumeration
        toast.success(t.auth.resetLinkSent);
        setMode("login");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t.toasts.accountCreated);
        navigate("/home");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success(t.toasts.welcomeBack);
        navigate("/home");
      }
    } catch (error: any) {
      toast.error(error.message || t.auth.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">
          {mode === "login" ? t.auth.signIn : mode === "signup" ? t.auth.createAccount : t.auth.forgotTitle}
        </h1>
      </div>

      <div className="px-5 mt-4">
        <div className="text-center mb-8">
          <img src="/sitdown-logo.png" alt="Sitdown Wien" className="h-44 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            {mode === "login" ? t.auth.welcomeBack : mode === "signup" ? t.auth.joinCommunity : t.auth.forgotSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                placeholder={t.auth.fullName}
                className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder={t.auth.email}
              className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors"
            />
          </div>

          {mode !== "forgot" && (
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder={t.auth.password}
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
          )}

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-copper text-sm font-medium"
              >
                {t.auth.forgotPassword}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-copper text-primary-foreground font-semibold text-base py-3.5 rounded-full shadow-copper disabled:opacity-50"
          >
            {loading
              ? t.auth.loading
              : mode === "login"
                ? t.auth.signIn
                : mode === "signup"
                  ? t.auth.createAccount
                  : t.auth.sendResetLink}
          </button>
        </form>

        {mode === "forgot" ? (
          <p className="text-center text-muted-foreground text-sm mt-6">
            <button
              onClick={() => setMode("login")}
              className="text-copper font-semibold"
            >
              {t.auth.backToSignIn}
            </button>
          </p>
        ) : (
          <p className="text-center text-muted-foreground text-sm mt-6">
            {mode === "login" ? t.auth.noAccount : t.auth.hasAccount}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-copper font-semibold ml-1"
            >
              {mode === "login" ? t.auth.signUp : t.auth.signIn}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
