import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";

type Language = "ar" | "en";
interface LanguageContextValue {
  language: Language;
  isEnglish: boolean;
  dir: "ltr" | "rtl";
  t: (arabic: string, english: string) => string;
  href: (path: string) => string;
  toggleLanguage: () => void;
}
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const isEnglish = /^\/en(?:\/|$)/.test(location);
  const language = isEnglish ? "en" : "ar";
  const dir = isEnglish ? "ltr" : "rtl";
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.title = isEnglish ? "Taqdeer — Design Preview" : "تقدير — نسخة تصميمية";
  }, [language, dir, isEnglish]);
  const href = (path: string) => {
    if (!path.startsWith("/") || path.startsWith("//")) return path;
    const base = path.replace(/^\/en(?=\/|$)/, "") || "/";
    return isEnglish ? (base === "/" ? "/en" : `/en${base}`) : base;
  };
  const toggleLanguage = () => {
    const base = window.location.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    const destination = isEnglish ? base : base === "/" ? "/en" : `/en${base}`;
    navigate(`${destination}${window.location.search}${window.location.hash}`);
  };
  return <LanguageContext.Provider value={{ language, isEnglish, dir, t: (ar, en) => isEnglish ? en : ar, href, toggleLanguage }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is required");
  return context;
}
