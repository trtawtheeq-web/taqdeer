(() => {
  "use strict";

  function initializeOriginalCenters() {
    const language = (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
    const source = window.originalCentersData?.[language];
    const list = document.getElementById("damageAssessmentCenterslist");
    const menuContainers = Array.from(document.querySelectorAll(".cities-list"));
    const showMore = document.getElementById("showMoreAssessmentCenters");
    const noAccess = document.querySelector(".no-access-found");
    if (!source || !list || !menuContainers.length) return;

    let cityId = String(source.defaultCityId);
    let currentPage = 0;

    function setNoAccess(visible) {
      noAccess?.classList.toggle("d-none", !visible);
      noAccess?.classList.toggle("d-flex", visible);
    }

    function setMore() {
      const city = source.cities[cityId];
      if (showMore) showMore.style.display = city && currentPage < city.pages.length && city.total > currentPage * source.pageSize ? "block" : "none";
    }

    function makeMapLinksUsable() {
      list.querySelectorAll("a[href^='https://maps.']").forEach(anchor => {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      });
    }

    function appendSourcePage() {
      const city = source.cities[cityId];
      if (!city || currentPage >= city.pages.length) return;
      list.insertAdjacentHTML("beforeend", city.pages[currentPage]);
      currentPage += 1;
      setNoAccess(city.total === 0);
      setMore();
      makeMapLinksUsable();
    }

    function selectSourceCity(nextId) {
      if (!source.cities[String(nextId)]) return;
      cityId = String(nextId);
      currentPage = 0;
      list.innerHTML = "";
      document.querySelectorAll(".selectedCity").forEach(label => {
        label.textContent = source.cities[cityId].name;
        label.dataset.cityid = cityId;
      });
      appendSourcePage();
    }

    for (const container of menuContainers) container.innerHTML = source.cityMenuHtml;
    document.addEventListener("click", event => {
      const link = event.target.closest?.(".damage-assessment-center[data-cityid]");
      if (!link) return;
      event.preventDefault();
      selectSourceCity(link.dataset.cityid);
    });
    showMore?.addEventListener("click", event => {
      event.preventDefault();
      appendSourcePage();
    });
    selectSourceCity(cityId);
  }

  if (window.originalCentersData) {
    initializeOriginalCenters();
  } else {
    const dataScript = document.createElement("script");
    dataScript.src = "/original/centers-data.js";
    dataScript.addEventListener("load", initializeOriginalCenters, { once: true });
    document.head.appendChild(dataScript);
  }
})();
