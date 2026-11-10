(() => {
  "use strict";

  const SUMMARY_ID = "localPaymentSummary";
  const NOTE_ICON_PATH = "/assets/icons/note.svg";
  const CURRENCY_ICON_PATH = "/assets/icons/saudi-currency-small.svg";
  const APPOINTMENT_FIELDS = ["purpose", "vehicleType", "center", "city", "date", "time"];

  const copy = {
    ar: {
      title: "ملخص الدفع",
      appointmentTitle: "معلومات الموعد",
      feeTitle: "رسوم الخدمة",
      purpose: "الغرض من التقدير",
      vehicleType: "نوع المركبة",
      center: "المركز",
      city: "المدينة",
      date: "التاريخ",
      time: "الوقت",
      feeIncludingVat: "رسوم التقدير شاملة ضريبة القيمة المضافة",
      total: "الإجمالي",
      feeUnknown: "قيمة الخدمة غير محددة",
      valueUnknown: "غير محدد",
      noAppointment: "لا توجد بيانات موعد لعرضها",
      backToReview: "العودة إلى المراجعة",
      backToBooking: "العودة إلى الحجز",
      paymentDisabled: "الدفع غير مفعّل",
      noteAlt: "تفاصيل",
      currencyAlt: "ريال سعودي",
      currencyLabel: "ريال",
    },
    en: {
      title: "Payment summary",
      appointmentTitle: "Appointment details",
      feeTitle: "Service fee",
      purpose: "Assessment purpose",
      vehicleType: "Vehicle type",
      center: "Center",
      city: "City",
      date: "Date",
      time: "Time",
      feeIncludingVat: "Assessment fee including VAT",
      total: "Total amount",
      feeUnknown: "Service fee not specified",
      valueUnknown: "Not specified",
      noAppointment: "No appointment details to display",
      backToReview: "Back to review",
      backToBooking: "Back to booking",
      paymentDisabled: "Payment is not enabled",
      noteAlt: "Details",
      currencyAlt: "Saudi riyal",
      currencyLabel: "SAR",
    },
  };

  let section = null;
  let visibilitySnapshot = null;
  let openState = false;

  function languageIsArabic() {
    const language = document.getElementById("currentLanguage")?.value
      || document.documentElement.lang
      || "ar-SA";
    return /^ar(?:-|$)/i.test(language);
  }

  function strings() {
    return copy[languageIsArabic() ? "ar" : "en"];
  }

  function asText(value) {
    return value == null ? "" : String(value);
  }

  function hasValue(value) {
    if (typeof value === "number") return Number.isFinite(value);
    return value != null && asText(value).trim().length > 0;
  }

  function isSummaryObject(summary) {
    return summary !== null && typeof summary === "object" && !Array.isArray(summary);
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text != null) element.textContent = asText(text);
    return element;
  }

  function noteIcon(labels) {
    const icon = document.createElement("img");
    icon.className = "svg-white local-payment-summary__note-icon";
    icon.src = NOTE_ICON_PATH;
    icon.alt = labels.noteAlt;
    return icon;
  }

  function makeInfoItem(label, value, labels) {
    const column = createElement("div", "local-payment-summary__item-col");
    const item = createElement("div", "info-item local-payment-summary__item");
    const iconWrap = createElement("div", "info-icon local-payment-summary__info-icon");
    const content = createElement("div", "local-payment-summary__item-content");
    const labelElement = createElement("div", "info-label fs-16 fs-md-12 fw-regular text-primary local-payment-summary__item-label", label);
    const valueElement = createElement(
      "div",
      "info-text fs-16 fs-md-12 fw-regular text-light local-payment-summary__item-value",
      hasValue(value) ? value : labels.valueUnknown,
    );

    iconWrap.appendChild(noteIcon(labels));
    content.append(labelElement, valueElement);
    item.append(iconWrap, content);
    column.appendChild(item);
    return column;
  }

  function makeAppointmentCard(summary, labels) {
    const card = createElement("article", "gen-info-card local-payment-summary__card");
    const heading = createElement("h3", "fs-20 fs-md-16 mb-4 fw-bold local-payment-summary__card-title", labels.appointmentTitle);
    const fields = createElement("div", "local-payment-summary__fields");
    const values = [
      [labels.purpose, summary.purpose],
      [labels.vehicleType, summary.vehicleType],
      [labels.center, summary.center],
      [labels.city, summary.city],
      [labels.date, summary.date],
      [labels.time, summary.time],
    ];

    for (const [label, value] of values) fields.appendChild(makeInfoItem(label, value, labels));
    card.append(heading, fields);
    return card;
  }

  function makeCurrencyAmount(total, labels) {
    const amount = createElement("span", "local-payment-summary__currency-amount");
    const number = createElement("span", "local-payment-summary__amount-number", total.toFixed(2));
    const currency = createElement("span", "local-payment-summary__currency-label", labels.currencyLabel);
    const icon = document.createElement("img");

    icon.className = "ltr-img svg-white local-payment-summary__currency-icon";
    icon.src = CURRENCY_ICON_PATH;
    icon.alt = labels.currencyAlt;
    amount.append(number, icon, currency);
    return amount;
  }

  function makeFeeValue(total, labels) {
    if (!Number.isFinite(total)) {
      return createElement("span", "local-payment-summary__fee-unknown", labels.feeUnknown);
    }
    return makeCurrencyAmount(total, labels);
  }

  function makeFeeRow(label, total, labels, isTotal) {
    const row = createElement("div", `local-payment-summary__fee-row${isTotal ? " local-payment-summary__fee-row--total" : ""}`);
    const labelElement = createElement("span", "local-payment-summary__fee-label", label);
    const valueElement = createElement("span", "local-payment-summary__fee-value");
    valueElement.appendChild(makeFeeValue(total, labels));
    row.append(labelElement, valueElement);
    return row;
  }

  function makeFeeCard(total, labels) {
    const card = createElement("article", "gen-info-card local-payment-summary__card local-payment-summary__fee-card");
    const heading = createElement("h3", "fs-20 fs-md-16 mb-4 fw-bold local-payment-summary__card-title", labels.feeTitle);
    const rows = createElement("div", "local-payment-summary__fee-rows");
    rows.append(
      makeFeeRow(labels.feeIncludingVat, total, labels, false),
      makeFeeRow(labels.total, total, labels, true),
    );
    card.append(heading, rows);
    return card;
  }

  function makeBackButton(label) {
    const button = createElement("button", "btn btn-stroke-large fw-162 local-payment-summary__back-button", label);
    button.type = "button";
    button.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("taqdeer-payment-back"));
    });
    return button;
  }

  function makeDisabledPaymentButton(labels) {
    const button = createElement("button", "btn btn-primary-large btn-primary fw-162 local-payment-summary__disabled-button", labels.paymentDisabled);
    button.type = "button";
    button.disabled = true;
    return button;
  }

  function ensureSection(form) {
    if (!form?.parentNode) return null;

    if (!section) {
      section = createElement("section", "page-content local-payment-summary");
      section.id = SUMMARY_ID;
      section.hidden = true;
      section.setAttribute("aria-hidden", "true");
    }

    if (section.parentNode !== form.parentNode || form.nextSibling !== section) {
      form.parentNode.insertBefore(section, form.nextSibling);
    }
    return section;
  }

  function render(summary) {
    const labels = strings();
    const summaryObject = isSummaryObject(summary) ? summary : null;
    const hasAppointmentDetails = Boolean(
      summaryObject && APPOINTMENT_FIELDS.some(field => hasValue(summaryObject[field])),
    );
    const feeTotal = summaryObject && typeof summaryObject.feeTotal === "number" && Number.isFinite(summaryObject.feeTotal)
      ? summaryObject.feeTotal
      : null;
    const container = createElement("div", "container local-payment-summary__container");
    const heading = createElement("h2", "fs-28 fs-md-20 fw-bold mb-4 text-primary local-payment-summary__title", labels.title);
    const cards = createElement("div", "local-payment-summary__cards");

    heading.tabIndex = -1;
    heading.id = "localPaymentSummaryTitle";
    if (hasAppointmentDetails) {
      cards.appendChild(makeAppointmentCard(summaryObject, labels));
    } else {
      cards.appendChild(createElement("div", "gen-info-card local-payment-summary__empty", labels.noAppointment));
    }
    if (summaryObject) cards.appendChild(makeFeeCard(feeTotal, labels));

    const controls = createElement("div", "btn-grp local-payment-summary__controls");
    controls.append(makeBackButton(hasAppointmentDetails ? labels.backToReview : labels.backToBooking), makeDisabledPaymentButton(labels));
    container.append(heading, cards, controls);

    while (section.firstChild) section.removeChild(section.firstChild);
    section.appendChild(container);
    section.dir = languageIsArabic() ? "rtl" : "ltr";
    section.setAttribute("aria-labelledby", heading.id);
  }

  function focusHeading() {
    const heading = section?.querySelector(".local-payment-summary__title");
    if (!heading || typeof heading.focus !== "function") return;
    section.scrollIntoView({ block: "start" });
    try {
      heading.focus({ preventScroll: true });
    } catch (_error) {
      heading.focus();
    }
  }

  function open(summary) {
    const form = document.getElementById("wizardForm");
    const progressBar = document.getElementById("progress-bar");
    const mountedSection = ensureSection(form);
    if (!mountedSection) return;

    if (!visibilitySnapshot) {
      visibilitySnapshot = {
        form,
        progressBar,
        formDisplay: form.style.display,
        progressDisplay: progressBar ? progressBar.style.display : null,
      };
    }

    render(summary);
    form.style.display = "none";
    if (progressBar) progressBar.style.display = "none";
    mountedSection.hidden = false;
    mountedSection.setAttribute("aria-hidden", "false");
    openState = true;
    focusHeading();
  }

  function close() {
    if (section) {
      section.hidden = true;
      section.setAttribute("aria-hidden", "true");
    }

    if (visibilitySnapshot) {
      visibilitySnapshot.form.style.display = visibilitySnapshot.formDisplay;
      if (visibilitySnapshot.progressBar) {
        visibilitySnapshot.progressBar.style.display = visibilitySnapshot.progressDisplay;
      }
      visibilitySnapshot = null;
    }
    openState = false;
  }

  window.localPaymentSummary = { open, close, isOpen: () => openState };
})();
