import { useState, useEffect } from "react";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookie-consent");
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-card border border-border rounded-lg p-4 shadow-xl animate-fade-up">
      <p className="text-sm text-muted-foreground mb-3">
        We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
      </p>
      <button
        onClick={accept}
        className="gradient-copper text-primary-foreground font-heading tracking-widest text-xs px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
      >
        ACCEPT
      </button>
    </div>
  );
};

export default CookieConsent;
