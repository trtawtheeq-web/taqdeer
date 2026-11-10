(() => {
  "use strict";

  const LOOKUPS_SRC = document.currentScript?.getAttribute("data-booking-src")
    || "/original/booking-data.js?v=20261108-r3";
  const LOCAL_UTILS_SRC = "/vendor/intl-tel-input/build/js/utils.js?v=25.12.5";
  const state = {
    initialized: false,
    dataScript: null,
    lookupData: null,
    step: 1,
    selects: null,
    firstOptions: new Map(),
    labels: null,
    phone: null,
    plateCharacters: new Map(),
    calendarDay: null,
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function isBookingPage() {
    return Boolean(byId("wizardForm") && byId("centerTypeDropdown") && byId("regionDropdown"));
  }

  function languageIsArabic() {
    const language = byId("currentLanguage")?.value || document.documentElement.lang || "ar-SA";
    return /^ar(?:-|$)/i.test(language);
  }

  function readTextValue(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function readInlineBinding(name) {
    if (name === "chooseItem" && typeof chooseItem !== "undefined") return readTextValue(chooseItem);
    if (name === "noCityFound" && typeof noCityFound !== "undefined") return readTextValue(noCityFound);
    if (name === "noCentersFound" && typeof noCentersFound !== "undefined") return readTextValue(noCentersFound);
    if (name === "searchPlaceholder" && typeof searchPlaceholder !== "undefined") {
      return readTextValue(searchPlaceholder);
    }
    if (name === "confirmBookingButton" && typeof confirmBookingButton !== "undefined") {
      return readTextValue(confirmBookingButton);
    }
    if (name === "nextButton" && typeof nextButton !== "undefined") return readTextValue(nextButton);
    if (name === "_requiredMessage" && typeof _requiredMessage !== "undefined") {
      return readTextValue(_requiredMessage);
    }
    if (name === "invalidPhoneMessage" && typeof invalidPhoneMessage !== "undefined") {
      return readTextValue(invalidPhoneMessage);
    }
    if (name === "requiredMessage" && typeof requiredMessage !== "undefined") {
      return readTextValue(requiredMessage);
    }
    if (name === "validFieldMessage" && typeof validFieldMessage !== "undefined") {
      return readTextValue(validFieldMessage);
    }
    if (name === "noSlotSelected" && typeof noSlotSelected !== "undefined") {
      return readTextValue(noSlotSelected);
    }
    return "";
  }

  function readLocalizedValue(name) {
    const inlineValue = readInlineBinding(name);
    if (inlineValue) return inlineValue;
    const globalValue = readTextValue(window[name]);
    if (globalValue) return globalValue;

    const selector = [
      `#${name}`,
      `[name="${name}"]`,
      `[data-source-label="${name}"]`,
      `[data-label="${name}"]`,
    ].join(",");
    const element = document.querySelector(selector);
    if (!element) return "";

    return (
      readTextValue(element.value) ||
      readTextValue(element.getAttribute("data-value")) ||
      readTextValue(element.textContent)
    );
  }

  function firstOptionLabel(select) {
    return readTextValue(state.firstOptions.get(select)?.textContent) || "";
  }

  function makeLabels() {
    const { city, center, type, region } = state.selects;
    const chooseItem =
      readLocalizedValue("chooseItem") || firstOptionLabel(type) || firstOptionLabel(region);
    return {
      chooseItem,
      noCityFound: readLocalizedValue("noCityFound") || firstOptionLabel(city) || chooseItem,
      noCentersFound: readLocalizedValue("noCentersFound") || firstOptionLabel(center) || chooseItem,
      searchPlaceholder: readLocalizedValue("searchPlaceholder"),
    };
  }

  function preserveInitialOptions() {
    for (const select of Object.values(state.selects)) {
      if (select && !state.firstOptions.has(select)) {
        state.firstOptions.set(select, select.options[0]?.cloneNode(true) || null);
      }
    }
  }

  function resetSelect(select, label) {
    if (!select) return;
    const first = state.firstOptions.get(select)?.cloneNode(true) || document.createElement("option");
    if (!first.textContent.trim() && label) first.textContent = label;
    if (!first.value) first.value = "";
    select.replaceChildren(first);
    select.selectedIndex = 0;
    select.classList.remove("has-value");
  }

  function option(value, text) {
    const item = document.createElement("option");
    item.value = value == null ? "" : String(value);
    item.textContent = text == null ? "" : String(text);
    return item;
  }

  function rowText(row, arabicKey, englishKey) {
    if (!row || typeof row !== "object") return "";
    return languageIsArabic() ? row[arabicKey] : row[englishKey];
  }

  function rows(entry) {
    return entry && Array.isArray(entry.data) ? entry.data : null;
  }

  function keyedRows(collection, key) {
    if (!collection || typeof collection !== "object") return null;
    const entry = collection[String(key)];
    return rows(entry);
  }

  function lookupReady(data) {
    return Boolean(
      data &&
        rows(data.types) &&
        rows(data.regions) &&
        data.citiesByRegion &&
        typeof data.citiesByRegion === "object" &&
        data.centersByCityAndType &&
        typeof data.centersByCityAndType === "object",
    );
  }

  function populateTypes(data) {
    const { type } = state.selects;
    resetSelect(type, state.labels.chooseItem);
    for (const [index, row] of (rows(data.types) || []).entries()) {
      if (!row || row.daCenterTypeID == null) continue;
      const item = option(
        row.daCenterTypeID,
        rowText(row, "daCenterTypeArabicName", "daCenterTypeEnglishName"),
      );
      item.setAttribute("data-index", String(index + 1));
      type.appendChild(item);
    }
  }

  function populateRegions(data) {
    const { region } = state.selects;
    resetSelect(region, state.labels.chooseItem);
    for (const row of rows(data.regions) || []) {
      if (!row || row.regionID == null) continue;
      region.appendChild(option(row.regionID, rowText(row, "regionArabicName", "regionEnglishName")));
    }
  }

  function populateCities(data, regionId) {
    const { city } = state.selects;
    resetSelect(city, state.labels.chooseItem);
    const cityRows = keyedRows(data.citiesByRegion, regionId);
    if (!cityRows || cityRows.length === 0) {
      resetSelect(city, state.labels.noCityFound);
      return;
    }
    for (const row of cityRows) {
      if (!row || row.cityID == null) continue;
      city.appendChild(option(row.cityID, rowText(row, "cityArabicName", "cityEnglishName")));
    }
  }

  function dayIdsValue(value) {
    if (Array.isArray(value)) return value.join(",");
    if (value == null) return "";
    return String(value);
  }

  function populateCenters(data, cityId, typeId) {
    const { center } = state.selects;
    resetSelect(center, state.labels.chooseItem);
    const centerRows = keyedRows(data.centersByCityAndType, `${cityId}:${typeId}`);
    if (!centerRows || centerRows.length === 0) {
      resetSelect(center, state.labels.noCentersFound);
      return;
    }
    for (const row of centerRows) {
      if (!row || row.areaID == null) continue;
      const item = option(row.areaID, rowText(row, "areaArabicName", "areaEnglishName"));
      const dayIds = dayIdsValue(row.dayIDs);
      if (dayIds) item.setAttribute("data-dayids", dayIds);
      center.appendChild(item);
    }
  }

  function clearCalendar() {
    const dateList = byId("date-list");
    if (dateList) dateList.replaceChildren();
    const slotSelector = byId("slot-selector");
    if (slotSelector) slotSelector.replaceChildren();
    byId("showAvailableSlots")?.classList.remove("d-none");
    byId("noSlotsMessage")?.classList.add("d-none");
    clearAppointmentSelection();
  }

  function clearAppointmentSelection() {
    for (const id of ["selectedDate", "selectedTime", "selectedEndTime", "selectedSlotId"]) {
      const input = byId(id);
      if (input) input.value = "";
    }
  }

  function parseDayIds(dayIdsCsv) {
    return String(dayIdsCsv || "")
      .split(",")
      .map(value => Number.parseInt(value.trim(), 10))
      .filter(value => Number.isInteger(value) && value >= 0 && value <= 6);
  }

  function saudiClock() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    const year = Number(parts.year);
    const month = Number(parts.month);
    const day = Number(parts.day);
    return {
      year, month, day,
      key: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
      order: year * 10000 + month * 100 + day,
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
    };
  }

  function isPastSlot(dateValue, startTime, clock = saudiClock()) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateValue);
    if (!match) return true;
    const order = Number(match[3]) * 10000 + Number(match[2]) * 100 + Number(match[1]);
    if (order !== clock.order) return order < clock.order;
    const [hour, minute] = startTime.split(":").map(Number);
    return !Number.isFinite(hour + minute) || hour * 60 + minute <= clock.minutes;
  }

  function formatSourceTime(time) {
    const value = readTextValue(time);
    if (!value) return "";
    const [hours, minutes] = value.split(":");
    if (hours == null || minutes == null) return value;
    return `${String(Number.parseInt(hours, 10))}:${minutes}`;
  }

  function convertToAmPm(time) {
    const value = readTextValue(time);
    const [hours, minutes] = value.split(":");
    const numericHours = Number.parseInt(hours, 10);
    if (!Number.isInteger(numericHours) || minutes == null) return "";
    const isPm = numericHours >= 12;
    const suffix = languageIsArabic() ? (isPm ? "م" : "ص") : isPm ? "PM" : "AM";
    return suffix;
  }

  function renderAvailableDates(dayIdsCsv, preserveSelection = false) {
    const dateList = byId("date-list");
    if (!dateList) return;
    const saved = preserveSelection ? Object.fromEntries(
      ["selectedDate", "selectedTime", "selectedEndTime", "selectedSlotId"]
        .map(id => [id, byId(id)?.value || ""]),
    ) : null;
    dateList.replaceChildren();
    clearAppointmentSelection();
    const allowedDays = parseDayIds(dayIdsCsv);
    if (!allowedDays.length) return;

    const dates = [];
    const clock = saudiClock();
    state.calendarDay = clock.key;
    const date = new Date(clock.year, clock.month - 1, clock.day);
    let guard = 0;
    while (dates.length < 14 && guard < 370) {
      if (allowedDays.includes(date.getDay())) dates.push(new Date(date));
      date.setDate(date.getDate() + 1);
      guard += 1;
    }

    for (const item of dates) {
      const dayName = item.toLocaleDateString(languageIsArabic() ? "ar-SA" : "en-US", {
        weekday: "short",
      });
      const day = item.getDate();
      const formattedDate = item.toLocaleDateString("en-GB");
      const card = document.createElement("div");
      card.className = "date-time-card day";
      card.setAttribute("data-date", formattedDate);
      card.setAttribute("data-dayid", String(item.getDay()));
      card.innerHTML = `
        <p class="month-name mb-0 fs-md-12 fw-md-regular">${dayName}</p>
        <p class="mb-0 date fs-36 fw-bold fs-md-20">${day}</p>
      `;
      dateList.appendChild(card);
    }

    dateList.querySelectorAll(".date-time-card.day").forEach(card => {
      card.addEventListener("click", () => {
        dateList.querySelectorAll(".date-time-card.day").forEach(item => item.classList.remove("today"));
        card.classList.add("today");
        const selectedDate = byId("selectedDate");
        const nextDate = card.getAttribute("data-date") || "";
        if (selectedDate?.value !== nextDate) clearSelectedSlotOnly();
        if (selectedDate) selectedDate.value = nextDate;
        hideApiError();
        renderLocalSlots(
          state.lookupData,
          state.selects.center.value,
          selectedDate?.value || "",
          card.getAttribute("data-dayid") || "",
        );
      });
    });
    if (saved?.selectedDate && [...dateList.children].some(card => card.getAttribute("data-date") === saved.selectedDate)) {
      for (const [id, value] of Object.entries(saved)) {
        const input = byId(id);
        if (input) input.value = value;
      }
    }
  }

  function clearSelectedSlotOnly() {
    for (const id of ["selectedTime", "selectedEndTime", "selectedSlotId"]) {
      const input = byId(id);
      if (input) input.value = "";
    }
    byId("slot-selector")?.replaceChildren();
    byId("showAvailableSlots")?.classList.remove("d-none");
    byId("noSlotsMessage")?.classList.add("d-none");
  }

  function updateCalendarFromCenter() {
    const center = state.selects.center;
    const selectedOption = center?.options[center.selectedIndex];
    const dayIds = selectedOption?.getAttribute("data-dayids") || "";
    const workingDays = byId("branchWorkingDays");
    if (workingDays) workingDays.value = dayIds;
    if (dayIds) renderAvailableDates(dayIds);
    else clearCalendar();
  }

  function isSlotCollection(value) {
    return Array.isArray(value) || Boolean(value && typeof value === "object" && Array.isArray(value.data));
  }

  function collectionRows(value) {
    if (Array.isArray(value)) return value;
    return value && Array.isArray(value.data) ? value.data : null;
  }

  function dateKeys(dateValue) {
    const value = readTextValue(dateValue);
    if (!value) return [];
    return [value, value.replaceAll("/", "-"), value.replaceAll("-", "/")];
  }

  function readLocalSlotRows(data, centerId, dateValue) {
    if (!data || typeof data !== "object") return null;
    const collections = [data.slotsByCenterAndDate, data.appointmentsByCenterAndDate, data.appointments];
    const centerKeys = [String(centerId), `${centerId}`];
    const keys = dateKeys(dateValue);

    for (const collection of collections) {
      if (!collection || typeof collection !== "object") continue;
      for (const centerKey of centerKeys) {
        const byCenter = collection[centerKey];
        if (byCenter && typeof byCenter === "object") {
          for (const dateKey of keys) {
            if (isSlotCollection(byCenter[dateKey])) return collectionRows(byCenter[dateKey]);
          }
        }
      }
      for (const dateKey of keys) {
        const direct = collection[`${centerId}:${dateKey}`] || collection[`${centerId}|${dateKey}`];
        if (isSlotCollection(direct)) return collectionRows(direct);
      }
    }

    const arrayCollections = [data.slots, data.appointmentSlots, data.availableSlots];
    for (const collection of arrayCollections) {
      if (!Array.isArray(collection)) continue;
      const filtered = collection.filter(item => {
        if (!item || typeof item !== "object") return false;
        const itemCenter = item.branchId ?? item.centerId ?? item.areaID;
        const itemDate = item.date ?? item.slotDate ?? item.appointmentDate;
        const centerMatches = itemCenter != null && String(itemCenter) === String(centerId);
        const dateMatches = itemDate != null && keys.includes(String(itemDate));
        return centerMatches && dateMatches;
      });
      if (filtered.length) return filtered;
    }

    return null;
  }

  function sourceDateWeekday(value) {
    const match = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(value);
    if (!match) return null;
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])).getDay();
  }

  function localScheduleRows(data, centerId, dateValue) {
    const exactRows = readLocalSlotRows(data, centerId, dateValue);
    if (exactRows?.length) return exactRows;

    const sourceDays = data?.slotsByCenterAndDate?.[String(centerId)];
    if (!sourceDays) return exactRows;
    const templates = Object.entries(sourceDays)
      .map(([date, collection]) => ({ date, rows: collectionRows(collection) }))
      .filter(entry => entry.rows?.some(slot => {
        const times = slotTimes(slot);
        return slot?.slotRequestId != null && times.start && times.end;
      }));
    const weekday = sourceDateWeekday(dateValue);
    const template = templates.find(entry => sourceDateWeekday(entry.date) === weekday) || templates[0];
    if (!template) return exactRows;

    // Local display schedule, not official availability for a new date.
    return template.rows.map((slot, index) => ({
      ...slot,
      slotRequestId: `local-${centerId}-${dateValue.replaceAll("/", "-")}-${index}`,
    }));
  }

  function slotTimes(slot) {
    const source = readTextValue(slot?.slotTime || slot?.time || slot?.startTime);
    if (source.includes(" - ")) {
      const [start, end] = source.split(" - ");
      return { start: formatSourceTime(start.split(".")[0]), end: formatSourceTime(end.split(".")[0]) };
    }
    return {
      start: formatSourceTime(source.split(".")[0]),
      end: formatSourceTime(slot?.endTime || slot?.slotEndTime || ""),
    };
  }

  function renderLocalSlots(data, centerId, dateValue) {
    const rowsForDate = localScheduleRows(data, centerId, dateValue);
    const selector = byId("slot-selector");
    if (!selector) return;
    const previousSlotId = readTextValue(byId("selectedSlotId")?.value);
    for (const id of ["selectedTime", "selectedEndTime", "selectedSlotId"]) {
      const input = byId(id);
      if (input) input.value = "";
    }
    selector.replaceChildren();
    const nextButton = byId("btnNext");
    if (nextButton && state.step === 2) nextButton.disabled = true;

    const showSlots = byId("showAvailableSlots");
    const noSlots = byId("noSlotsMessage");
    if (!rowsForDate) {
      showSlots?.classList.add("d-none");
      noSlots?.classList.add("d-none");
      return;
    }
    if (!rowsForDate.length) {
      showSlots?.classList.add("d-none");
      noSlots?.classList.remove("d-none");
      return;
    }

    showSlots?.classList.remove("d-none");
    noSlots?.classList.add("d-none");
    const clock = saudiClock();
    for (const slot of rowsForDate) {
      if (!slot || slot.slotRequestId == null) continue;
      const times = slotTimes(slot);
      if (!times.start || !times.end || isPastSlot(dateValue, times.start, clock)) continue;
      // User-requested UI override: every displayed future time can be selected.
      // Official availability remains unchanged in the copied source data.
      const [hours, minutes] = times.start.split(":");
      const sourceTime = `${Number.parseInt(hours, 10) % 12 || 12}:${minutes}`;
      const box = document.createElement("div");
      box.className = "slot-box date-time-card unblock";
      box.setAttribute("data-slotid", String(slot.slotRequestId));
      box.setAttribute("data-reserved", "false");
      box.innerHTML = `
        <p class="month-name text-light mb-0 fs-20 fs-md-16 fw-bold text-center">${sourceTime}</p>
        <p class="mb-0 date fs-16 fw-regular text-light fs-md-13 lh-12">${convertToAmPm(times.start)}</p>
      `;
      box.addEventListener("click", () => selectSlot(box, slot, times));
      selector.appendChild(box);
      if (String(slot.slotRequestId) === previousSlotId) selectSlot(box, slot, times);
    }
  }

  function selectSlot(box, slot, times) {
    document.querySelectorAll("#slot-selector .slot-box[data-reserved=\"false\"]").forEach(item => {
      if (item !== box) {
        item.classList.remove("block");
        item.classList.add("unblock");
      }
    });
    box.classList.remove("unblock");
    box.classList.add("block");
    const slotId = byId("selectedSlotId");
    const selectedTime = byId("selectedTime");
    const selectedEndTime = byId("selectedEndTime");
    if (slotId) slotId.value = String(slot.slotRequestId);
    if (selectedTime) selectedTime.value = times.start;
    if (selectedEndTime) selectedEndTime.value = times.end;
    const nextButton = byId("btnNext");
    if (nextButton && state.step === 2) nextButton.disabled = false;
    hideApiError();
  }

  function bindLookups(data) {
    if (!lookupReady(data) || state.lookupData === data) {
      if (data && state.lookupData !== data) applyPlateCharacters(data);
      return;
    }
    state.lookupData = data;
    state.labels = makeLabels();
    populateTypes(data);
    populateRegions(data);
    applyPlateCharacters(data);

    state.selects.type.addEventListener("change", () => {
      resetSelect(state.selects.center, state.labels.chooseItem);
      clearCalendar();
      const cityId = state.selects.city.value;
      const typeId = state.selects.type.value;
      if (cityId && typeId) populateCenters(data, cityId, typeId);
    });

    state.selects.region.addEventListener("change", () => {
      resetSelect(state.selects.city, state.labels.chooseItem);
      resetSelect(state.selects.center, state.labels.chooseItem);
      clearCalendar();
      const regionId = state.selects.region.value;
      if (regionId) populateCities(data, regionId);
    });

    state.selects.city.addEventListener("change", () => {
      resetSelect(state.selects.center, state.labels.chooseItem);
      clearCalendar();
      const cityId = state.selects.city.value;
      const typeId = state.selects.type.value;
      if (cityId && typeId) populateCenters(data, cityId, typeId);
    });

    state.selects.center.addEventListener("change", updateCalendarFromCenter);
  }

  function loadLookups() {
    if (lookupReady(window.originalBookingLookups)) {
      bindLookups(window.originalBookingLookups);
      return;
    }

    const existing = document.querySelector(`script[src="${LOOKUPS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => bindLookups(window.originalBookingLookups), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LOOKUPS_SRC;
    script.defer = true;
    script.addEventListener("load", () => bindLookups(window.originalBookingLookups), { once: true });
    state.dataScript = script;
    document.head.appendChild(script);
  }

  function sourceMessage(names) {
    for (const name of names) {
      const inlineMessage = readInlineBinding(name);
      if (inlineMessage) return inlineMessage;
      const message = readTextValue(window[name]);
      if (message) return message;
    }
    return "";
  }

  function validationMessage(input, required) {
    if (required) {
      return input.getAttribute("data-required-message") || sourceMessage(["requiredMessage", "_requiredMessage"]);
    }
    return input.getAttribute("data-error-message") || sourceMessage(["validFieldMessage", "invalidPhoneMessage"]);
  }

  function isDisplayed(element) {
    let current = element;
    while (current && current !== document.documentElement) {
      if (current.hidden || current.style?.display === "none") return false;
      current = current.parentElement;
    }
    return true;
  }

  function errorElement(input) {
    const container = input.closest(".mb-4") || input.parentElement;
    return container?.querySelector(".formErrorMessage") || null;
  }

  function clearInputValidation(input) {
    input.classList.remove("is-invalid");
    const error = errorElement(input);
    if (error) error.textContent = "";
  }

  function validateCustomInput(input) {
    if (!input || !isDisplayed(input)) {
      if (input) clearInputValidation(input);
      return true;
    }
    const value = readTextValue(input.value);
    const isRequired = input.dataset.required === "true";
    let pattern = null;
    if (input.dataset.pattern) {
      try {
        pattern = new RegExp(input.dataset.pattern);
      } catch {
        pattern = null;
      }
    }

    let valid = true;
    let message = "";
    if (isRequired && !value) {
      valid = false;
      message = validationMessage(input, true);
    } else if (value && pattern && !pattern.test(value)) {
      valid = false;
      message = validationMessage(input, false);
    }

    input.classList.toggle("is-invalid", !valid);
    const error = errorElement(input);
    if (error) error.textContent = message;
    return valid;
  }

  function attachValidation(input) {
    if (!input || input.dataset.validationBound === "true") return;
    input.dataset.validationBound = "true";
    input.addEventListener("blur", () => validateCustomInput(input));
    input.addEventListener("input", () => validateCustomInput(input));
    input.addEventListener("change", () => validateCustomInput(input));
  }

  function setupStep1Validation() {
    const step = byId("step1");
    if (!step) return;
    step.querySelectorAll(".custom-validate").forEach(attachValidation);
    window.validateStep1 = () => {
      let valid = true;
      step.querySelectorAll(".custom-validate").forEach(input => {
        if (!validateCustomInput(input)) valid = false;
      });
      if (!validatePhone(false)) valid = false;
      return valid;
    };
  }

  function focusFirstInvalid() {
    const invalid = byId("step1")?.querySelector(".is-invalid");
    invalid?.focus();
  }

  function togglePurposeRequired() {
    const serviceDisclaimer = byId("disclaimerForService");
    const accidentInput = byId("accidentNumberInput");
    const asterisk = byId("accidentAsterisk");
    const container = byId("hideAccidentBlock");
    const selected = document.querySelector('input[name="appointmentPurpose"]:checked');
    const isAccident = selected?.value === "1";

    document.querySelectorAll('.purpose-accessment input[name="appointmentPurpose"]').forEach(input => {
      input.closest(".nav-link")?.classList.toggle("active", input === selected);
    });

    if (!serviceDisclaimer || !accidentInput || !container) return;
    if (isAccident) {
      serviceDisclaimer.style.display = "none";
      container.style.display = "block";
      accidentInput.setAttribute("data-required", "true");
      accidentInput.classList.add("custom-validate");
      if (asterisk) asterisk.style.display = "inline";
      attachValidation(accidentInput);
    } else {
      serviceDisclaimer.style.display = "block";
      container.style.display = "none";
      accidentInput.removeAttribute("data-required");
      accidentInput.removeAttribute("data-custom-validate");
      accidentInput.value = "";
      accidentInput.classList.remove("custom-validate");
      clearInputValidation(accidentInput);
      if (asterisk) asterisk.style.display = "none";
    }
  }

  function applyPlateCharacters(data) {
    const payloads = [
      data?.plateCharacters,
      data?.plateCharacter,
      window.plateCharacters,
      window.originalBookingPlateCharacters,
    ];
    const payload = payloads.find(item => item && item.isSuccess && Array.isArray(item.data));
    if (!payload) return;

    const map = new Map();
    for (const item of payload.data) {
      if (!item || item.plateCharacterID == null) continue;
      const id = String(item.plateCharacterID);
      const english = readTextValue(item.plateCharacterEnglishName);
      const arabic = readTextValue(item.plateCharacterArabicName);
      if (english) map.set(english.toUpperCase(), id);
      if (arabic) map.set(arabic, id);
    }
    if (!map.size) return;
    state.plateCharacters = map;
    updatePlateCharacterIds();
  }

  function plateCharacterId(input) {
    if (!input || !state.plateCharacters.size) return null;
    const raw = readTextValue(input.value);
    if (!raw) return null;
    return state.plateCharacters.get(raw.toUpperCase()) || state.plateCharacters.get(raw) || null;
  }

  function normalizePlateInput(inputId) {
    const input = byId(inputId);
    if (!input || !state.plateCharacters.size || !readTextValue(input.value)) return null;
    const id = plateCharacterId(input);
    if (!id) {
      input.value = "";
      clearInputValidation(input);
      return null;
    }
    return id;
  }

  function updatePlateCharacterIds() {
    const hidden = byId("plateCharacterIdInput");
    if (!hidden) return;
    if (!state.plateCharacters.size) {
      hidden.value = "";
      return;
    }
    const digits = readTextValue(byId("plateNumberDigits")?.value);
    const c1 = normalizePlateInput("plateChar1");
    const c2 = normalizePlateInput("plateChar2");
    const c3 = normalizePlateInput("plateChar3");
    hidden.value = digits && c1 ? [digits, c1, c2, c3].filter(Boolean).join("-") : "";
  }

  function addInputFilter(input, expression) {
    if (!input || input.dataset.inputFilterBound === "true") return;
    input.dataset.inputFilterBound = "true";
    const invalidInput = new RegExp(expression.source, expression.flags.replace("g", ""));
    input.addEventListener("input", () => {
      input.value = input.value.replace(expression, "");
      if (input.classList.contains("saudi-input")) {
        if (state.plateCharacters.size && !input.classList.contains("digitonly")) {
          normalizePlateInput(input.id);
        }
        updatePlateCharacterIds();
        const all = Array.from(document.querySelectorAll(".saudi-input"));
        const index = all.indexOf(input);
        if (input.value && input.value.length >= (input.maxLength || 1) && all[index + 1]) {
          all[index + 1].focus();
        }
      }
      validateCustomInput(input);
    });
    input.addEventListener("beforeinput", event => {
      if (event.data && invalidInput.test(event.data)) event.preventDefault();
    });
    input.addEventListener("keydown", event => {
      if (event.key !== "Backspace") return;
      const all = Array.from(document.querySelectorAll(".saudi-input"));
      const index = all.indexOf(input);
      if (index <= 0) return;
      if (input.value === "" || (input.value.length === 1 && input.selectionStart === 1)) {
        requestAnimationFrame(() => {
          if (input.value === "") {
            const previous = all[index - 1];
            previous.focus();
            const end = previous.value.length;
            previous.setSelectionRange(end, end);
          }
        });
      }
    });
  }

  function bindPlateAndInputFilters() {
    document.querySelectorAll("input.digitonly").forEach(input => addInputFilter(input, /[^0-9]/g));
    document.querySelectorAll(".saudi-input:not(.digitonly)").forEach(input => {
      addInputFilter(input, /[^A-Za-z\u0600-\u06FF]/g);
    });
    addInputFilter(byId("nonSaudiPlate"), /[^A-Za-z0-9]/g);

    const checkbox = byId("checkNonSaudi");
    const saudiFields = byId("saudiPlateInputs");
    const nonSaudiField = byId("nonSaudiPlateField");
    const saudiRequiredFields = document.querySelectorAll(".saudi-input.plat-number-required-fields");
    const nonSaudiInput = byId("nonSaudiPlate");
    const togglePlateFields = () => {
      const nonSaudi = Boolean(checkbox?.checked);
      if (saudiFields) saudiFields.style.display = nonSaudi ? "none" : "flex";
      if (nonSaudiField) nonSaudiField.style.display = nonSaudi ? "block" : "none";
      saudiRequiredFields.forEach(input => {
        if (nonSaudi) {
          input.removeAttribute("data-required");
          input.classList.remove("custom-validate", "is-invalid");
          const error = errorElement(input);
          if (error) error.textContent = "";
        } else {
          input.setAttribute("data-required", "true");
          input.classList.add("custom-validate");
          attachValidation(input);
        }
      });
      if (nonSaudiInput) {
        if (nonSaudi) {
          nonSaudiInput.setAttribute("data-required", "true");
          nonSaudiInput.classList.add("custom-validate");
          attachValidation(nonSaudiInput);
        } else {
          nonSaudiInput.removeAttribute("data-required");
          nonSaudiInput.classList.remove("custom-validate", "is-invalid");
          const error = errorElement(nonSaudiInput);
          if (error) error.textContent = "";
        }
      }
      updatePlateCharacterIds();
    };
    checkbox?.addEventListener("change", togglePlateFields);
    togglePlateFields();
  }

  function initializePhone() {
    const phoneInput = byId("mobileInput");
    if (!phoneInput || typeof window.intlTelInput !== "function") return;

    const culture = languageIsArabic() ? "ar" : "en";
    const displayNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([culture], { type: "region" }) : null;
    const i18n = {};
    const countries = window.intlTelInput.getCountryData?.() || [];
    for (const country of countries) {
      const name = displayNames?.of(country.iso2.toUpperCase());
      if (name) i18n[country.iso2] = name;
    }
    if (state.labels?.searchPlaceholder) i18n.searchPlaceholder = state.labels.searchPlaceholder;

    state.phone = window.intlTelInput(phoneInput, {
      nationalMode: true,
      autoPlaceholder: "off",
      initialCountry: "sa",
      placeholderNumberType: "MOBILE",
      loadUtils: () => import(LOCAL_UTILS_SRC),
      i18n,
    });

    phoneInput.addEventListener("beforeinput", event => {
      if (event.data && /\D/.test(event.data)) event.preventDefault();
    });
    const syncPhoneFields = () => {
      const country = state.phone?.getSelectedCountryData?.();
      const countryCode = byId("bkcountrycode");
      const mobile = byId("bkmobilenumber");
      if (countryCode) countryCode.value = country?.dialCode || "";
      let number = phoneInput.value.replace(/\D/g, "");
      if (state.phone?.getNumber && window.intlTelInput.utils?.numberFormat) {
        number = state.phone
          .getNumber(window.intlTelInput.utils.numberFormat.NATIONAL)
          .replace(`+${country?.dialCode || ""}`, "")
          .replace(/\D/g, "");
      }
      if (mobile) mobile.value = number;
    };
    phoneInput.addEventListener("input", syncPhoneFields);
    phoneInput.addEventListener("countrychange", syncPhoneFields);
    phoneInput.addEventListener("blur", () => validatePhone(true));
    syncPhoneFields();
  }

  function validatePhone(showMessage) {
    const phoneInput = byId("mobileInput");
    if (!phoneInput) return true;
    const error = byId("phoneError");
    const showError = message => {
      phoneInput.classList.add("is-invalid");
      if (error && showMessage) {
        error.textContent = message || "";
        error.classList.remove("d-none");
      }
    };
    const clearError = () => {
      phoneInput.classList.remove("is-invalid");
      if (error) {
        error.textContent = "";
        error.classList.add("d-none");
      }
    };
    const value = phoneInput.value.trim();
    if (!value) {
      showError(validationMessage(phoneInput, true));
      return false;
    }
    if (/[^0-9\s()+-]/.test(value)) {
      showError(validationMessage(phoneInput, false));
      return false;
    }
    const iti = state.phone || window.intlTelInput?.getInstance?.(phoneInput);
    const numberType = iti?.getNumberType?.();
    const utils = window.intlTelInput?.utils;
    const isMobileType =
      utils?.numberType &&
      (numberType === utils.numberType.MOBILE || numberType === utils.numberType.FIXED_LINE_OR_MOBILE);
    const isValid = Boolean(iti?.isValidNumber?.() && isMobileType);
    if (!isValid) {
      showError(validationMessage(phoneInput, false));
      return false;
    }
    clearError();
    return true;
  }

  function purposeText() {
    const purpose = document.querySelector('input[name="appointmentPurpose"]:checked');
    return purpose?.getAttribute("data-purpose") || purpose?.closest("label")?.textContent?.trim() || "";
  }

  function selectedOptionText(id) {
    const select = byId(id);
    if (!select || select.selectedIndex < 0) return "";
    return select.options[select.selectedIndex]?.textContent?.trim() || "";
  }

  function syncReview() {
    const purpose = document.querySelector('input[name="appointmentPurpose"]:checked');
    const accident = byId("accidentNumberInput");
    const accidentReview = byId("reviewAccidentNumber");
    const accidentReviewCol = accidentReview?.closest(".col");
    if (accidentReviewCol) accidentReviewCol.style.display = purpose?.value === "2" ? "none" : "flex";

    const plate = byId("checkNonSaudi")?.checked
      ? readTextValue(byId("nonSaudiPlate")?.value)
      : Array.from(document.querySelectorAll(".saudi-input"))
          .map(input => readTextValue(input.value))
          .filter(Boolean)
          .join("-");
    const values = {
      assesmentPurpose: purposeText(),
      reviewName: byId("fullNameInput")?.value || "",
      reviewMobile: byId("mobileInput")?.value || "",
      reviewCountryCode: byId("bkcountrycode")?.value || "",
      reviewAccidentNumber: accident?.value || "PersonalPurpose",
      reviewPlateNumber: plate,
      reviewCenterType: selectedOptionText("centerTypeDropdown"),
      reviewRegion: selectedOptionText("regionDropdown"),
      reviewCenterCity: selectedOptionText("cityDropdown"),
      reviewCenterName: selectedOptionText("centerDropdown"),
      reviewAppointmentDate: byId("selectedDate")?.value || "",
      reviewAppointmentTime: byId("selectedTime")?.value || "",
    };
    for (const [id, value] of Object.entries(values)) {
      const target = byId(id);
      if (target) target.textContent = value;
    }
  }

  function updateProgress(step) {
    document.querySelectorAll("#progress-bar li").forEach((item, index) => {
      item.classList.remove("active", "completed");
      item.classList.add("inactive");
      const marker = item.querySelector(".white-roundedline");
      if (marker) marker.replaceChildren();
      if (index + 1 < step) {
        item.classList.add("completed");
        if (marker) {
          const image = document.createElement("img");
          image.src = "/assets/icons/check.svg?v=20261108-r4";
          image.alt = "check-icon";
          image.className = "mb-3 mb-md-2 ltr-img";
          marker.appendChild(image);
        }
      } else if (index + 1 === step) {
        item.classList.remove("inactive");
        item.classList.add("active");
      }
    });
  }

  function showLocalStep(step) {
    if (window.localPaymentSummary?.isOpen()) {
      window.localPaymentSummary.close();
      notifyPaymentRoute(false);
    }
    const next = Math.min(3, Math.max(1, step));
    state.step = next;
    document.querySelectorAll(".wizard-step").forEach(item => {
      item.style.display = "none";
    });
    const current = byId(`step${next}`);
    if (current) current.style.display = "block";
    updateProgress(next);
    const back = byId("btnBack");
    const nextButton = byId("btnNext");
    if (back) back.style.display = "inline-block";
    if (nextButton) nextButton.style.display = "inline-block";
    const buttonText = byId("buttonTextOnCondition");
    const sourceButtonText = readLocalizedValue(next === 3 ? "confirmBookingButton" : "nextButton");
    if (buttonText && sourceButtonText) buttonText.textContent = sourceButtonText;
    if (nextButton) nextButton.disabled = false;
    if (next === 2) {
      if (state.calendarDay !== saudiClock().key) {
        const selected = state.selects.center?.selectedOptions[0];
        renderAvailableDates(selected?.getAttribute("data-dayids") || "", true);
      }
      const cards = Array.from(document.querySelectorAll("#date-list .date-time-card.day"));
      const selectedDate = byId("selectedDate")?.value;
      const day = cards.find(card => card.getAttribute("data-date") === selectedDate) || cards[0];
      if (day) day.click();
      else if (nextButton) nextButton.disabled = true;
    }
    if (next === 3) syncReview();
  }

  function preventOnly(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function showApiError(message) {
    const error = byId("apiError");
    if (!error) return;
    error.textContent = message || "";
    error.classList.toggle("d-none", !message);
  }

  function hideApiError() {
    showApiError("");
  }

  function appointmentIsSelected() {
    const selectedSlotId = readTextValue(byId("selectedSlotId")?.value);
    const selectedDate = readTextValue(byId("selectedDate")?.value);
    const selectedTime = readTextValue(byId("selectedTime")?.value);
    const selectedBox = document.querySelector("#slot-selector .slot-box.block[data-reserved=\"false\"]");
    return Boolean(selectedSlotId && selectedDate && selectedTime && selectedBox);
  }

  function validateStep1AndMove() {
    hideApiError();
    const valid = typeof window.validateStep1 === "function" ? window.validateStep1() : false;
    const phoneValid = validatePhone(true);
    if (!valid || !phoneValid) {
      focusFirstInvalid();
      return false;
    }
    showLocalStep(2);
    return true;
  }

  function validateStep2AndMove() {
    if (!appointmentIsSelected()) {
      showApiError(sourceMessage(["noSlotSelected"]));
      document.querySelector("#slot-selector .slot-box:not([data-reserved=\"true\"]) ")?.focus?.();
      return false;
    }
    hideApiError();
    showLocalStep(3);
    return true;
  }

  function notifyPaymentRoute(open) {
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: open ? "taqdeer-summary-open" : "taqdeer-summary-back" },
        window.location.origin,
      );
    }
  }

  function selectedCenterFeeTotal() {
    const typeId = state.selects.type?.value;
    const cityId = state.selects.city?.value;
    const centerId = state.selects.center?.value;
    if (!["1", "2"].includes(typeId) || !cityId || !centerId) return null;
    const rows = state.lookupData?.centersByCityAndType?.[`${cityId}:${typeId}`]?.data;
    const center = Array.isArray(rows) ? rows.find(row => String(row.areaID) === String(centerId)) : null;
    if (!center) return null;
    // Source groups: 1 = car/motorcycle, 2 = bus/truck. Shared centers quote
    // separate light/heavy fees; single-category centers quote taqdeerFees.
    const categoryFee = Number(center[typeId === "2" ? "taqdeerHeavyFees" : "taqdeerLightFees"]);
    const generalFee = Number(center.taqdeerFees);
    const fee = Number.isFinite(categoryFee) && categoryFee > 0 ? categoryFee : generalFee;
    if (!Number.isFinite(fee) || fee <= 0) return null;
    const baseHalalas = Math.round(fee * 100);
    const vatHalalas = Math.round(baseHalalas * 15 / 100);
    return (baseHalalas + vatHalalas) / 100;
  }

  function openPaymentSummary(notify = true) {
    if (!window.localPaymentSummary) return;
    const selectedDate = byId("selectedDate")?.value || "";
    const selectedTime = byId("selectedTime")?.value || "";
    const hasAppointment = state.step === 3 && appointmentIsSelected() &&
      !isPastSlot(selectedDate, selectedTime);
    if (hasAppointment) syncReview();
    const feeTotal = selectedCenterFeeTotal();
    window.localPaymentSummary.open(hasAppointment ? {
      purpose: purposeText(),
      vehicleType: selectedOptionText("centerTypeDropdown"),
      center: selectedOptionText("centerDropdown"),
      city: selectedOptionText("cityDropdown"),
      date: selectedDate,
      time: selectedTime,
      feeTotal,
    } : null);
    if (notify) notifyPaymentRoute(true);
  }

  function closePaymentSummary(notify = true) {
    if (!window.localPaymentSummary?.isOpen()) return;
    window.localPaymentSummary.close();
    showLocalStep(state.step);
    if (notify) notifyPaymentRoute(false);
    byId("btnNext")?.focus();
  }

  function bindWizard() {
    const form = byId("wizardForm");
    form?.addEventListener("submit", preventOnly);

    byId("btnNext")?.addEventListener("click", event => {
      preventOnly(event);
      if (state.step === 1) validateStep1AndMove();
      else if (state.step === 2) validateStep2AndMove();
      else if (appointmentIsSelected() && !isPastSlot(byId("selectedDate")?.value, byId("selectedTime")?.value)) {
        openPaymentSummary();
      } else showLocalStep(2);
    });

    byId("btnBack")?.addEventListener("click", event => {
      preventOnly(event);
      if (state.step > 1) showLocalStep(state.step - 1);
    });

    byId("btnChooseAppointment")?.addEventListener("click", event => {
      preventOnly(event);
      if (state.step === 2) validateStep2AndMove();
    });

    byId("btnBackBooking")?.addEventListener("click", event => {
      preventOnly(event);
      showLocalStep(1);
    });

    byId("editPersonalInfo")?.addEventListener("click", event => {
      preventOnly(event);
      showLocalStep(1);
    });

    byId("editAppointmentSlot")?.addEventListener("click", event => {
      preventOnly(event);
      showLocalStep(2);
    });

    byId("btnPrevious")?.addEventListener("click", event => {
      preventOnly(event);
      showLocalStep(3);
    });

    byId("sendAppointmentBtn")?.addEventListener("click", preventOnly);
    byId("resendOtpLink")?.addEventListener("click", preventOnly);
    window.addEventListener("taqdeer-payment-back", () => closePaymentSummary());
    window.addEventListener("message", event => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type !== "taqdeer-payment-screen") return;
      if (event.data.open === true) openPaymentSummary(false);
      else closePaymentSummary(false);
    });
  }

  function refreshAppointmentClock() {
    if (document.hidden || !state.selects?.center?.value) return;
    const clock = saudiClock();
    const dateValue = byId("selectedDate")?.value || "";
    const timeValue = byId("selectedTime")?.value || "";
    const selectionExpired = dateValue && timeValue && isPastSlot(dateValue, timeValue, clock);
    if (state.calendarDay !== clock.key) {
      const selected = state.selects.center.selectedOptions[0];
      renderAvailableDates(selected?.getAttribute("data-dayids") || "", true);
      if (state.step === 2 || (state.step === 3 && selectionExpired)) showLocalStep(2);
    } else if (state.step === 2 && dateValue === clock.key) {
      renderLocalSlots(state.lookupData, state.selects.center.value, dateValue);
    } else if (state.step === 3 && selectionExpired) {
      showLocalStep(2);
    }
  }

  function bindPurpose() {
    document.querySelectorAll('input[name="appointmentPurpose"]').forEach(input => {
      input.addEventListener("change", togglePurposeRequired);
    });
    togglePurposeRequired();
  }

  function start() {
    if (!isBookingPage() || state.initialized) return;
    state.initialized = true;
    state.selects = {
      type: byId("centerTypeDropdown"),
      region: byId("regionDropdown"),
      city: byId("cityDropdown"),
      center: byId("centerDropdown"),
    };
    preserveInitialOptions();
    state.labels = makeLabels();
    bindPurpose();
    bindWizard();
    bindPlateAndInputFilters();
    setupStep1Validation();
    showLocalStep(1);
    initializePhone();
    loadLookups();
    window.setInterval(refreshAppointmentClock, 60000);
    document.addEventListener("visibilitychange", refreshAppointmentClock);
    window.addEventListener("focus", refreshAppointmentClock);
    window.addEventListener("pageshow", refreshAppointmentClock);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
