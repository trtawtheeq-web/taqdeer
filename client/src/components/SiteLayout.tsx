import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const original = (path: string) => `https://taqdeer.taqeem.gov.sa${path}`;
const image = (path: string, className = "") => <img className={`original-ui-icon ${className}`} src={original(path)} alt="" referrerPolicy="no-referrer" />;

export default function SiteLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t, href, dir, isEnglish, toggleLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const aboutGroup = {
    label: t("من نحن", "About Us"),
    items: [
      { label: t("حول تقدير", "About Taqdeer"), href: "/about" },
      { label: t("القواعد التنظيمية لتقييم أضرار المركبات", "Regulatory Rules for Vehicle Damage Assessment"), href: "/about#rules" },
      { label: t("معايير الممارسة المهنية لتقييم أضرار المركبات", "Standards of Professional Practice for Vehicle Damage Assessment"), href: "/about#rules" },
    ],
  };
  const servicesGroup = {
    label: t("الخدمات الالكترونية", "E-Services"),
    items: [
      { label: t("حجز موعد", "Book appointment"), href: "/booking-appointment" },
      { label: t("تعديل الموعد", "Modify appointment"), href: "/managebooking" },
    ],
  };
  const centersGroup = {
    label: t("مراكز التقدير", "Damage assessments Centers"),
    items: [
      { label: t("خدمات تقدير الأضرار غير المرورية لمكاتب التأجير", "Non-Traffic Damage Assessment Services for Rental Offices"), href: "/#centers" },
      { label: t("خدمات تقدير الأضرار", "Damage Assessment Services"), href: "/#centers" },
    ],
  };
  const supportGroup = {
    label: t("الدعم و المساعدة", "Help & Support"),
    items: [
      { label: t("الاستعلام عن تقرير الأضرار", "Inquiry about the Damage Report"), href: "/checkreportstatus" },
      { label: t("الاعتراضات", "Objections"), href: "/objections" },
      { label: t("استعلام عن اعتراض", "Inquiry about Objection"), href: "/objections" },
    ],
  };
  const navigation = isEnglish ? [aboutGroup, centersGroup, servicesGroup, supportGroup] : [aboutGroup, servicesGroup, centersGroup, supportGroup];
  const searchable = [
    { label: t("حجز موعد جديد", "Book a new appointment"), description: t("المعلومات العامة وحجز الموعد ومراجعة الطلب", "General information, appointment booking and request review"), href: "/booking-appointment" },
    { label: t("إدارة حجوزاتك", "Manage Your Bookings"), description: t("واجهة تعديل الموعد وإلغائه", "Appointment modification and cancellation preview"), href: "/managebooking" },
    { label: t("الاستعلام عن تقرير الأضرار", "Inquiry about the Damage Report"), description: t("واجهة الاستعلام عن حالة التقرير", "Report status inquiry preview"), href: "/checkreportstatus" },
    { label: t("الاعتراضات", "Objections"), description: t("واجهة تقديم اعتراض على تقرير التقدير", "Damage report objection preview"), href: "/objections" },
    { label: t("حول تقدير", "About Taqdeer"), description: t("تعرف على منظومة تقدير", "Learn about Taqdeer"), href: "/about" },
  ];
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  const results = searchable.filter(item => `${item.label} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const scrollToSection = (path: string) => {
    const section = path.split("#")[1];
    if (section) window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" }), 80);
    setMobileOpen(false);
    setOpenMenu(null);
  };

  return (
    <div className="site-layout" dir={dir}>
      <header className="site-header">
        <div className="site-container header-inner">
          <Link href={href("/")} className="brand" aria-label={t("تقدير — الرئيسية", "Taqdeer — Home")}>
            <img src={original("/media/ytmhwynh/logo.svg")} alt="TAQDEER" referrerPolicy="no-referrer" />
          </Link>
          <nav className="desktop-navigation" aria-label={t("التنقل الرئيسي", "Main navigation")}>
            {navigation.map((group, index) => <div
              className={`navigation-group ${openMenu === group.label ? "is-open" : ""}`}
              key={index}
              onMouseEnter={() => setOpenMenu(group.label)}
              onMouseLeave={() => setOpenMenu(null)}
              onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null); }}
              onKeyDown={event => { if (event.key === "Escape") setOpenMenu(null); }}
            >
              <button className="navigation-label" aria-haspopup="true" aria-controls={`nav-group-${index}`} aria-expanded={openMenu === group.label} onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}>
                {group.label}{image("/assets/icons/arrow-circle-down.svg", "original-dropdown-icon")}
              </button>
              <div className="navigation-dropdown" id={`nav-group-${index}`}>
                {group.items.map(item => <Link key={item.label} href={href(item.href)} onClick={() => scrollToSection(item.href)}>{item.label}<ArrowLeft size={14} /></Link>)}
              </div>
            </div>)}
          </nav>
          <div className="header-tools">
            <a className="phone-link" href="tel:920000460">{image("/assets/icons/call-calling.svg")}<span dir="ltr">920000460</span></a>
            <button className="language-link" onClick={toggleLanguage} title={t("Switch to English", "التبديل إلى العربية")}>{image("/assets/icons/global.svg")}<span>{isEnglish ? "العربية" : "EN"}</span></button>
            <button className="icon-button" aria-label={t("بحث", "Search")} onClick={() => setSearchOpen(true)}>{image("/assets/icons/search-normal.svg")}</button>
            <button className="icon-button" aria-label={theme === "light" ? t("تفعيل المظهر الداكن", "Enable dark mode") : t("تفعيل المظهر الفاتح", "Enable light mode")} onClick={toggleTheme}>
              {image(theme === "light" ? "/assets/icons/moon.svg" : "/assets/icons/sun-dark.svg")}
            </button>
            <button className="icon-button mobile-menu-toggle" aria-label={t("فتح القائمة", "Open menu")} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        {mobileOpen && <nav className="mobile-navigation" aria-label={t("قائمة الجوال", "Mobile navigation")}>
          {navigation.map(group => <div key={group.label}><h3>{group.label}</h3>{group.items.map(item => <Link key={item.label} href={href(item.href)} onClick={() => scrollToSection(item.href)}>{item.label}<ArrowLeft size={15} /></Link>)}</div>)}
        </nav>}
      </header>
      {children}
      <footer className="site-footer">
        <div className="site-container footer-main original-footer-main">
          <div className="footer-brand">
            <div className="original-footer-logos">
              <Link href={href("/")}><img src={original("/media/xy2dbina/taqdeer-logo.svg")} alt="TAQDEER" /></Link>
              <span />
              <img src={original("/media/ou4hn4zi/taqeem-1.svg")} alt="TAQEEM" />
            </div>
            <p>{t("تحت إشراف الهيئة السعودية للمقيّمين المعتمدين", "Under the supervision of the Saudi Authority for Accredited Valuers")}</p>
            <a className="original-social" href="https://x.com/taqdeer_sa" target="_blank" rel="noreferrer" aria-label={t("حساب تقدير الرسمي على إكس", "Official Taqdeer account on X")}>{image("/assets/icons/twitter.svg")}</a>
          </div>
          <div className="footer-links">
            <h3>{t("روابط ذات صلة", "Related Links")}</h3>
            <img className="original-related-underline" src={original("/assets/icons/Group%2028974496.svg")} alt="" />
            <a href="https://www.taqeem.gov.sa/" target="_blank" rel="noreferrer">{image("/assets/icons/arrow-circle-down-footer.svg")}{t("الهيئة السعودية للمقيّمين المعتمدين", "Saudi Authority for Accredited Valuers")}</a>
          </div>
        </div>
        <div className="site-container footer-bottom">
          <Link href={href("/privacy-policy")}>{t("سياسة الخصوصية", "Privacy Policy")}</Link>
          <span>{t("جميع الحقوق محفوظة © تقدير", "All rights reserved © Taqdeer")} {new Date().getFullYear()}</span>
          <Link href={href("/terms-of-use")}>{t("شروط الاستخدام", "Terms of Use")}</Link>
        </div>
      </footer>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="site-dialog" dir={dir}>
          <DialogTitle>{t("البحث", "Search")}</DialogTitle>
          <div className="search-input-wrap">{image("/assets/icons/search-normal.svg")}<input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={t("ابحث عن خدمة...", "Search for a service...")} aria-label={t("عبارة البحث", "Search query")} /></div>
          <div className="search-results">{results.length ? results.map(item => <Link href={href(item.href)} key={item.href} onClick={() => setSearchOpen(false)}><div><strong>{item.label}</strong><p>{item.description}</p></div><ArrowLeft size={19} /></Link>) : <p className="search-empty">{t("لا توجد نتائج مطابقة. جرّب كلمة أخرى.", "No matching results. Try another keyword.")}</p>}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
