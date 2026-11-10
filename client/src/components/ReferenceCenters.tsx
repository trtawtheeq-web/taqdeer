import { useState } from "react";
import { ChevronDown, CircleCheck, Ellipsis, FileText, MapPin } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import "./ReferenceCenters.css";

type ScheduleLine = { arabic: string; english: string };
type ReferenceCenter = {
  id: string;
  name: string;
  englishName: string;
  distance: string;
  open: boolean;
  schedule: ScheduleLine[];
};

const cities = [
  { key: "riyadh", arabic: "الرياض", english: "Riyadh" },
  { key: "jeddah", arabic: "جدة", english: "Jeddah" },
  { key: "eastern-province", arabic: "المنطقة الشرقية", english: "Eastern Province" },
  { key: "medina", arabic: "المدينة المنورة", english: "Medina" },
  { key: "makkah", arabic: "مكة المكرمة", english: "Makkah" },
  { key: "abha", arabic: "أبها", english: "Abha" },
];

const referenceCenters: ReferenceCenter[] = [
  {
    id: "yousef-almalki",
    name: "شركة يوسف أحمد المالكي للتقييم",
    englishName: "Yousef Ahmed Al-Malki Assessment Co.",
    distance: "16.3",
    open: true,
    schedule: [
      { arabic: "الأحد - الخميس 8 ص - 9 م", english: "Sun - Thu · 8:00 AM - 9:00 PM" },
      { arabic: "السبت 8 ص - 9 م", english: "Saturday · 8:00 AM - 9:00 PM" },
    ],
  },
  {
    id: "barcode",
    name: "شركة باركود",
    englishName: "Barcode Company",
    distance: "21.3",
    open: false,
    schedule: [
      { arabic: "الأحد - الخميس 8 ص - 8 م", english: "Sun - Thu · 8:00 AM - 8:00 PM" },
      { arabic: "السبت 8 ص - 5 م", english: "Saturday · 8:00 AM - 5:00 PM" },
    ],
  },
  {
    id: "kartik",
    name: "تقنية السيارة للتقييم (كارتك)",
    englishName: "Car Technology Assessment (Kartek)",
    distance: "31.5",
    open: true,
    schedule: [
      { arabic: "الأحد - الخميس 8 ص - 11:30 م", english: "Sun - Thu · 8:00 AM - 11:30 PM" },
      { arabic: "الجمعة 2 م - 10 م", english: "Friday · 2:00 PM - 10:00 PM" },
      { arabic: "السبت 8 ص - 11:30 م", english: "Saturday · 8:00 AM - 11:30 PM" },
    ],
  },
  {
    id: "global-assessment",
    name: "شركة التقدير العالمية للتقييم",
    englishName: "Global Assessment Company",
    distance: "32.1",
    open: true,
    schedule: [{ arabic: "الأحد - السبت 8 ص - 8 م", english: "Sunday - Saturday · 8:00 AM - 8:00 PM" }],
  },
  {
    id: "motabaqa",
    name: "شركة مطابقة للتقييم",
    englishName: "Motabaqa Assessment Company",
    distance: "35.9",
    open: true,
    schedule: [
      { arabic: "الجمعة 2 م - 10 م", english: "Friday · 2:00 PM - 10:00 PM" },
      { arabic: "السبت 8 ص - 11:30 م", english: "Saturday · 8:00 AM - 11:30 PM" },
    ],
  },
];

const PAGE_SIZE = 5;

export default function ReferenceCenters() {
  const { dir, t } = useLanguage();
  const [city, setCity] = useState("riyadh");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const selectedCity = cities.find(item => item.key === city) ?? cities[0];
  const centers = city === "riyadh" ? referenceCenters : [];
  const visibleCenters = centers.slice(0, visibleCount);
  const hasMore = visibleCount < centers.length;

  return (
    <section className="reference-centers" id="centers" dir={dir}>
      <div className="reference-centers__container">
        <header className="reference-centers__heading">
          <h2><span>{t("مراكز", "Damage Assessment")}</span>{" "}<strong>{t("التقدير", "Centers")}</strong></h2>
          <p>{t("تعرف على أقرب المراكز في مدينتك", "Find the nearest centers in your city")}</p>
        </header>
        <div className="reference-centers__toolbar">
          <label className="reference-city-picker">
            <span className="sr-only">{t("اختر المدينة", "Select a city")}</span>
            <select value={city} onChange={event => { setCity(event.target.value); setVisibleCount(PAGE_SIZE); }}>
              {cities.map(item => <option value={item.key} key={item.key}>{t(item.arabic, item.english)}</option>)}
            </select>
            <span className="reference-city-picker__label" aria-hidden="true">{t(selectedCity.arabic, selectedCity.english)}</span>
            <span className="reference-city-picker__divider" aria-hidden="true" />
            <span className="reference-city-picker__chevron" aria-hidden="true"><ChevronDown size={17} strokeWidth={2.2} /></span>
          </label>
        </div>
        <div className="reference-centers__list" aria-live="polite">
          {visibleCenters.map(center => <article className="reference-center-row" key={center.id}>
            <span className="reference-center-row__file-icon" aria-hidden="true"><FileText size={21} strokeWidth={1.8} /></span>
            <div className="reference-center-row__name"><strong>{t(center.name, center.englishName)}</strong></div>
            <div className="reference-center-row__city"><span>{t("المدينة", "City")}</span><strong>{t(selectedCity.arabic, selectedCity.english)}</strong></div>
            <div className="reference-center-row__hours">
              <span className="reference-center-row__hours-label">{t("أوقات العمل", "Working hours")}</span>
              <div className="reference-center-row__schedule">{center.schedule.map(line => <span key={`${center.id}-${line.english}`}>{t(line.arabic, line.english)}</span>)}</div>
            </div>
            <div className="reference-center-row__meta">
              <span className={`reference-status reference-status--${center.open ? "open" : "closed"}`}>
                <span className="reference-status__dot" aria-hidden="true" />{center.open ? t("مفتوح الآن", "Open now") : t("مغلق الآن", "Closed now")}
              </span>
              <span className="reference-distance"><CircleCheck size={15} strokeWidth={2} aria-hidden="true" />{center.distance} {t("كم", "km")}</span>
            </div>
            <button type="button" className="reference-center-row__map-button" aria-label={t(`عرض موقع ${center.name}`, `View the location for ${center.englishName}`)}><MapPin size={21} strokeWidth={1.9} aria-hidden="true" /></button>
          </article>)}
        </div>
        {hasMore && <div className="reference-centers__load-more-wrap">
          <button type="button" className="reference-centers__load-more" onClick={() => setVisibleCount(count => Math.min(count + PAGE_SIZE, centers.length))}>
            <span>{t("عرض المزيد", "Show more")}</span><Ellipsis size={19} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>}
      </div>
    </section>
  );
}
