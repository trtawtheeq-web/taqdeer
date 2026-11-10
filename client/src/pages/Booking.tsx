import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bike,
  BusFront,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock3,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
  CarFront,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import "../components/booking/Booking.css";

type Step = 1 | 2 | 3;
type VehicleClass = "cars" | "motorcycles" | "buses" | "trucks" | "";
type LanguageLabel = { ar: string; en: string };

type BookingForm = {
  vehicleClass: VehicleClass;
  serviceType: string;
  name: string;
  phone: string;
  reportNumber: string;
  vehicleType: string;
  city: string;
  centerId: string;
  date: string;
  time: string;
};

type ErrorCode =
  | "vehicleClass"
  | "serviceType"
  | "name"
  | "phone"
  | "phoneInvalid"
  | "reportNumber"
  | "city"
  | "center"
  | "date"
  | "datePast"
  | "time";
type FormErrors = Partial<Record<keyof BookingForm | "center", ErrorCode>>;

type Center = {
  id: string;
  city: string;
  name: LanguageLabel;
};

const vehicleOptions: Array<{
  value: Exclude<VehicleClass, "">;
  label: LanguageLabel;
  icon: typeof CarFront;
}> = [
  { value: "cars", label: { ar: "سيارات", en: "Cars" }, icon: CarFront },
  { value: "motorcycles", label: { ar: "دراجات نارية", en: "Motorcycles" }, icon: Bike },
  { value: "buses", label: { ar: "حافلات", en: "Buses" }, icon: BusFront },
  { value: "trucks", label: { ar: "شاحنات", en: "Trucks" }, icon: Truck },
];

const serviceOptions: Array<{ value: string; label: LanguageLabel }> = [
  { value: "traffic", label: { ar: "تقدير أضرار الحوادث المرورية", en: "Traffic accident damage assessment" } },
  { value: "non-traffic", label: { ar: "أضرار غير مرورية", en: "Non-traffic damage" } },
];

const cities: Array<{ value: string; label: LanguageLabel }> = [
  { value: "الرياض", label: { ar: "الرياض", en: "Riyadh" } },
  { value: "جدة", label: { ar: "جدة", en: "Jeddah" } },
  { value: "الدمام", label: { ar: "الدمام", en: "Dammam" } },
  { value: "المدينة المنورة", label: { ar: "المدينة المنورة", en: "Madinah" } },
];

const centers: Center[] = [
  {
    id: "riyadh",
    city: "الرياض",
    name: { ar: "مركز الرياض", en: "Riyadh Center" },
  },
  {
    id: "jeddah",
    city: "جدة",
    name: { ar: "مركز جدة", en: "Jeddah Center" },
  },
  {
    id: "dammam",
    city: "الدمام",
    name: { ar: "مركز الدمام", en: "Dammam Center" },
  },
  {
    id: "madinah",
    city: "المدينة المنورة",
    name: { ar: "مركز المدينة المنورة", en: "Madinah Center" },
  },
];

const timeOptions: Array<{ value: string; label: LanguageLabel }> = [
  { value: "09:00 ص", label: { ar: "09:00 ص", en: "09:00 AM" } },
  { value: "10:30 ص", label: { ar: "10:30 ص", en: "10:30 AM" } },
  { value: "01:00 م", label: { ar: "01:00 م", en: "01:00 PM" } },
  { value: "03:30 م", label: { ar: "03:30 م", en: "03:30 PM" } },
];

const errorMessages: Record<ErrorCode, LanguageLabel> = {
  vehicleClass: { ar: "اختر فئة المركبة", en: "Select a vehicle class" },
  serviceType: { ar: "اختر نوع الخدمة", en: "Select a service type" },
  name: { ar: "أدخل الاسم", en: "Enter your name" },
  phone: { ar: "أدخل رقم الجوال", en: "Enter your mobile number" },
  phoneInvalid: { ar: "أدخل رقم جوال صحيح", en: "Enter a valid mobile number" },
  reportNumber: { ar: "أدخل رقم الحادث/التقرير", en: "Enter the accident/report number" },
  city: { ar: "اختر المدينة", en: "Select a city" },
  center: { ar: "اختر مركزًا", en: "Select a center" },
  date: { ar: "اختر التاريخ", en: "Select a date" },
  datePast: { ar: "اختر تاريخًا قادمًا", en: "Select an upcoming date" },
  time: { ar: "اختر موعدًا", en: "Select a time" },
};

