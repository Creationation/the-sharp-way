import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang, type Translations } from "@/lib/translations";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

async function syncLangToProfile(lang: Lang) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ language: lang }).eq("user_id", user.id);
  } catch {
    // ignore
  }
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("sitdown_lang") as Lang) || "de";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // On login / session change, pull stored preference from profile, then push current
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("language")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const stored = (data?.language as Lang | undefined) || null;
      if (stored && stored !== lang) {
        localStorage.setItem("sitdown_lang", stored);
        setLangState(stored);
      } else {
        // ensure profile has current localStorage choice
        syncLangToProfile(lang);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem("sitdown_lang", l);
    setLangState(l);
    syncLangToProfile(l);
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
    return { lang: "de" as Lang, setLang: () => {}, t: translations.de };
  }
  return ctx;
};
