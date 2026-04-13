import { createContext, useContext, useState } from "react";
import { translations, type Lang, type Translations } from "@/lib/translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("sitdown_lang") as Lang) || "de";
  });

  const setLang = (l: Lang) => {
    localStorage.setItem("sitdown_lang", l);
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback for HMR edge cases — return default German
    return { lang: "de" as Lang, setLang: () => {}, t: translations.de };
  }
  return ctx;
};
