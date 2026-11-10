var currentUrl;
document.addEventListener("DOMContentLoaded", function () {

    const lockoutDuration = 10 * 60 * 1000; // 10 minutes
    // Digits only
    document.querySelectorAll(".digitonly").forEach(function (input) {
        input.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });

    // Letters only
    document.querySelectorAll(".letteronly").forEach(function (input) {
        input.addEventListener("input", function () {
            this.value = this.value.replace(/[^a-zA-Z]/g, '');
        });
    });

    currentUrl = window.location.href;

    currentUrl = currentUrl.replace(/\/(en|ar)/g, '').trim();
    currentUrl = currentUrl.endsWith('/') ? currentUrl.slice(0, -1) : currentUrl;
    if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        const activeStep = sessionStorage.getItem("activeStep");
        if (parseInt(activeStep) == 1) {
            clearSessionStorage(currentUrl);
        }
    }
    const navItems = document.querySelectorAll('.dropdown-menu .dropdown-item');

    navItems.forEach(function (li) {
        li.addEventListener('click', function () {
            // Clear session storage
            clearSessionStorage(currentUrl);
        });
    });

    setCurrentPageUrl();
});

function setCurrentPageUrl() {
    let previousUrl = sessionStorage.getItem('lastUrl');
    if (previousUrl) {
        previousUrl = previousUrl.replace(/\/(en|ar)/g, '').trim();
        previousUrl = previousUrl.endsWith('/') ? previousUrl.slice(0, -1) : previousUrl;
    }

    if (previousUrl && previousUrl !== currentUrl) {
        console.log("User navigated to a new URL");
        clearSessionStorage(currentUrl);
    } else {
        console.log("User reloaded the page or opened for the first time");
    }

    // Update the last URL for next time
    sessionStorage.setItem('lastUrl', currentUrl);
}

function clearSessionStorage(currentUrl) {
    sessionStorage.removeItem("activeStep");
    removeLocalStorageFormData();
    sessionStorage.removeItem("selectedAppointmentDate");
    sessionStorage.removeItem("selectedAppointmentSlot");
    sessionStorage.removeItem("AppointmentSelectedTime");
    sessionStorage.removeItem("generatedReqNumber");
    sessionStorage.removeItem("manageBookingDetails");
    sessionStorage.removeItem("raiseObjectionDACenterCitySP");
    sessionStorage.removeItem("generatedTicketNumber");
    sessionStorage.removeItem("arabData");
    sessionStorage.removeItem("engData");
    sessionStorage.removeItem("platChars");
    if (!currentUrl.includes('raise-objection')) {
        sessionStorage.removeItem("otpGeneratedTime");
    }
}
// (function () {
// let turnstileWidgetId = null;
// let executing = false; 
// let widgetReady = false;
// const tokenQueue = [];  

// async function processQueue() {
// if (executing || tokenQueue.length === 0) return;

// executing = true;
// const { resolve, reject } = tokenQueue.shift();

// try {
// // Always reset before a new token request
// turnstile.reset(turnstileWidgetId);

// turnstile.execute(turnstileWidgetId, {
// action: 'api_request',
// callback: (token) => {
// executing = false;
// resolve(token);
// processQueue(); 
// },
// 'error-callback': (err) => {
// executing = false;
// console.error("Turnstile execution error:", err);
// reject(err);
// processQueue();
// },
// 'expired-callback': () => {
// executing = false;
// console.warn("Turnstile token expired before use");
// processQueue();
// }
// });
// } catch (err) {
// executing = false;
// reject(err);
// processQueue();
// }
// }

// // --- Get a fresh Turnstile token safely ---
// async function getTurnstileToken() {
// return new Promise((resolve, reject) => {
// if (typeof turnstile === 'undefined' || !turnstileWidgetId || !widgetReady) {
// console.warn("Turnstile not initialized yet, retrying...");
// setTimeout(() => getTurnstileToken().then(resolve).catch(reject), 500);
// return;
// }

// // Queue up token request instead of direct execute
// tokenQueue.push({ resolve, reject });
// processQueue();
// });
// }

// // --- Initialize Turnstile widget ---
// function initTurnstile() {
// if (typeof turnstile === 'undefined') {
// console.warn("Turnstile not loaded yet, retrying...");
// setTimeout(initTurnstile, 1000);
// return;
// }

// const container = document.getElementById('invisible-turnstile-container');
// if (!container) {
// console.error("Missing #invisible-turnstile-container in DOM");
// return;
// }


// turnstileWidgetId = turnstile.render(container, {
// sitekey: turnstileSiteKey,
// size: 'normal', // You can change to 'invisible'
// theme: 'light'
// });

