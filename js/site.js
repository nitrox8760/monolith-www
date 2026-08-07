document.getElementById('y').textContent = String(new Date().getFullYear());

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LITE_KEY = 'beacon-www-lite';

function isLiteMode() {
  return document.documentElement.classList.contains('is-lite');
}

function setLiteMode(on) {
  document.documentElement.classList.toggle('is-lite', on);
  try {
    sessionStorage.setItem(LITE_KEY, on ? '1' : '0');
  } catch (_) {
    /* ignore */
  }
  const btn = document.getElementById('perf-toggle');
  if (btn) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'Lite on' : 'Lite off';
  }
  window.dispatchEvent(new CustomEvent('beacon:litechange', { detail: { on } }));
}

try {
  if (sessionStorage.getItem(LITE_KEY) === '1') setLiteMode(true);
} catch (_) {
  /* ignore */
}

const perfToggle = document.getElementById('perf-toggle');
if (perfToggle) {
  if (!document.documentElement.classList.contains('is-lite')) {
    perfToggle.setAttribute('aria-pressed', 'false');
    perfToggle.textContent = 'Lite off';
  }
  perfToggle.addEventListener('click', () => {
    setLiteMode(!isLiteMode());
  });
}

const reveals = document.querySelectorAll('.reveal');
if (reveals.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

const topbar = document.querySelector('.topbar');
const navToggle = document.getElementById('nav-toggle');
const topNav = document.getElementById('top-nav');
if (topbar && navToggle && topNav) {
  const closeNav = () => {
    topbar.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };
  navToggle.addEventListener('click', () => {
    const open = topbar.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  topNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });
}

if (topbar) {
  const syncTopbarScroll = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  syncTopbarScroll();
  window.addEventListener('scroll', syncTopbarScroll, { passive: true });
}

function formatHms(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

function startCountdown(el) {
  const resetAt = Number(el.dataset.countdown) || 6178;
  let remaining = resetAt;
  let timerId = null;
  let started = false;

  const paint = () => {
    el.textContent = formatHms(remaining);
  };

  const tick = () => {
    remaining -= 1;
    if (remaining < 0) remaining = resetAt;
    paint();
  };

  const stop = () => {
    if (timerId != null) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const start = () => {
    if (timerId != null || document.hidden || isLiteMode() || prefersReducedMotion) return;
    timerId = window.setInterval(tick, 1000);
  };

  const sync = () => {
    if (isLiteMode() || prefersReducedMotion || document.hidden) stop();
    else start();
  };

  paint();
  started = true;
  sync();
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('beacon:litechange', sync);
  return started;
}

const countdownEl = document.querySelector('[data-countdown]');
if (countdownEl && !prefersReducedMotion) {
  if ('IntersectionObserver' in window) {
    const timerIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startCountdown(countdownEl);
            timerIo.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 }
    );
    timerIo.observe(countdownEl);
  } else {
    startCountdown(countdownEl);
  }
}
