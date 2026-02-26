import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"logo" | "content">("logo");

  useEffect(() => {
    const t = setTimeout(() => setPhase("content"), 1200);
    return () => clearTimeout(t);
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

      {/* Logo top left */}
      <div className="relative z-10 px-6 pt-14 opacity-0 animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
        <p className="font-heading text-xl tracking-widest text-foreground">
          THE SHARP <span className="text-copper">CUT</span>
        </p>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6">
        {phase === "logo" ? (
          <div className="text-center animate-logo-reveal">
            <h1 className="font-heading text-6xl md:text-8xl text-foreground tracking-widest">
              THE SHARP <span className="text-copper">CUT</span>
            </h1>
            <div className="mt-4 w-20 h-0.5 gradient-copper mx-auto animate-shimmer" />
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="font-heading text-5xl sm:text-6xl md:text-8xl leading-[0.95] opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
              DISCOVER TOP<br />
              BARBERS & BOOK<br />
              <span className="text-gradient-copper">YOUR LOOK INSTANTLY.</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-sm opacity-0 animate-fade-up animation-delay-200" style={{ animationFillMode: "forwards" }}>
              Vienna's premium barbershop — walk in or book ahead
            </p>
            <div className="opacity-0 animate-fade-up animation-delay-400" style={{ animationFillMode: "forwards" }}>
              <button
                onClick={() => navigate("/home")}
                className="gradient-copper text-primary-foreground font-body font-semibold text-base px-8 py-3.5 rounded-full shadow-copper hover:opacity-90 transition-all flex items-center gap-2"
              >
                Get Started
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom text */}
      <div className="relative z-10 text-center pb-10 opacity-0 animate-fade-in animation-delay-600" style={{ animationFillMode: "forwards" }}>
        <p className="text-muted-foreground text-xs">
          Or walk in anytime · Tue–Sat 10AM–8PM
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
