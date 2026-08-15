document.getElementById('y').textContent = String(new Date().getFullYear());

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    if (timerId != null || document.hidden) return;
    timerId = window.setInterval(tick, 1000);
  };

  paint();
  start();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
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

/** Lightweight CTA funnel hooks — works with Plausible if present; always logs locally for debug. */
function trackCta(name) {
  if (!name) return;
  try {
    if (typeof window.plausible === 'function') {
      window.plausible('CTA', { props: { id: name } });
    }
  } catch (_) {
    /* ignore */
  }
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'beacon_cta', cta_id: name });
  } catch (_) {
    /* ignore */
  }
}

document.querySelectorAll('[data-cta]').forEach((el) => {
  el.addEventListener('click', () => {
    trackCta(el.getAttribute('data-cta'));
  });
});

function parsePaperPages(root) {
  const raw = root.getAttribute('data-paper-pages') || '[]';
  try {
    const pages = JSON.parse(raw);
    return Array.isArray(pages) ? pages.filter((p) => typeof p === 'string' && p) : [];
  } catch {
    return [];
  }
}

function wirePaperFlip(root) {
  const pages = parsePaperPages(root);
  if (pages.length < 1) return;

  const img = root.querySelector('[data-paper-img]');
  const meta = root.querySelector('[data-paper-meta]');
  const prevBtn = root.querySelector('[data-paper-prev]');
  const nextBtn = root.querySelector('[data-paper-next]');
  if (!img || !meta || !prevBtn || !nextBtn) return;

  let index = 0;
  const title = root.closest('figure')?.querySelector('figcaption strong')?.textContent || 'Sample document';

  const sync = () => {
    img.src = pages[index];
    img.alt = `${title}, page ${index + 1}`;
    meta.textContent = `Page ${index + 1} of ${pages.length}`;
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= pages.length - 1;
  };

  prevBtn.addEventListener('click', () => {
    if (index <= 0) return;
    index -= 1;
    sync();
  });
  nextBtn.addEventListener('click', () => {
    if (index >= pages.length - 1) return;
    index += 1;
    sync();
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && index > 0) {
      index -= 1;
      sync();
    } else if (e.key === 'ArrowRight' && index < pages.length - 1) {
      index += 1;
      sync();
    }
  });

  if (pages.length > 1) {
    root.setAttribute('tabindex', '0');
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', `${title} page viewer`);
  } else {
    prevBtn.hidden = true;
    nextBtn.hidden = true;
  }

  // Warm nearby pages so flips feel instant.
  pages.slice(1, 3).forEach((src) => {
    const warm = new Image();
    warm.src = src;
  });

  sync();
}

document.querySelectorAll('[data-paper-flip]').forEach(wirePaperFlip);