// widgetReady = true;
// console.log("✅ Turnstile widget initialized:", turnstileWidgetId);
// }

// // --- Run on DOM ready ---
// if (enableTurnstile) {
// document.addEventListener('DOMContentLoaded', initTurnstile);
// }

// // --- Patch Fetch globally ---
// const originalFetch = window.fetch;

// window.fetch = async function (input, init = {}) {
// init.headers = init.headers || {};

// if (enableTurnstile && widgetReady) {
// try {
// const token = await getTurnstileToken();
// init.headers['X-Turnstile-Token'] = token;
// } catch (err) {
// console.error("⚠️ Failed to get Turnstile token:", err);
// }
// }

// return originalFetch(input, init);
// };
// })();

(function () {
    // ====== CONFIG ======
    const enableTurnstile = window.enableTurnstile;
    const turnstileSiteKey = window.turnstileSiteKey;
    const requestQueue = [];
    let isProcessing = false;
    let turnstileWidgetId;
    let widgetReady = false;
    let executing = false;

    // ====== INITIALIZE TURNSTILE ======
    function initTurnstile() {
        if (enableTurnstile !== 1) return;

        if (typeof turnstile === "undefined") {
            setTimeout(initTurnstile, 800);
            return;
        }

        const container = document.getElementById("invisible-turnstile-container");
        if (!container) return;

        if (!turnstileWidgetId) {
            turnstileWidgetId = turnstile.render(container, {
                sitekey: turnstileSiteKey,
                //size: "invisible",
                //execution: 'execute',
                theme: "light"
            });
            widgetReady = true;
        }
    }

    document.addEventListener("DOMContentLoaded", initTurnstile);

    // ====== GET NEW TURNSTILE TOKEN ======
    function getNewTurnstileToken() {
        return new Promise((resolve, reject) => {
            if (!widgetReady || !turnstileWidgetId) {
                setTimeout(() => {
                    getNewTurnstileToken().then(resolve).catch(reject);
                }, 500);
                return;
            }

            if (executing) {
                const check = setInterval(() => {
                    if (!executing) {
                        clearInterval(check);
                        getNewTurnstileToken().then(resolve).catch(reject);
                    }
                }, 100);
                return;
            }

            executing = true;
            try {
                turnstile.reset(turnstileWidgetId);
                turnstile.execute(turnstileWidgetId, {
                    action: "api_request",
                    callback: function (token) {
                        executing = false;
                        resolve(token);
                    },
                    "error-callback": function (err) {
                        executing = false;
                        reject(err);
                    },
                    "expired-callback": function () {
                        executing = false;
                        reject("expired");
                    }
                });
            } catch (err) {
                executing = false;
                reject(err);
            }
        });
    }

    // ====== PROCESS REQUEST QUEUE ======
    async function processQueue() {
        if (isProcessing || requestQueue.length === 0) return;
        isProcessing = true;

        const { input, init, resolve, reject, type } = requestQueue.shift();

        try {
            // Only attach Turnstile token if enabled
            if (enableTurnstile === 1) {
                const token = await getNewTurnstileToken();
                if (!init.headers) {
                    init.headers = {};
                }
                init.headers["X-Turnstile-Token"] = token;
            }

            if (type === "fetch") {
                const response = await window.__originalFetch(input, init);
                resolve(response);
            } else if (type === "jquery") {
                $.ajax(init).done(resolve).fail(reject);
            }
        } catch (err) {
            reject(err);
        } finally {
            isProcessing = false;
            processQueue();
        }
    }

    // ====== PATCH FETCH ======
    window.__originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init = {}) {
        return new Promise(function (resolve, reject) {
            requestQueue.push({ type: "fetch", input: input, init: init, resolve: resolve, reject: reject });
            processQueue();
        });
    };

    // ====== PATCH jQuery AJAX ======
    if (window.jQuery) {
        const originalAjax = $.ajax;
        $.ajax = function (options) {
            return new Promise(function (resolve, reject) {
                requestQueue.push({
                    type: "jquery",
                    input: options.url,
                    init: options,
                    resolve: resolve,
                    reject: reject
                });
                processQueue();
            });
        };
    }
})();

function showError(message) {
    const errorDiv = document.getElementById("errorDiv");
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
}

function hideError() {
    const errorDiv = document.getElementById("errorDiv");
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
}


function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let c of cookies) {
        const [key, value] = c.split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}

function setCookie(name, value, days = 365) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

function applyTheme(theme) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(theme);
}

function initializeTheme() {
    let theme = getCookie("Theme");
    if (!theme) {
        theme = "light-mode";
        setCookie("Theme", theme);
    }
    applyTheme(theme);
}

