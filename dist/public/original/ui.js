(() => {
  "use strict";

  const parentOrigin = window.location.origin;

  function notifyParent(theme) {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "taqdeer-theme", theme }, parentOrigin);
    }
  }

  function applyTheme(theme, notify = false) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark-mode", dark);
    document.body.classList.toggle("light-mode", !dark);
    if (notify) notifyParent(dark ? "dark" : "light");
  }

  window.toggleDarkMode = () => {
    applyTheme(document.body.classList.contains("dark-mode") ? "light" : "dark", true);
  };

  window.addEventListener("message", event => {
    if (event.source !== window.parent || event.origin !== parentOrigin) return;
    if (!event.data || event.data.type !== "taqdeer-set-theme") return;
    applyTheme(event.data.theme === "dark" ? "dark" : "light");
  });

  document.addEventListener("submit", event => {
    event.preventDefault();
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    const themeToggles = Array.from(document.querySelectorAll(".circle-icon")).filter(button =>
      Array.from(button.querySelectorAll("img")).some(image => /(?:moon|sun-dark)\.svg(?:$|[?#])/.test(image.getAttribute("src") || ""))
    );
    for (const themeToggle of themeToggles) themeToggle.addEventListener("click", window.toggleDarkMode);

    // Parent-owned center data can attach here later without this UI bridge inventing values.
    window.dispatchEvent(new CustomEvent("taqdeer-centers-init", { detail: { document } }));
    applyTheme(document.body.classList.contains("dark-mode") ? "dark" : "light");
  });
})();
