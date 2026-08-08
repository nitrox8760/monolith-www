/**
 * Field-led homepage demo stepper.
 * Autoplay fills out a failed fitting, then advances through the visit story.
 */
(function () {
  const root = document.querySelector('[data-demo-root]');
  if (!root) return;

  const captionEl = root.querySelector('[data-demo-caption]');
  const dotsEl = root.querySelector('[data-demo-dots]');
  const prevBtn = root.querySelector('[data-demo-prev]');
  const nextBtn = root.querySelector('[data-demo-next]');
  const autoplayBtn = root.querySelector('[data-demo-autoplay]');
  const replayBtn = root.querySelector('[data-demo-replay]');
  const el018 = root.querySelector('[data-demo-row="el018"]');
  const el018Result = root.querySelector('[data-demo-el018-result]');
  const defects = root.querySelector('[data-demo-defects]');
  const defectTitle = root.querySelector('[data-demo-defect-title]');
  const defectSub = root.querySelector('[data-demo-defect-sub]');
  const issued = root.querySelector('[data-demo-issued]');
  const coda = root.querySelector('[data-demo-coda]');
  const codaRow = root.querySelector('[data-demo-coda-row]');

  const DESKTOP_MQ = window.matchMedia('(min-width: 900px)');
  const REDUCE_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  const STEP_HOLD_MS = 2200;
  const FAIL_PULSE_MS = 600;
  const FAIL_MARK_MS = 1200;

  function trackDemo(name) {
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

  function desktopCodaEnabled() {
    return DESKTOP_MQ.matches;
  }

  function stepCount() {
    return desktopCodaEnabled() ? 5 : 4;
  }

  function captions(index) {
    const total = stepCount();
    const titles = [
      'Open Riverside Court',
      'Fail EL-018 Plant room',
      'Defect stays on the site',
      'Issue the visit report',
      'Office sees it',
    ];
    return `Step ${index + 1} of ${total} — ${titles[index]}`;
  }

  let stepIndex = 0;
  let autoplayOn = !REDUCE_MQ.matches;
  let playing = false;
  let inView = true;
  let pausedByHover = false;
  let pausedByFocus = false;
  let timers = [];
  let completedTracked = false;

  function clearTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
  }

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function resetFieldChrome() {
    if (el018) {
      el018.classList.remove('is-active', 'is-fail');
      el018.classList.add('is-pending');
    }
    if (el018Result) el018Result.textContent = '—';
    if (defects) defects.classList.remove('is-bump');
    if (defectTitle) defectTitle.textContent = 'Open defects (2)';
    if (defectSub) defectSub.textContent = 'EL-031 still open from last visit';
    if (issued) issued.hidden = true;
    if (coda) coda.setAttribute('aria-hidden', 'true');
    if (codaRow) codaRow.classList.remove('is-pulse');
  }

  function applyEndState(index) {
    resetFieldChrome();

    if (index >= 1) {
      if (el018) {
        el018.classList.remove('is-pending', 'is-active');
        el018.classList.add('is-fail');
      }
      if (el018Result) el018Result.textContent = 'Failed';
    }

    if (index >= 2) {
      if (defectTitle) defectTitle.textContent = 'Open defects (3)';
      if (defectSub) defectSub.textContent = 'EL-018 Plant room — lamp failed to strike';
    }

    if (index >= 3) {
      if (issued) issued.hidden = false;
    }

    if (index >= 4 && desktopCodaEnabled()) {
      if (coda) coda.setAttribute('aria-hidden', 'false');
    }
  }

  function runStepTimeline(index) {
    clearTimers();
    applyEndState(index > 0 ? index - 1 : -1);
    if (index === 0) resetFieldChrome();

    const reduced = REDUCE_MQ.matches;
    if (reduced) {
      applyEndState(index);
      scheduleAdvance();
      return;
    }

    if (index === 0) {
      scheduleAdvance(4500);
      return;
    }

    if (index === 1) {
      // Hero micro-anim: highlight EL-018 → mark Fail
      resetFieldChrome();
      later(() => {
        if (el018) el018.classList.add('is-active');
      }, FAIL_PULSE_MS);
      later(() => {
        if (el018) {
          el018.classList.remove('is-pending', 'is-active');
          el018.classList.add('is-fail');
        }
        if (el018Result) el018Result.textContent = 'Failed';
      }, FAIL_MARK_MS);
      later(() => scheduleAdvance(2000), FAIL_MARK_MS + 900);
      return;
    }

    if (index === 2) {
      applyEndState(1);
      later(() => {
        if (defectTitle) defectTitle.textContent = 'Open defects (3)';
        if (defectSub) defectSub.textContent = 'EL-018 Plant room — lamp failed to strike';
        if (defects) defects.classList.add('is-bump');
      }, 400);
      later(() => {
        if (defects) defects.classList.remove('is-bump');
        scheduleAdvance(2000);
      }, 1600);
      return;
    }

    if (index === 3) {
      applyEndState(2);
      later(() => {
        if (issued) issued.hidden = false;
      }, 300);
      later(() => scheduleAdvance(2400), 900);
      return;
    }

    if (index === 4) {
      applyEndState(3);
      if (coda) coda.setAttribute('aria-hidden', 'false');
      later(() => {
        if (codaRow) codaRow.classList.add('is-pulse');
      }, 350);
      later(() => {
        if (codaRow) codaRow.classList.remove('is-pulse');
        scheduleAdvance(0);
      }, 2200);
      return;
    }

    scheduleAdvance();
  }

  function canAutoplay() {
    return autoplayOn && playing && inView && !pausedByHover && !pausedByFocus && !REDUCE_MQ.matches;
  }

  function finishAutoplay() {
    playing = false;
    updateControls();
    if (!completedTracked) {
      completedTracked = true;
      trackDemo('demo_complete');
    }
  }

  function scheduleAdvance(holdMs = STEP_HOLD_MS) {
    if (!canAutoplay()) return;
    const last = stepCount() - 1;
    if (stepIndex >= last) {
      finishAutoplay();
      return;
    }
    later(() => goTo(stepIndex + 1, { fromAutoplay: true }), holdMs);
  }

  function buildDots() {
    if (!dotsEl) return;
    const n = stepCount();
    dotsEl.innerHTML = '';
    for (let i = 0; i < n; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'demo-tour__dot';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Go to step ${i + 1}`);
      btn.setAttribute('aria-selected', i === stepIndex ? 'true' : 'false');
      btn.addEventListener('click', () => {
        trackDemo('demo_dot');
        goTo(i, { instant: true });
      });
      dotsEl.appendChild(btn);
    }
  }

  function updateControls() {
    const last = stepCount() - 1;
    if (prevBtn) prevBtn.disabled = stepIndex <= 0;
    if (nextBtn) {
      nextBtn.disabled = stepIndex >= last;
      nextBtn.hidden = stepIndex >= last;
    }
    if (replayBtn) replayBtn.hidden = stepIndex < last;
    if (autoplayBtn) {
      autoplayBtn.setAttribute('aria-pressed', autoplayOn ? 'true' : 'false');
      autoplayBtn.textContent = autoplayOn ? 'Autoplay on' : 'Autoplay off';
      autoplayBtn.disabled = REDUCE_MQ.matches;
    }
    if (dotsEl) {
      dotsEl.querySelectorAll('.demo-tour__dot').forEach((dot, i) => {
        dot.setAttribute('aria-selected', i === stepIndex ? 'true' : 'false');
      });
    }
  }

  function goTo(index, opts = {}) {
    const last = stepCount() - 1;
    const next = Math.max(0, Math.min(last, index));
    clearTimers();
    stepIndex = next;
    root.dataset.step = String(stepIndex + 1);
    if (captionEl) captionEl.textContent = captions(stepIndex);
    updateControls();

    if (opts.instant || REDUCE_MQ.matches) {
      applyEndState(stepIndex);
      if (stepIndex >= stepCount() - 1 && opts.fromAutoplay) {
        finishAutoplay();
        return;
      }
      if (autoplayOn && !REDUCE_MQ.matches && inView) {
        playing = true;
        scheduleAdvance(opts.fromAutoplay ? STEP_HOLD_MS : 4500);
      }
      return;
    }

    playing = autoplayOn && inView;
    runStepTimeline(stepIndex);
  }

  function onViewportChange() {
    const last = stepCount() - 1;
    if (stepIndex > last) {
      goTo(last, { instant: true });
      return;
    }
    buildDots();
    if (captionEl) captionEl.textContent = captions(stepIndex);
    updateControls();
    if (stepIndex === 4 && !desktopCodaEnabled()) {
      goTo(3, { instant: true });
    }
  }

  // Controls
  prevBtn?.addEventListener('click', () => {
    trackDemo('demo_prev');
    goTo(stepIndex - 1, { instant: true });
  });

  nextBtn?.addEventListener('click', () => {
    trackDemo('demo_next');
    goTo(stepIndex + 1, { instant: true });
  });

  autoplayBtn?.addEventListener('click', () => {
    if (REDUCE_MQ.matches) return;
    autoplayOn = !autoplayOn;
    trackDemo('demo_autoplay');
    updateControls();
    clearTimers();
    if (autoplayOn) {
      playing = true;
      pausedByFocus = false;
      applyEndState(stepIndex);
      scheduleAdvance(STEP_HOLD_MS);
    } else {
      playing = false;
      applyEndState(stepIndex);
    }
  });

  replayBtn?.addEventListener('click', () => {
    trackDemo('demo_replay');
    completedTracked = false;
    playing = autoplayOn;
    goTo(0, { instant: false });
  });

  function pausePlayback() {
    clearTimers();
    applyEndState(stepIndex);
  }

  // Pause on hover / focus within controls+stage
  root.addEventListener('mouseenter', () => {
    pausedByHover = true;
    pausePlayback();
  });
  root.addEventListener('mouseleave', () => {
    pausedByHover = false;
    if (canAutoplay()) scheduleAdvance(STEP_HOLD_MS);
  });
  root.addEventListener('focusin', () => {
    pausedByFocus = true;
    pausePlayback();
  });
  root.addEventListener('focusout', (e) => {
    if (root.contains(e.relatedTarget)) return;
    pausedByFocus = false;
    if (canAutoplay()) scheduleAdvance(STEP_HOLD_MS);
  });

  // Off-screen pause
  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      inView = !!(entry && entry.isIntersecting && entry.intersectionRatio > 0.2);
      if (!inView) {
        pausePlayback();
      } else if (autoplayOn && !REDUCE_MQ.matches) {
        playing = true;
        applyEndState(stepIndex);
        scheduleAdvance(STEP_HOLD_MS);
      }
    },
    { threshold: [0, 0.2, 0.5] }
  );
  io.observe(root);

  DESKTOP_MQ.addEventListener('change', onViewportChange);
  REDUCE_MQ.addEventListener('change', () => {
    if (REDUCE_MQ.matches) {
      autoplayOn = false;
      playing = false;
      clearTimers();
      applyEndState(stepIndex);
      updateControls();
    } else {
      autoplayOn = true;
      updateControls();
      if (inView) {
        playing = true;
        goTo(stepIndex, { instant: false });
      }
    }
  });

  // Boot
  if (REDUCE_MQ.matches) {
    autoplayOn = false;
    playing = false;
  } else {
    playing = true;
  }
  buildDots();
  goTo(0, { instant: REDUCE_MQ.matches });
})();