function toggleDarkMode() {
    const current = document.body.classList.contains("dark-mode") ? "dark-mode" : "light-mode";
    const newTheme = current === "dark-mode" ? "light-mode" : "dark-mode";
    applyTheme(newTheme);
    setCookie("Theme", newTheme);
}

// Initialize on page load
initializeTheme();


// Define a global namespace object
window.AppCommon = window.AppCommon || {};

(function (ns) {
    //let countdown = 60;
    let countdown = 180;
    let otpTimerInterval;

    ns.startOtpTimer = function () {
        document.getElementById("otpMessage").textContent = "";
        clearInterval(otpTimerInterval);
        //const savedCountdown = parseInt(sessionStorage.getItem("otpCountdown"));
        const storedTime = sessionStorage.getItem('otpGeneratedTime');
        //if (!isNaN(savedCountdown) /*&& savedCountdown > 0*/) {
        //    countdown = savedCountdown;
        //}
        if (storedTime) {
            const currentTime = Date.now(); // in milliseconds
            const storedTimeMs = Number(storedTime);

            // ✅ Get absolute difference in whole seconds
            const diffInSeconds = Math.floor(Math.abs(currentTime - storedTimeMs) / 1000);

            if (diffInSeconds > 180) {
                countdown = 0;
            } else {
                countdown = 180 - diffInSeconds;
            }
        }
        else {
            // countdown = 60;
            countdown = 180;
        }

        // countdown = 180;
        otpTimerInterval = setInterval(() => {
            const tokenTimer = document.getElementById("tokenTimer");
            if (!tokenTimer) return;

            tokenTimer.textContent = otpExpireInSeconds.replace("[COUNT]", `${countdown}`);

            if (countdown <= 0) {
                clearInterval(otpTimerInterval);
                sessionStorage.removeItem('userOtp');
                const resend = document.getElementById("resendOtpSection");
                if (resend) resend.classList.remove("d-none");
                tokenTimer.textContent = "";
                return;
            }

            countdown--;
        }, 1000);
    };

    ns.stopOtpTimer = function () {
        document.getElementById("otpMessage").textContent = "";
        clearInterval(otpTimerInterval);
        //countdown = 60;
        countdown = 180;
        const tokenTimer = document.getElementById("tokenTimer");
        if (tokenTimer) tokenTimer.textContent = otpExpireInSeconds.replace("[COUNT]", `${countdown}`);

        const resend = document.getElementById("resendOtpSection");
        if (resend) resend.classList.add("d-none");
    };

    ns.lockResendButton = function lockResend(lockoutDuration) {
        console.log("Lockresend button");
        const btn = document.getElementById("resendOtpLink");
        btn.disabled = true;
        //btn.classList.add("d-none");
        document.getElementById("otpMessage").textContent = maxReachLimitText;
        document.getElementById("otpMessage").classList.add("alert", "alert-danger", "p-2", "text-danger", "mt-3");
        document.getElementById("resendOtpSection").classList.add("d-none");

        // Optional: auto-enable after 10 mins
        setTimeout(() => {
            resendAttempts = 0;
            btn.disabled = false;
            //btn.classList.remove("d-none");            

            const resend = document.getElementById("resendOtpSection");
            if (resend) resend.classList.remove("d-none");
            document.getElementById("otpMessage").textContent = "";
        }, lockoutDuration);
    };

})(window.AppCommon);
function setupStep1Validation(inputSelector) {
    const step = document.querySelector(inputSelector);
    if (!step) return;

    const inputs = step.querySelectorAll(".custom-validate");

    inputs.forEach(input => {
        attachValidation(input);
    });

    window.validateStep1 = function () {
        let allValid = true;
        const visibleInputs = step.querySelectorAll(".custom-validate");

        visibleInputs.forEach(input => {
            if (!validateCustomInput(input)) allValid = false;
        });

        return allValid;
    };
}

function attachValidation(input) {
    input.addEventListener("blur", () => validateCustomInput(input));
    input.addEventListener("input", () => validateCustomInput(input));
}

