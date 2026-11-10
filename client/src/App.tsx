import NotFound from "@/pages/NotFound";
import { useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home, { OriginalPage } from "./pages/Home";

type SourcePage =
  | "home"
  | "booking-appointment"
  | "payment-summary"
  | "managebooking"
  | "checkreportstatus"
  | "objections"
  | "raise-objection"
  | "about"
  | "privacy-policy"
  | "terms-of-use"
  | "vehicle-damage-assessment-center-services"
  | "damage-assessment-services-for-rental-services";

const sourcePages: Record<string, SourcePage> = {
  "/": "home",
  "/booking-appointment": "booking-appointment",
  "/payment-summary": "payment-summary",
  "/managebooking": "managebooking",
  "/checkreportstatus": "checkreportstatus",
  "/objections": "objections",
  "/raise-objection": "raise-objection",
  "/about": "about",
  "/privacy-policy": "privacy-policy",
  "/terms-of-use": "terms-of-use",
  "/vehicle-damage-assessment-center-services": "vehicle-damage-assessment-center-services",
  "/damage-assessment-services-for-rental-services": "damage-assessment-services-for-rental-services",
};

function Router() {
  const [location] = useLocation();
  const path = (location.replace(/^\/en(?=\/|$)/, "") || "/").replace(/\/$/, "") || "/";
  const page = sourcePages[path];
  if (!page) return <NotFound />;
  if (page === "booking-appointment" || page === "payment-summary") {
    return <OriginalPage page="booking-appointment" paymentSummary={page === "payment-summary"} />;
  }
  return page === "home" ? <Home /> : <OriginalPage page={page} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LanguageProvider>
          <Router />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
