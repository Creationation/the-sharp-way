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
        <img src="/sitdown-logo.png" alt="Sitdown Wien" className="h-24 md:h-32 mx-auto" />
        <div className="mt-4 w-16 h-0.5 gradient-copper mx-auto animate-shimmer" />
      </div>
    </div>
  );
};

export default LoadingScreen;
