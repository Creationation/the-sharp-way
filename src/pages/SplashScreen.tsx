import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const SplashScreen = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const [phase, setPhase] = useState<"logo" | "content">("logo");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("content"), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/placeholder.svg"
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Spacer for top */}
      <div className="relative z-10 px-6 pt-14" />

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6">
        {phase === "logo" ? (
          <div className="text-center animate-logo-reveal">
            <img src="/sitdown-logo.png" alt="Sitdown Wien" className="h-40 md:h-56 mx-auto" />
            <div className="mt-4 w-20 h-0.5 gradient-copper mx-auto animate-shimmer" />
          </div>
        ) : (
          <div className="space-y-6">
            <img src="/sitdown-logo.png" alt="Sitdown Wien" className="h-20 md:h-28 mb-4 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }} />
            <h1 className="font-heading text-5xl sm:text-6xl md:text-8xl leading-[0.95] opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
              {t.splash.line1}<br />
              {t.splash.line2}<br />
              <span className="text-gradient-copper">{t.splash.line3}</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-sm opacity-0 animate-fade-up animation-delay-200" style={{ animationFillMode: "forwards" }}>
              {t.splash.sub}
            </p>

            {/* Language picker */}
            <div className="opacity-0 animate-fade-up animation-delay-300" style={{ animationFillMode: "forwards" }}>
              <p className="text-muted-foreground text-xs mb-2">{t.splash.pickLanguage}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLang("de")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    lang === "de"
                      ? "gradient-copper text-primary-foreground border-transparent shadow-copper"
                      : "bg-surface border-border text-muted-foreground"
                  }`}
                >
                  🇩🇪 Deutsch
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    lang === "en"
                      ? "gradient-copper text-primary-foreground border-transparent shadow-copper"
                      : "bg-surface border-border text-muted-foreground"
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div className="opacity-0 animate-fade-up animation-delay-400" style={{ animationFillMode: "forwards" }}>
              <button
                onClick={() => navigate("/home")}
                className="gradient-copper text-primary-foreground font-body font-semibold text-base px-8 py-3.5 rounded-full shadow-copper hover:opacity-90 transition-all flex items-center gap-2"
              >
                {t.splash.cta}
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom text */}
      <div className="relative z-10 text-center pb-10 opacity-0 animate-fade-in animation-delay-600" style={{ animationFillMode: "forwards" }}>
        <p className="text-muted-foreground text-xs">
          {t.splash.walkin}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