function validateCustomInput(input) {
    const value = input?.value.trim();
    const isRequired = input.dataset.required === "true";
    //const requiredMsg = "";// window.requiredMessage || "This field is required.";
    //const patternMsg = "";// window.validFieldMessage || "Invalid input format.";
    const requiredMsg = input.getAttribute("data-required-message") || requiredMessage;
    const patternMsg = input.getAttribute("data-error-message") || validFieldMessage;

    // If not visible (e.g., display: none), consider valid
    if (!input.offsetParent) {
        input.classList.remove("is-invalid");
        const container = input.closest(".mb-4") || input.parentElement;
        const errorEl = container?.querySelector(".formErrorMessage");
        if (errorEl) errorEl.textContent = "";
        return true;
    }

    if (input.classList.contains("saudi-input")) {

        // Auto move to next input if value entered
        const allSaudiInputs = document.querySelectorAll(".saudi-input");
        const index = Array.from(allSaudiInputs).indexOf(input);

        const maxLength = input.maxLength || 1;

        if (value.length >= maxLength && index < allSaudiInputs.length - 1) {
            allSaudiInputs[index + 1].focus();
        }

    }

    let pattern = null;
    if (input.dataset.pattern) {
        try {
            pattern = new RegExp(input.dataset.pattern);
        } catch (e) {
            console.warn("Invalid regex:", input.dataset.pattern);
        }
    }

    const container = input.closest(".mb-4") || input.parentElement;
    const errorEl = container?.querySelector(".formErrorMessage");

    let isValid = true;

    if (isRequired && value === "") {
        isValid = false;
        if (errorEl) errorEl.textContent = requiredMsg;
    } else if (value !== "" && pattern && !pattern.test(value)) {
        isValid = false;
        if (errorEl) errorEl.textContent = patternMsg;
    } else {
        if (errorEl) errorEl.textContent = "";
    }

    input.classList.toggle("is-invalid", !isValid);

    // ✅ Store to sessionStorage on every input
    const key = input.name || input.id;
    if (key) {
        const tag = input.tagName.toLowerCase();
        if (input.type === 'checkbox' || input.type === 'radio') {
            const checkedValue = input.checked;
            if (checkedValue) {
                sessionStorage.setItem('form_' + key, checkedValue);
            } else {
                sessionStorage.removeItem('form_' + key);
            }
        } else if (tag === 'select') {
            let selectedValue;
            if (input.id === 'centerTypeDropdown') {
                const selectedOption = input.options[input.selectedIndex];
                selectedValue = JSON.stringify({ value: input.value, index: selectedOption.getAttribute('data-index') });
            } else {
                selectedValue = input.value;
            }

            if (selectedValue) {
                sessionStorage.setItem('form_' + key, selectedValue);
            } else {
                sessionStorage.removeItem('form_' + key);
            }

        } else {
            if (value) {
                sessionStorage.setItem('form_' + key, value);
            } else {
                sessionStorage.removeItem('form_' + key);
            }
        }
    }

    return isValid;
}

function disableBack() {
    // Push a new state when the page loads, effectively making the current page the "forward" state
    window.history.pushState(null, null, window.location.href);

    // Listen for the popstate event (when user tries to go back)
    window.onpopstate = function () {
        // Push the user forward again, to the current page
        window.history.go(1);
    };
}

// Call the function when the page loads
window.onload = disableBack;

function updateSelectStyle(select) {
    if (select.value !== "") {
        select.classList.add('has-value');
    } else {
        select.classList.remove('has-value');
    }
}

// Init logic
document.querySelectorAll('select.form-select').forEach(select => {
    updateSelectStyle(select); // Initialize on load
    select.addEventListener('change', function () {
        updateSelectStyle(this);
    });
});

var populateFormStoredValues = function () {
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        const key = input.name || input.id;
        if (!key) return;

        const saved = sessionStorage.getItem('form_' + key);

        if (saved !== null) {
            const tag = input.tagName.toLowerCase();

            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = saved === 'true';
            }
            else if (tag === 'select') {

                if (input.id === 'centerTypeDropdown') {
                    const savedJson = JSON.parse(saved);
                    const matchedOption = Array.from(input.options).find(
                        opt => opt.getAttribute('data-index') === savedJson.index
                    );

                    if (matchedOption) {
                        matchedOption.selected = true;
                    }
                }
                else {
                    input.value = saved;

                    const matchedOption = Array.from(input.options).find(
                        opt => opt.value === saved
                    );
                    if (matchedOption) {
                        matchedOption.selected = true;
                    }
                }
            }
            else {
                input.value = saved;
            }
        }
    });
};

var populateCheckedRadio = function (radioButtons, storedValue) {
    radioButtons.forEach(radio => {
        radio.checked = (radio.value === storedValue);

        // Optionally add active class to the label (if needed)
        if (radio.checked) {
            radio.closest('label')?.classList.add('active');
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            radio.closest('label')?.classList.remove('active');
        }
    });
}

var removeLocalStorageFormData = function () {

    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('form_')) {
            sessionStorage.removeItem(key);
        }
    });
    sessionStorage.removeItem("CaseDetails");
}