import { useState, useEffect } from "react";

const LoadingScreen = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="text-center animate-logo-reveal">
        <h1 className="font-heading text-5xl md:text-7xl text-foreground tracking-widest">
          THE SHARP <span className="text-copper">CUT</span>
        </h1>
        <div className="mt-4 w-16 h-0.5 gradient-copper mx-auto animate-shimmer" />
      </div>
    </div>
  );
};

export default LoadingScreen;
