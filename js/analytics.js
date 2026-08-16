/**
 * Google Analytics 4 (G-GFWP9D7SZL) with UK PECR / UK GDPR consent.
 * The Google tag is not loaded until the visitor accepts analytics cookies.
 */
(function () {
  const MEASUREMENT_ID = 'G-GFWP9D7SZL';
  const STORAGE_KEY = 'monolith-cookie-consent';
  const CONSENT_VERSION = 1;
  const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 6 months

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  function readConsent() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '');
      if (!parsed || parsed.version !== CONSENT_VERSION || typeof parsed.analytics !== 'boolean') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function saveConsent(analytics) {
    const record = {
      version: CONSENT_VERSION,
      analytics,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (_) {
      /* private mode / blocked storage — still apply for this page */
    }
    return record;
  }

  const stored = readConsent();

  window.gtag('consent', 'default', {
    analytics_storage: stored && stored.analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: stored ? 0 : 500,
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);

  let tagLoaded = false;

  function loadGoogleTag() {
    if (tagLoaded) return;
    tagLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: COOKIE_MAX_AGE_SECONDS,
      cookie_flags: 'SameSite=Lax;Secure',
    });
  }

  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map((part) => part.split('=')[0].trim());
    const hosts = [location.hostname];
    if (location.hostname.startsWith('www.')) {
      hosts.push(location.hostname.slice(3));
    }
    names.forEach((name) => {
      if (name !== '_ga' && name !== '_gid' && name !== '_gat' && !name.startsWith('_ga_')) return;
      hosts.forEach((host) => {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
        document.cookie =
          name + '=; Path=/; Domain=' + host + '; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
      });
    });
  }

  function applyConsent(analytics) {
    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    if (analytics) {
      loadGoogleTag();
    } else {
      clearAnalyticsCookies();
    }
  }

  function bannerEl() {
    return document.getElementById('cookie-banner');
  }

  function hideBanner() {
    const el = bannerEl();
    if (!el) return;
    el.hidden = true;
    document.body.classList.remove('cookie-banner-visible');
  }

  function showBanner() {
    const el = bannerEl();
    if (!el) return;
    el.hidden = false;
    document.body.classList.add('cookie-banner-visible');
    const title = document.getElementById('cookie-banner-title');
    if (title) title.focus();
  }

  function setChoice(analytics) {
    saveConsent(analytics);
    applyConsent(analytics);
    hideBanner();
  }

  function ensureBanner() {
    if (bannerEl()) return;
    const wrap = document.createElement('div');
    wrap.id = 'cookie-banner';
    wrap.className = 'cookie-banner';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-labelledby', 'cookie-banner-title');
    wrap.hidden = true;
    wrap.innerHTML =
      '<div class="cookie-banner__inner">' +
      '<div class="cookie-banner__copy">' +
      '<p id="cookie-banner-title" class="cookie-banner__title" tabindex="-1">Cookies on this site</p>' +
      '<p class="cookie-banner__text">We use Google Analytics only if you accept, so we can see how the marketing site is used. Essential cookies for security and delivery still run. You can change this anytime. ' +
      '<a href="/privacy.html#cookies">How we use cookies</a></p>' +
      '</div>' +
      '<div class="cookie-banner__actions">' +
      '<button type="button" class="cookie-banner__btn cookie-banner__btn--reject" data-cookie-choice="reject">Reject analytics</button>' +
      '<button type="button" class="cookie-banner__btn cookie-banner__btn--accept" data-cookie-choice="accept">Accept analytics</button>' +
      '</div></div>';
    document.body.appendChild(wrap);

    wrap.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-cookie-choice]');
      if (!choice) return;
      setChoice(choice.getAttribute('data-cookie-choice') === 'accept');
    });
  }

  function init() {
    ensureBanner();
    if (stored) {
      applyConsent(stored.analytics);
      hideBanner();
    } else {
      showBanner();
    }

    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-cookie-settings]');
      if (!opener) return;
      event.preventDefault();
      showBanner();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
