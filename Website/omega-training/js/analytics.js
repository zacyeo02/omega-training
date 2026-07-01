/**
 * Omega Training — privacy-first analytics (GA4 + Google Consent Mode v2)
 *
 * Analytics cookies load ONLY after the visitor accepts, to comply with UK
 * PECR / GDPR. Until then, consent defaults to "denied" and no GA4 script runs.
 *
 * ==> TO ACTIVATE: replace G-XXXXXXXXXX below with your GA4 Measurement ID. <==
 * (It is the ONLY place the ID needs to change.)
 */
(function () {
  "use strict";

  var MEASUREMENT_ID = "G-HNVTR4KNYE";   // Omega Training GA4 property
  var STORAGE_KEY = "omega-consent";      // stored value: "granted" | "denied"

  // --- gtag bootstrap + Consent Mode v2 defaults (deny until chosen) --------
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  });

  var idIsReal = /^G-[A-Z0-9]{6,}$/.test(MEASUREMENT_ID) && MEASUREMENT_ID !== "G-XXXXXXXXXX";

  function loadGA() {
    if (!idIsReal || window.__omegaGaLoaded) return;
    window.__omegaGaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", MEASUREMENT_ID, { anonymize_ip: true });
  }

  function grantConsent() {
    gtag("consent", "update", { analytics_storage: "granted" });
    try { localStorage.setItem(STORAGE_KEY, "granted"); } catch (e) {}
    loadGA();
  }

  function denyConsent() {
    try { localStorage.setItem(STORAGE_KEY, "denied"); } catch (e) {}
  }

  // If they already accepted on a previous visit, restore it immediately.
  var stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (stored === "granted") {
    gtag("consent", "update", { analytics_storage: "granted" });
    loadGA();
  }

  // --- Consent banner (only shown when no choice has been made yet) ---------
  function buildBanner() {
    if (stored === "granted" || stored === "denied") return;

    var banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<p class="cookie-banner-text">We use analytics cookies to understand how visitors use our site, so we can make it better. ' +
          'You can accept or decline. See our <a href="/cookie-policy">cookie policy</a>.</p>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="btn btn-outline-dark cookie-decline">Decline</button>' +
          '<button type="button" class="btn btn-primary cookie-accept">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add("is-visible"); });

    function close() {
      banner.classList.remove("is-visible");
      setTimeout(function () { banner.remove(); }, 300);
    }
    banner.querySelector(".cookie-accept").addEventListener("click", function () { grantConsent(); close(); });
    banner.querySelector(".cookie-decline").addEventListener("click", function () { denyConsent(); close(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildBanner);
  } else {
    buildBanner();
  }
})();
