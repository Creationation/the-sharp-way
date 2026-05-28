import { createContext, useContext, useEffect, useRef, useState } from "react";
import { translations, type Lang, type Translations } from "@/lib/translations";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

async function syncLangToProfile(lang: Lang, userId?: string) {
  try {
    const id = userId ?? (await supabase.auth.getUser()).data.user?.id;
    if (!id) return;
    await supabase.from("profiles").update({ language: lang }).eq("user_id", id);
  } catch {
    // ignore
  }
}

async function loadLangFromProfile(userId: string, fallbackLang: Lang, onLang: (lang: Lang) => void) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("language")
      .eq("user_id", userId)
      .maybeSingle();
    const stored = data?.language === "en" || data?.language === "de" ? data.language : null;
    if (stored && stored !== fallbackLang) {
      localStorage.setItem("sitdown_lang", stored);
      onLang(stored);
    } else {
      await syncLangToProfile(fallbackLang, userId);
    }
  } catch {
    // keep local language if profile cannot be reached
  }
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("sitdown_lang") as Lang) || "de";
  });
  const langRef = useRef(lang);

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  // On login / session restore, pull stored preference from profile without blocking auth events.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadLangFromProfile(session.user.id, langRef.current, setLangState);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return;
      setTimeout(() => {
        loadLangFromProfile(session.user.id, langRef.current, setLangState);
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
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
