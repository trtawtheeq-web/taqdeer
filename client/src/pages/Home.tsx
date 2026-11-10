import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

type OriginalPageName =
  | "home"
  | "booking-appointment"
  | "managebooking"
  | "checkreportstatus"
  | "objections"
  | "raise-objection"
  | "about"
  | "privacy-policy"
  | "terms-of-use"
  | "vehicle-damage-assessment-center-services"
  | "damage-assessment-services-for-rental-services";

interface OriginalPageProps {
  page?: OriginalPageName;
  paymentSummary?: boolean;
}

const FRAME_ORIGIN = window.location.origin;
const SOURCE_RELEASE = "20261108-r9";

export function OriginalPage({ page = "home", paymentSummary = false }: OriginalPageProps) {
  const { isEnglish } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const previousOverflow = useRef<{ body: string; documentElement: string } | undefined>(undefined);
  const sourceLanguage = isEnglish ? "en" : "ar";
  const sourceUrl = `/original/${sourceLanguage}/${page}.html?v=${SOURCE_RELEASE}`;

  const sendTheme = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: "taqdeer-set-theme", theme },
      FRAME_ORIGIN,
    );
  }, [theme]);

  const sendScreen = useCallback(() => {
    if (page !== "booking-appointment") return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "taqdeer-payment-screen", open: paymentSummary },
      FRAME_ORIGIN,
    );
  }, [page, paymentSummary]);

  useEffect(() => {
    previousOverflow.current = {
      body: document.body.style.overflow,
      documentElement: document.documentElement.style.overflow,
    };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow.current?.body ?? "";
      document.documentElement.style.overflow = previousOverflow.current?.documentElement ?? "";
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<{ type?: string; theme?: string }>) => {
      if (event.origin !== FRAME_ORIGIN || event.source !== frameRef.current?.contentWindow) return;
      if (page === "booking-appointment" && event.data?.type === "taqdeer-summary-open") {
        navigate(`${isEnglish ? "/en" : ""}/payment-summary`);
        return;
      }
      if (page === "booking-appointment" && event.data?.type === "taqdeer-summary-back") {
        navigate(`${isEnglish ? "/en" : ""}/booking-appointment`);
        return;
      }
      if (event.data?.type !== "taqdeer-theme" || !toggleTheme) return;
      const nextTheme = event.data.theme === "dark" ? "dark" : "light";
      if (nextTheme !== theme) toggleTheme();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [theme, toggleTheme, navigate, page, isEnglish]);

  useEffect(() => {
    sendTheme();
  }, [sendTheme]);

  useEffect(() => {
    sendScreen();
  }, [sendScreen]);

  return (
    <iframe
      ref={frameRef}
      key={sourceUrl}
      src={sourceUrl}
      title={paymentSummary ? (isEnglish ? "Payment summary" : "ملخص الدفع") : (isEnglish ? "Taqdeer" : "تقدير")}
      onLoad={() => { sendTheme(); sendScreen(); }}
      sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation allow-popups"
      style={{ display: "block", width: "100%", height: "100dvh", border: 0 }}
    />
  );
}

export default function Home() {
  return <OriginalPage page="home" />;
}