const initialForm: BookingForm = {
  vehicleClass: "",
  serviceType: "",
  name: "",
  phone: "",
  reportNumber: "",
  vehicleType: "",
  city: "",
  centerId: "",
  date: "",
  time: "",
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatBookingDate(value: string, language: "ar" | "en") {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStepFromUrl(): Step {
  if (typeof window === "undefined") return 1;
  const value = Number(new URLSearchParams(window.location.search).get("step"));
  return value === 2 || value === 3 ? value : 1;
}

export default function Booking() {
  const { isEnglish, language, dir, t, href } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<BookingForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const localize = (label: LanguageLabel) => t(label.ar, label.en);

  const selectedVehicle = vehicleOptions.find((item) => item.value === form.vehicleClass);
  const selectedService = serviceOptions.find((item) => item.value === form.serviceType);
  const selectedCenter = centers.find((item) => item.id === form.centerId);
  const selectedTime = timeOptions.find((item) => item.value === form.time);
  const filteredCenters = centers.filter((item) => item.city === form.city);

  useEffect(() => {
    if (getStepFromUrl() !== 1) {
      const url = new URL(window.location.href);
      url.searchParams.set("step", "1");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (!window.location.pathname.includes("booking-appointment")) return;
      const requested = getStepFromUrl();
      let allowed = requested;
      if (requested > 1 && !validateStep(1)) allowed = 1;
      else if (requested > 2 && !validateStep(2)) allowed = 2;
      if (allowed !== requested) updateStep(allowed, true);
      else setStep(allowed);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [form]);

  const updateStep = (nextStep: Step, replace = false) => {
    setStep(nextStep);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("step", String(nextStep));
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      if (replace) window.history.replaceState({}, "", nextUrl);
      else window.history.pushState({}, "", nextUrl);
    }
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const setField = <K extends keyof BookingForm>(field: K, value: BookingForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "centerId") delete next.center;
      return next;
    });
  };

  const setCity = (city: string) => {
    setForm((current) => ({ ...current, city, centerId: "" }));
    setErrors((current) => {
      const next = { ...current };
      delete next.city;
      delete next.centerId;
      delete next.center;
      return next;
    });
  };

  const validateStep = (currentStep: Step) => {
    const nextErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!form.vehicleClass) nextErrors.vehicleClass = "vehicleClass";
      if (!form.serviceType) nextErrors.serviceType = "serviceType";
      if (!form.name.trim()) nextErrors.name = "name";
      if (!form.phone.trim()) nextErrors.phone = "phone";
      else if (form.phone.replace(/[^0-9٠-٩]/g, "").length < 9) nextErrors.phone = "phoneInvalid";
      if (!form.reportNumber.trim()) nextErrors.reportNumber = "reportNumber";
    }

    if (currentStep === 2) {
      if (!form.city) nextErrors.city = "city";
      if (!form.centerId) nextErrors.center = "center";
      if (!form.date) nextErrors.date = "date";
      else if (form.date < todayKey) nextErrors.date = "datePast";
      if (!form.time) nextErrors.time = "time";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === 1) updateStep(2);
    if (step === 2) updateStep(3);
  };

  const handlePrevious = () => {
    if (step === 1) return;
    updateStep((step - 1) as Step);
  };

  const errorFor = (field: keyof BookingForm | "center") => errors[field];

  const renderError = (field: keyof BookingForm | "center") => {
    const code = errorFor(field);
    return code ? (
      <p className="booking-field-error" id={`booking-${String(field)}-error`} role="alert">
        <AlertCircle size={14} aria-hidden="true" />
        {localize(errorMessages[code])}
      </p>
    ) : null;
  };

  const fieldDescribedBy = (field: keyof BookingForm | "center") =>
    errorFor(field) ? `booking-${String(field)}-error` : undefined;

  const renderStepHeading = (number: string, title: string, description: string) => (
    <div className="booking-section-heading">
      <span className="booking-section-number" aria-hidden="true">
        {number}
      </span>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );

  const renderStepOne = () => (
      <section className="booking-card" aria-labelledby="booking-step-one-title">
      <div id="booking-step-one-title">
        {renderStepHeading("01", t("المعلومات العامة", "General Information"), "")}
      </div>

      <fieldset className="booking-fieldset" aria-describedby={fieldDescribedBy("vehicleClass")}>
        <legend>
          {t("فئة المركبة", "Vehicle Class")} <span className="booking-required">*</span>
        </legend>
        <div className="booking-vehicle-grid">
          {vehicleOptions.map(({ value, label, icon: Icon }) => (
            <label className={`booking-choice-card ${form.vehicleClass === value ? "is-selected" : ""}`} key={value}>
              <input
                type="radio"
                name="vehicleClass"
                value={value}
                checked={form.vehicleClass === value}
                onChange={() => setField("vehicleClass", value)}
                aria-describedby={fieldDescribedBy("vehicleClass")}
              />
              <span className="booking-choice-icon">
                <Icon size={25} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="booking-choice-label">{localize(label)}</span>
              <span className="booking-choice-check" aria-hidden="true">
                <Check size={13} />
              </span>
            </label>
          ))}
        </div>
        {renderError("vehicleClass")}
      </fieldset>

      <fieldset className="booking-fieldset booking-service-fieldset" aria-describedby={fieldDescribedBy("serviceType")}>
        <legend>
          {t("اختيار نوع الخدمة", "Select Service Type")} <span className="booking-required">*</span>
        </legend>
        <div className="booking-service-grid">
          {serviceOptions.map(({ value, label }) => (
            <label className={`booking-service-card ${form.serviceType === value ? "is-selected" : ""}`} key={value}>
              <input
                type="radio"
                name="serviceType"
                value={value}
                checked={form.serviceType === value}
                onChange={() => setField("serviceType", value)}
                aria-describedby={fieldDescribedBy("serviceType")}
              />
              <span className="booking-radio-mark" aria-hidden="true" />
              <span>{localize(label)}</span>
            </label>
          ))}
        </div>
        {renderError("serviceType")}
      </fieldset>

      <div className="booking-fields-grid">
        <div className="booking-field">
          <label htmlFor="booking-name">
            {t("الاسم", "Name")} <span className="booking-required">*</span>
          </label>
          <div className="booking-input-wrap">
            <UserRound size={18} aria-hidden="true" />
            <input
              id="booking-name"
              type="text"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder={t("أدخل الاسم", "Enter your name")}
              autoComplete="off"
              aria-invalid={Boolean(errorFor("name"))}
              aria-describedby={fieldDescribedBy("name")}
            />
          </div>
          {renderError("name")}
        </div>

        <div className="booking-field">
          <label htmlFor="booking-phone">
            {t("رقم الجوال", "Mobile Number")} <span className="booking-required">*</span>
          </label>
          <div className="booking-input-wrap">
            <Phone size={18} aria-hidden="true" />
            <input
              id="booking-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
              placeholder="05xxxxxxxx"
              inputMode="tel"
              autoComplete="off"
              aria-invalid={Boolean(errorFor("phone"))}
              aria-describedby={fieldDescribedBy("phone")}
            />
          </div>
          {renderError("phone")}
        </div>

        <div className="booking-field">
          <label htmlFor="booking-report-number">
            {t("رقم الحادث/التقرير", "Accident/Report Number")} <span className="booking-required">*</span>
          </label>
          <div className="booking-input-wrap">
            <FileText size={18} aria-hidden="true" />
            <input
              id="booking-report-number"
              type="text"
              value={form.reportNumber}
              onChange={(event) => setField("reportNumber", event.target.value)}
              placeholder={t("مثال: 123456", "Example: 123456")}
              aria-invalid={Boolean(errorFor("reportNumber"))}
              aria-describedby={fieldDescribedBy("reportNumber")}
            />
          </div>
          {renderError("reportNumber")}
        </div>

        <div className="booking-field">
          <label htmlFor="booking-vehicle-type">
            {t("نوع المركبة", "Vehicle Type")} <span className="booking-optional">{t("(اختياري)", "(Optional)")}</span>
          </label>
          <div className="booking-input-wrap">
            <CarFront size={18} aria-hidden="true" />
            <input
              id="booking-vehicle-type"
              type="text"
              value={form.vehicleType}
              onChange={(event) => setField("vehicleType", event.target.value)}
              placeholder={t("مثال: سيدان 2023", "Example: Sedan 2023")}
            />
          </div>
        </div>
      </div>
    </section>
  );

  const renderStepTwo = () => (
    <section className="booking-card" aria-labelledby="booking-step-two-title">
      <div id="booking-step-two-title">
        {renderStepHeading("02", t("حجز الموعد", "Book Appointment"), t("اختر المدينة والمركز والتاريخ والوقت المناسبين", "Choose the city, center, date, and suitable time"))}
      </div>

      <div className="booking-fields-grid booking-fields-grid--two">
        <div className="booking-field">
          <label htmlFor="booking-city">
            {t("المدينة", "City")} <span className="booking-required">*</span>
          </label>
          <div className="booking-select-wrap">
            <MapPin size={18} aria-hidden="true" />
            <select
              id="booking-city"
              value={form.city}
              onChange={(event) => setCity(event.target.value)}
              aria-invalid={Boolean(errorFor("city"))}
              aria-describedby={fieldDescribedBy("city")}
            >
              <option value="">{t("اختر المدينة", "Select a city")}</option>
              {cities.map((city) => (
                <option value={city.value} key={city.value}>
                  {localize(city.label)}
                </option>
              ))}
            </select>
            <ChevronDown className="booking-select-chevron" size={17} aria-hidden="true" />
          </div>
          {renderError("city")}
        </div>
      </div>

      <div className="booking-subsection">
        <div className="booking-subsection-heading">
          <div>
            <h3>{t("اختيار المركز", "Select Center")}</h3>
          </div>
          <MapPin size={20} aria-hidden="true" />
        </div>
        {form.city ? (
          <div className="booking-center-grid" role="list" aria-describedby={fieldDescribedBy("center")}>
            {filteredCenters.map((center) => (
              <button
                type="button"
                className={`booking-center-card ${form.centerId === center.id ? "is-selected" : ""}`}
                key={center.id}
                onClick={() => setField("centerId", center.id)}
                aria-pressed={form.centerId === center.id}
                role="listitem"
              >
                <span className="booking-center-marker" aria-hidden="true">
                  <MapPin size={18} />
                </span>
                <span className="booking-center-copy">
                  <strong>{localize(center.name)}</strong>
                </span>
                <span className="booking-choice-check" aria-hidden="true">
                  <Check size={13} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="booking-empty-choice">
            <MapPin size={20} aria-hidden="true" />
            <span>{t("اختر المدينة لعرض المراكز", "Select a city to view centers")}</span>
          </div>
        )}
        {renderError("center")}
      </div>

      <div className="booking-date-time-grid">
        <div className="booking-field">
          <label htmlFor="booking-date">
            {t("التاريخ", "Date")} <span className="booking-required">*</span>
          </label>
          <div className="booking-input-wrap">
            <CalendarDays size={18} aria-hidden="true" />
            <input
              id="booking-date"
              type="date"
              min={todayKey}
              value={form.date}
              onChange={(event) => setField("date", event.target.value)}
              aria-invalid={Boolean(errorFor("date"))}
              aria-describedby={fieldDescribedBy("date")}
            />
          </div>
          <p className="booking-field-hint">
            {form.date ? formatBookingDate(form.date, language) : t("اختر تاريخًا قادمًا", "Choose an upcoming date")}
          </p>
          {renderError("date")}
        </div>

        <div className="booking-field">
          <div className="booking-time-label-row">
            <label id="booking-time-label">
              {t("الوقت", "Time")} <span className="booking-required">*</span>
            </label>
          </div>
          <div className="booking-time-grid" role="group" aria-labelledby="booking-time-label">
            {timeOptions.map((time) => (
              <button
                className={`booking-time-chip ${form.time === time.value ? "is-selected" : ""}`}
                type="button"
                key={time.value}
                onClick={() => setField("time", time.value)}
                aria-pressed={form.time === time.value}
              >
                <Clock3 size={16} aria-hidden="true" />
                {localize(time.label)}
              </button>
            ))}
          </div>
          {renderError("time")}
        </div>
      </div>

    </section>
  );

  const feeLabel =
    form.vehicleClass === "cars" || form.vehicleClass === "motorcycles"
      ? t("172.5 ريال", "172.5 Riyal")
      : form.vehicleClass === "trucks"
        ? t("632.5 ريال", "632.5 Riyal")
        : form.vehicleClass === "buses"
          ? t("غير محددة", "Not specified")
          : "—";

  const renderReviewValue = (value: string | undefined) => value || t("لم يتم الاختيار", "Not selected");

  const renderStepThree = () => (
    <section className="booking-card" aria-labelledby="booking-step-three-title">
      <div id="booking-step-three-title">
        {renderStepHeading("03", t("مراجعة الطلب", "Review Request"), "")}
      </div>

      <div className="booking-review-layout">
        <div className="booking-review-panel">
          <div className="booking-review-group">
            <div className="booking-review-group-heading">
              <div>
                <span className="booking-review-kicker">{t("المعلومات العامة", "General Information")}</span>
                <h3>{renderReviewValue(selectedVehicle ? localize(selectedVehicle.label) : undefined)}</h3>
              </div>
              <button type="button" className="booking-edit-button" onClick={() => updateStep(1)}>
                {t("تعديل", "Edit")}
              </button>
            </div>
            <dl className="booking-review-list">
              <div>
                <dt>{t("نوع الخدمة", "Service Type")}</dt>
                <dd>{renderReviewValue(selectedService ? localize(selectedService.label) : undefined)}</dd>
              </div>
              <div>
                <dt>{t("الاسم", "Name")}</dt>
                <dd>{renderReviewValue(form.name)}</dd>
              </div>
              <div>
                <dt>{t("رقم الجوال", "Mobile Number")}</dt>
                <dd>{renderReviewValue(form.phone)}</dd>
              </div>
              <div>
                <dt>{t("رقم الحادث/التقرير", "Accident/Report Number")}</dt>
                <dd>{renderReviewValue(form.reportNumber)}</dd>
              </div>
              {form.vehicleType && (
                <div>
                  <dt>{t("نوع المركبة", "Vehicle Type")}</dt>
                  <dd>{form.vehicleType}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="booking-review-group">
            <div className="booking-review-group-heading">
              <div>
                <span className="booking-review-kicker">{t("تفاصيل الموعد", "Appointment Details")}</span>
                <h3>{renderReviewValue(selectedCenter ? localize(selectedCenter.name) : undefined)}</h3>
              </div>
              <button type="button" className="booking-edit-button" onClick={() => updateStep(2)}>
                {t("تعديل", "Edit")}
              </button>
            </div>
            <dl className="booking-review-list">
              <div>
                <dt>{t("المدينة", "City")}</dt>
                <dd>{renderReviewValue(cities.find((city) => city.value === form.city)?.label ? localize(cities.find((city) => city.value === form.city)!.label) : undefined)}</dd>
              </div>
              <div>
                <dt>{t("التاريخ", "Date")}</dt>
                <dd>{form.date ? formatBookingDate(form.date, language) : t("لم يتم الاختيار", "Not selected")}</dd>
              </div>
              <div>
                <dt>{t("الوقت", "Time")}</dt>
                <dd>{renderReviewValue(selectedTime ? localize(selectedTime.label) : undefined)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <aside className="booking-fee-card" aria-label={t("معاينة الرسوم", "Fee preview")}>
          <div className="booking-fee-icon" aria-hidden="true">
            <ShieldCheck size={23} />
          </div>
          <span className="booking-fee-kicker">{t("معاينة الرسوم", "Fee preview")}</span>
          <strong>{feeLabel}</strong>
          <p>{t("رسوم استرشادية من المرجع — لا يُنفّذ أي دفع.", "Indicative reference fee — no payment is processed.")}</p>
          {form.vehicleClass === "buses" && <span className="booking-fee-contact">{t("يرجى التواصل لمعرفة الرسوم", "Please contact us for the fee")}</span>}
        </aside>
      </div>

    </section>
  );

  return (
    <main className="booking-page" dir={dir}>
      <div className="booking-container">
        <nav className="booking-breadcrumbs" aria-label={t("مسار الصفحة", "Breadcrumb")}>
          <a href={href("/")}>{t("الرئيسية", "Home")}</a>
          <ChevronLeft size={15} aria-hidden="true" />
          <span aria-current="page">{t("حجز موعد جديد", "Book a New Appointment")}</span>
        </nav>

        <header className="booking-page-header">
          <div>
            <h1>{t("حجز موعد جديد", "Book a New Appointment")}</h1>
            <p>{t("أكمل الخطوات التالية لمراجعة تفاصيل الموعد", "Complete the following steps to review your appointment details")}</p>
          </div>
        </header>

        <ol className="booking-stepper" aria-label={t("مراحل حجز الموعد", "Appointment booking steps")}>
          {[
            { number: 1, label: t("المعلومات العامة", "General Information") },
            { number: 2, label: t("حجز الموعد", "Book Appointment") },
            { number: 3, label: t("مراجعة الطلب", "Review Request") },
          ].map((item, index) => (
            <li aria-current={step === item.number ? "step" : undefined} className={`booking-step ${step === item.number ? "is-active" : ""} ${step > item.number ? "is-complete" : ""}`} key={item.number}>
              <div className="booking-step-marker" aria-hidden="true">
                {step > item.number ? <Check size={16} /> : item.number}
              </div>
              <div className="booking-step-copy">
                <span>{t("الخطوة", "Step")} {item.number}</span>
                <strong>{item.label}</strong>
              </div>
              {index < 2 && <span className="booking-step-line" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <div className="booking-content">
          {step === 1 ? renderStepOne() : step === 2 ? renderStepTwo() : renderStepThree()}
        </div>

        <footer className="booking-actions">
          <button type="button" className="booking-button booking-button--secondary" onClick={handlePrevious} disabled={step === 1}>
            {isEnglish ? <ArrowLeft size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
            {t("السابق", "Previous")}
          </button>
          {step < 3 && (
            <button type="button" className="booking-button" onClick={handleNext}>
              {t("التالي", "Next")}
              {isEnglish ? <ArrowRight size={18} aria-hidden="true" /> : <ArrowLeft size={18} aria-hidden="true" />}
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}
