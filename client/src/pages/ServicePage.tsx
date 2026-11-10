import { type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronLeft, ClipboardList, Search, CalendarDays, MessageSquare } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

type ServiceType = "manage" | "report" | "objection";
type LocalizedText = { ar: string; en: string };
type ServiceContent = { title: LocalizedText; subtitle: LocalizedText; icon: typeof CalendarDays; primary: LocalizedText; label: LocalizedText };

const serviceContent: Record<ServiceType, ServiceContent> = {
  manage: { title: { ar: "إدارة حجوزاتك", en: "Manage Your Bookings" }, subtitle: { ar: "قم بإدارة حجوزاتك من تعديل وإلغاء", en: "Manage your bookings, including modifications and cancellations" }, icon: CalendarDays, primary: { ar: "رقم الحجز", en: "Booking number" }, label: { ar: "استعلام عن الحجز", en: "Look up booking" } },
  report: { title: { ar: "الاستعلام عن تقرير الأضرار", en: "Check your report status" }, subtitle: { ar: "الرجاء تعبئة الحقول التالية للاستعلام عن حالة تقريرك", en: "Please fill in the following fields to check your damage assessment report status" }, icon: ClipboardList, primary: { ar: "رقم التقدير", en: "Assessment number" }, label: { ar: "استعلام", en: "Check status" } },
  objection: { title: { ar: "الاعتراضات", en: "Objections" }, subtitle: { ar: "الاعتراض على نتيجة تقرير تقدير أضرار المركبة", en: "Object to the result of a vehicle damage assessment report" }, icon: MessageSquare, primary: { ar: "رقم التقدير", en: "Assessment number" }, label: { ar: "متابعة", en: "Continue" } },
};

export function PageHeading({ title }: { title: string }) {
  const { t, href } = useLanguage();
  return <div className="page-heading"><div className="site-container"><div className="breadcrumb"><Link href={href("/")}>{t("الرئيسية", "Home")}</Link><ChevronLeft className="directional-arrow" size={15} /><span>{title}</span></div><h1>{title}</h1></div></div>;
}

export default function ServicePage({ type }: { type: ServiceType }) {
  const { t } = useLanguage();
  const content = serviceContent[type];
  const Icon = content.icon;
  const title = t(content.title.ar, content.title.en);
  const preventSubmit = (event: FormEvent) => event.preventDefault();

  return (
    <main>
      <PageHeading title={title} />
      <section className="site-container service-page-content">
        <div className="service-form-panel">
          <div className="service-form-icon"><Icon size={30} strokeWidth={1.5} /></div>
          <h2>{title}</h2>
          <p className="panel-intro">{t(content.subtitle.ar, content.subtitle.en)}</p>
          <form onSubmit={preventSubmit}>
            <label htmlFor="reference-number">{t(content.primary.ar, content.primary.en)}<span className="required-mark"> *</span></label>
            <input id="reference-number" required placeholder={t(`أدخل ${content.primary.ar}`, `Enter ${content.primary.en}`)} />
            <label htmlFor="mobile-number">{t("رقم الجوال", "Mobile number")}<span className="required-mark"> *</span></label>
            <input id="mobile-number" inputMode="tel" required pattern="05[0-9]{8}" maxLength={10} placeholder="05xxxxxxxx" dir="ltr" />
            <button className="primary-button service-submit" type="submit">
              <Search size={18} />
              {t(content.label.ar, content.label.en)}
              <ArrowLeft className="directional-arrow" size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export function InformationPage({ type }: { type: "about" | "privacy" | "terms" }) {
  const { t } = useLanguage();
  const title = type === "about" ? t("حول تقدير", "About Taqdeer") : type === "privacy" ? t("سياسة الخصوصية", "Privacy Policy") : t("شروط الاستخدام", "Terms of Use");
  const eyebrow = type === "about" ? t("من نحن", "About us") : t("معلومات المعاينة", "Preview information");
  const aboutBody = <>
    <p>{t("تقدير منظومة متكاملة لإدارة وتشغيل وتنظيم عمليات تقدير أضرار حوادث المركبات بشكل إلكتروني وبمهنية واحترافية عالية، وفق أفضل المعايير والمقاييس العالمية.", "Taqdeer is an integrated system for electronically managing, operating, and organizing vehicle accident damage assessment processes with high professionalism, according to the best global standards and benchmarks.")}</p>
    <p>{t("تجمع المنظومة خدمات حجز موعد التقدير وإدارة الحجوزات والاستعلام عن تقارير الأضرار.", "The system brings together appointment booking, booking management, and damage report inquiry services.")}</p>
  </>;
  const privacyBody = <>
    <p>{t("هذه نسخة تصميمية غير رسمية لعرض الصفحات والتنقل بينها فقط. لا تتصل بخدمات تقدير الحكومية ولا تُرسل حقول النماذج إلى أي خادم.", "This is an unofficial design preview for displaying pages and navigating between them. It does not connect to government Taqdeer services or send form fields to any server.")}</p>
    <p>{t("تظل بيانات النماذج في ذاكرة الصفحة أثناء المعاينة وتُحذف عند إعادة تحميلها. يرجى عدم إدخال بيانات شخصية حقيقية.", "Form data remains in the page memory during the preview and is deleted when the page is reloaded. Please do not enter real personal information.")}</p>
    <p>{t("يُحفظ اختيار المظهر الفاتح أو الداكن فقط في المتصفح. قد توفر منصة الاستضافة تحليلات زيارة أساسية منفصلة.", "Only the light or dark appearance preference is stored in the browser. The hosting platform may provide separate basic visit analytics.")}</p>
  </>;
  const termsBody = <>
    <p>{t("جميع الصفحات مخصصة لمعاينة التصميم فقط. لا تنشئ هذه النسخة موعدًا أو تقريرًا أو اعتراضًا حقيقيًا، ولا تنفذ عمليات دفع.", "All pages are for design preview only. This version does not create a real appointment, report, or objection, and it does not process payments.")}</p>
    <p>{t("المراكز والمواعيد الظاهرة في نموذج الحجز بيانات توضيحية، وليست دليلًا على توفر مواعيد في المراكز الفعلية.", "The centers and appointments shown in the booking form are illustrative data and are not evidence of availability at actual centers.")}</p>
    <p>{t("تعود الهوية والشعارات إلى أصحابها. للحصول على الخدمات الرسمية، يرجى زيارة موقع تقدير الرسمي.", "The identity and logos belong to their respective owners. For official services, please visit the official Taqdeer website.")}</p>
  </>;
  const body = type === "about" ? aboutBody : type === "privacy" ? privacyBody : termsBody;

  return <main><PageHeading title={title} /><section className="site-container information-page"><article className="information-panel"><span className="section-eyebrow">{eyebrow}</span><h2>{title}</h2>{body}</article></section></main>;
}
