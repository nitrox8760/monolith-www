/**
 * Field-led homepage demo — sites → overview → pass/pass/fail → defect → Console focus.
 * Autoplays once; manual Back/Next always runs step animations.
 */
(function () {
  const root = document.querySelector('[data-demo-root]');
  if (!root) return;

  const kickerEl = root.querySelector('[data-demo-kicker]');
  const titleEl = root.querySelector('[data-demo-title]');
  const narrationEl = root.querySelector('[data-demo-narration]');
  const tipTextEl = root.querySelector('[data-demo-tip-text]');
  const hintEl = root.querySelector('[data-demo-hint]');
  const stepsEl = root.querySelector('[data-demo-steps]');
  const prevBtn = root.querySelector('[data-demo-prev]');
  const nextBtn = root.querySelector('[data-demo-next]');
  const replayBtn = root.querySelector('[data-demo-replay]');
  const headerTitle = root.querySelector('[data-demo-header-title]');
  const headerEl = root.querySelector('[data-demo-header]');

  const screenEls = {
    sites: root.querySelector('[data-demo-screen="sites"]'),
    overview: root.querySelector('[data-demo-screen="overview"]'),
    test: root.querySelector('[data-demo-screen="test"]'),
  };

  const navItems = {
    overview: root.querySelector('[data-nav="overview"]'),
    test: root.querySelector('[data-nav="test"]'),
  };

  const sitesScroll = root.querySelector('[data-demo-sites-scroll]');
  const riversideBtn = root.querySelector('[data-demo-site-riverside]');
  const consoleFocus = root.querySelector('[data-demo-console-focus]');
  const codaRow = root.querySelector('[data-demo-coda-row]');
  const codaSummary = root.querySelector('[data-demo-coda-summary]');
  const testNav = root.querySelector('[data-nav="test"]');
  const completeBtn = root.querySelector('[data-demo-complete]');
  const completeFoot = root.querySelector('[data-demo-test-foot]');

  const rows = {
    el012: {
      el: root.querySelector('[data-demo-row="el012"]'),
      badge: root.querySelector('[data-demo-el012-badge]'),
      actions: root.querySelector('[data-demo-el012-actions]'),
      change: root.querySelector('[data-demo-el012-change]'),
      passBtn: root.querySelector('[data-demo-pass-el012]'),
    },
    el024: {
      el: root.querySelector('[data-demo-row="el024"]'),
      badge: root.querySelector('[data-demo-el024-badge]'),
      actions: root.querySelector('[data-demo-el024-actions]'),
      change: root.querySelector('[data-demo-el024-change]'),
      passBtn: root.querySelector('[data-demo-pass-el024]'),
    },
    el018: {
      el: root.querySelector('[data-demo-row="el018"]'),
      badge: root.querySelector('[data-demo-el018-badge]'),
      actions: root.querySelector('[data-demo-actions]'),
      change: root.querySelector('[data-demo-el018-change]'),
      fault: root.querySelector('[data-demo-el018-fault]'),
      failBtn: root.querySelector('[data-demo-fail]'),
      passBtn: root.querySelector('[data-demo-pass]'),
    },
  };

  const defects = root.querySelector('[data-demo-defects]');
  const defectTitle = root.querySelector('[data-demo-defect-title]');
  const defectNew = root.querySelector('[data-demo-defect-new]');
  const snapDefects = root.querySelector('[data-demo-snap-defects]');
  const syncIcon = root.querySelector('[data-demo-sync]');
  const toast = root.querySelector('[data-demo-toast]');
  const progressLabel = root.querySelector('[data-demo-progress-label]');
  const progressPct = root.querySelector('[data-demo-progress-pct]');
  const progressBar = root.querySelector('[data-demo-progress-bar]');
  const groupCount = root.querySelector('[data-demo-group-count]');

  const failSheet = root.querySelector('[data-demo-fail-sheet]');
  const reasonSelect = root.querySelector('[data-demo-reason-select]');
  const reasonLabel = root.querySelector('[data-demo-reason-label]');
  const reasonOptions = root.querySelector('[data-demo-reasons]');
  const reasonButtons = Array.from(root.querySelectorAll('[data-reason]'));
  const notesText = root.querySelector('[data-demo-notes-text]');
  const notesPh = root.querySelector('[data-demo-notes-ph]');
  const caret = root.querySelector('[data-demo-caret]');
  const photo = root.querySelector('[data-demo-photo]');
  const photoSub = root.querySelector('[data-demo-photo-sub]');
  const saveFailBtn = root.querySelector('[data-demo-save-fail]');

  const DESKTOP_MQ = window.matchMedia('(min-width: 900px)');
  const REDUCE_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const NOTES = 'Lamp failed to strike';

  const STEPS = [
    {
      title: 'Find Riverside Court',
      narration: 'Start from your sites list — scroll to the job, open it, and you’re on site.',
      tip: 'Riverside Court in the sites list',
      screen: 'sites',
      header: 'Beacon',
    },
    {
      title: 'On the site',
      narration: 'Overview is the site home — period status and anything still open on the register.',
      tip: 'the sync icon — green when the site is up to date',
      screen: 'overview',
      header: 'Riverside Court',
      spot: 'sync',
    },
    {
      title: 'Test the visit',
      narration: 'Pass the fittings that are fine, then Fail the one that isn’t — Log failure keeps the reason with it.',
      tip: 'PASS, PASS, then FAIL on EL-018',
      screen: 'test',
      header: 'Riverside Court',
    },
    {
      title: 'Defect stays on the site',
      narration: 'The fail doesn’t vanish when you leave Test — Open defects keeps it on the site until it’s cleared.',
      tip: 'Open defects — the new EL-018 row on the register',
      screen: 'overview',
      header: 'Riverside Court',
      spot: 'defects',
    },
    {
      title: 'Office sees it',
      narration: 'In Console, the same site shows needs attention — so the office isn’t waiting on a photo of a checklist.',
      tip: 'Console Sites — Riverside Court needs attention',
      screen: 'overview',
      header: 'Riverside Court',
      consoleFocus: true,
    },
  ];

  let stepIndex = 0;
  let autoplayActive = !REDUCE_MQ.matches;
  let autoplayFinished = false;
  let inView = true;
  let hasStarted = false;
  let timers = [];
  let completedTracked = false;
  let failComplete = false;
  let passed012 = false;
  let passed024 = false;
  let typingToken = 0;
  let selectedReason = '';

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

  function clearTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
    typingToken += 1;
  }

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function stopAutoplay() {
    if (!autoplayActive) {
      clearTimers();
      return;
    }
    autoplayActive = false;
    clearTimers();
    updateCopy();
  }

  function hintForState() {
    if (REDUCE_MQ.matches) return 'Use Back and Next to step through the visit.';
    if (autoplayActive) return 'Playing through once — click Back or Next anytime to take over.';
    if (autoplayFinished) return 'Use Back and Next to step through again — animations still play.';
    return 'Use Back and Next to explore — animations play on each step.';
  }

  function setConsoleFocus(on) {
    root.classList.toggle('is-console-focus', on);
    if (consoleFocus) {
      consoleFocus.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
  }

  function setHeaderMode(mode) {
    if (headerEl) headerEl.setAttribute('data-mode', mode === 'brand' ? 'brand' : 'site');
  }

  function setScreen(name, opts = {}) {
    const animate = opts.animate !== false && !REDUCE_MQ.matches;
    const prev = root.dataset.screen;
    root.dataset.screen = name;

    Object.entries(navItems).forEach(([key, el]) => {
      if (el) el.classList.toggle('is-active', key === name);
    });

    const fromEl = prev && prev !== name ? screenEls[prev] : null;
    const toEl = screenEls[name];

    if (!animate || !fromEl || !toEl) {
      Object.entries(screenEls).forEach(([key, el]) => {
        if (!el) return;
        el.classList.remove('is-leaving', 'is-entering');
        el.classList.toggle('is-shown', key === name);
      });
      return;
    }

    fromEl.classList.remove('is-shown', 'is-entering');
    fromEl.classList.add('is-leaving');
    toEl.classList.remove('is-leaving');
    toEl.classList.add('is-shown', 'is-entering');

    later(() => {
      fromEl.classList.remove('is-leaving');
      toEl.classList.remove('is-entering');
      Object.entries(screenEls).forEach(([key, el]) => {
        if (!el || key === name) return;
        el.classList.remove('is-shown', 'is-entering', 'is-leaving');
      });
    }, 360);
  }

  function setHeader(title, mode) {
    if (headerTitle) headerTitle.textContent = title;
    if (mode) setHeaderMode(mode);
    else setHeaderMode(title === 'Sites' || title === 'Beacon' ? 'brand' : 'site');
  }

  function setFailSheetOpen(open) {
    if (!failSheet) return;
    failSheet.classList.toggle('is-open', open);
    failSheet.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function showToast(show) {
    if (!toast) return;
    toast.hidden = !show;
  }

  function resetFailSheet() {
    setFailSheetOpen(false);
    selectedReason = '';
    if (reasonOptions) reasonOptions.hidden = true;
    if (reasonLabel) {
      reasonLabel.textContent = 'Select fault reason';
      reasonLabel.classList.add('is-placeholder');
    }
    if (reasonSelect) reasonSelect.classList.remove('is-filled');
    reasonButtons.forEach((btn) => btn.classList.remove('is-selected'));
    if (notesText) notesText.textContent = '';
    if (notesPh) notesPh.hidden = false;
    if (caret) caret.hidden = true;
    if (photo) photo.classList.remove('is-ready');
    if (photoSub) photoSub.textContent = 'Required when logging a new failure';
    if (saveFailBtn) {
      saveFailBtn.disabled = true;
      saveFailBtn.classList.remove('is-pulse');
    }
  }

  function updateSaveEnabled() {
    if (!saveFailBtn) return;
    saveFailBtn.disabled = !(selectedReason && photo?.classList.contains('is-ready'));
  }

  function selectReason(label) {
    selectedReason = label;
    reasonButtons.forEach((btn) => {
      btn.classList.toggle('is-selected', btn.getAttribute('data-reason') === label);
    });
    if (reasonLabel) {
      reasonLabel.textContent = label;
      reasonLabel.classList.remove('is-placeholder');
    }
    if (reasonSelect) reasonSelect.classList.add('is-filled');
    if (reasonOptions) reasonOptions.hidden = true;
    updateSaveEnabled();
  }

  function attachPhoto() {
    if (photo) photo.classList.add('is-ready');
    if (photoSub) photoSub.textContent = 'Demo photo attached';
    updateSaveEnabled();
  }

  function typeNotes(text, done) {
    if (!notesText) {
      done?.();
      return;
    }
    const token = ++typingToken;
    notesText.textContent = '';
    if (notesPh) notesPh.hidden = true;
    if (caret) caret.hidden = false;
    let i = 0;
    const tick = () => {
      if (token !== typingToken) return;
      if (i >= text.length) {
        if (caret) caret.hidden = true;
        done?.();
        return;
      }
      notesText.textContent += text[i];
      i += 1;
      later(tick, 42);
    };
    later(tick, 60);
  }

  function updateProgress() {
    let n = 0;
    if (passed012) n += 1;
    if (passed024) n += 1;
    if (failComplete) n += 1;
    const pct = Math.round((n / 3) * 100);
    if (progressLabel) progressLabel.textContent = `${n}/3 tested`;
    if (progressPct) progressPct.textContent = `${pct}%`;
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (groupCount) groupCount.textContent = `${n}/3 tested`;
    if (completeFoot) completeFoot.hidden = n < 3;
  }

  function setRowPassed(key, passed) {
    const row = rows[key];
    if (!row?.el) return;
    if (key === 'el012') passed012 = passed;
    if (key === 'el024') passed024 = passed;
    row.el.classList.toggle('is-pass', passed);
    row.el.classList.toggle('is-pending', !passed);
    row.el.classList.remove('is-active', 'is-fail');
    if (row.badge) row.badge.hidden = !passed;
    if (row.actions) row.actions.hidden = passed;
    if (row.change) row.change.hidden = !passed;
    if (row.passBtn) row.passBtn.classList.remove('is-pulse');
    updateProgress();
  }

  function setEl018Failed(failed) {
    failComplete = failed;
    const row = rows.el018;
    if (!row?.el) return;
    row.el.classList.toggle('is-fail', failed);
    row.el.classList.toggle('is-pending', !failed);
    row.el.classList.toggle('is-active', !failed && stepIndex === 2);
    if (row.actions) row.actions.hidden = failed;
    if (row.badge) row.badge.hidden = !failed;
    if (row.fault) row.fault.hidden = !failed;
    if (row.change) row.change.hidden = !failed;
    if (row.failBtn) row.failBtn.classList.remove('is-pulse');
    updateProgress();
  }

  function setDefectsOpen(open) {
    if (defectTitle) defectTitle.textContent = open ? 'Open defects (2)' : 'Open defects (1)';
    if (defectNew) {
      defectNew.hidden = !open;
      defectNew.classList.toggle('is-new', open);
    }
    if (snapDefects) {
      snapDefects.innerHTML = open ? '<strong>2</strong> Open defects' : '<strong>1</strong> Open defect';
    }
    if (defects) defects.classList.toggle('is-spot', open && stepIndex === 3);
  }

  function clearSpots() {
    if (syncIcon) syncIcon.classList.remove('is-spot');
    if (defects) defects.classList.remove('is-spot');
    if (rows.el018.failBtn) rows.el018.failBtn.classList.remove('is-pulse');
    if (riversideBtn) riversideBtn.classList.remove('is-active', 'is-press');
    if (codaRow) codaRow.classList.remove('is-pulse', 'is-spotlight');
    if (codaSummary) codaSummary.classList.remove('is-pulse');
    if (testNav) testNav.classList.remove('is-press');
    if (completeBtn) completeBtn.classList.remove('is-press');
  }

  function applySpot(spot) {
    clearSpots();
    if (spot === 'sync' && syncIcon) syncIcon.classList.add('is-spot');
    if (spot === 'defects' && defects) defects.classList.add('is-spot');
  }

  function resetChecklist() {
    setRowPassed('el012', false);
    setRowPassed('el024', false);
    setEl018Failed(false);
    if (rows.el012.el) rows.el012.el.classList.remove('is-active');
    if (rows.el024.el) rows.el024.el.classList.remove('is-active');
    if (rows.el018.el) rows.el018.el.classList.remove('is-active');
  }

  function resetChrome() {
    resetFailSheet();
    resetChecklist();
    setDefectsOpen(false);
    clearSpots();
    showToast(false);
    setConsoleFocus(false);
    if (codaRow) codaRow.classList.remove('is-pulse', 'is-spotlight');
    if (sitesScroll) sitesScroll.scrollTop = 0;
  }

  function applyEndState(index) {
    resetChrome();
    const step = STEPS[index];
    setScreen(step.screen, { animate: false });
    setHeader(step.header, step.screen === 'sites' ? 'brand' : 'site');
    applySpot(step.spot);
    setConsoleFocus(!!step.consoleFocus && desktopCodaEnabled());

    if (index >= 2) {
      setRowPassed('el012', true);
      setRowPassed('el024', true);
      setEl018Failed(true);
    }
    if (index >= 3) setDefectsOpen(true);
  }

  function updateCopy() {
    const total = stepCount();
    const step = STEPS[stepIndex];
    if (kickerEl) kickerEl.textContent = `Step ${stepIndex + 1} of ${total}`;
    if (titleEl) titleEl.textContent = step.title;
    if (narrationEl) narrationEl.textContent = step.narration;
    if (tipTextEl) tipTextEl.textContent = step.tip;
    if (hintEl) hintEl.textContent = hintForState();
  }

  function buildSteps() {
    if (!stepsEl) return;
    const n = stepCount();
    stepsEl.innerHTML = '';
    for (let i = 0; i < n; i += 1) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'demo-tour__step';
      btn.setAttribute('aria-current', i === stepIndex ? 'step' : 'false');
      btn.innerHTML =
        `<span class="demo-tour__step-num">${i + 1}</span>` +
        `<span class="demo-tour__step-label">${STEPS[i].title}</span>`;
      btn.addEventListener('click', () => {
        trackDemo('demo_dot');
        userGoTo(i);
      });
      li.appendChild(btn);
      stepsEl.appendChild(li);
    }
  }

  function updateControls() {
    const last = stepCount() - 1;
    if (prevBtn) prevBtn.disabled = stepIndex <= 0;
    if (nextBtn) {
      nextBtn.disabled = stepIndex >= last;
      nextBtn.hidden = stepIndex >= last;
    }
    if (replayBtn) replayBtn.hidden = !(autoplayFinished || stepIndex >= last);
    if (stepsEl) {
      stepsEl.querySelectorAll('.demo-tour__step').forEach((btn, i) => {
        btn.setAttribute('aria-current', i === stepIndex ? 'step' : 'false');
      });
    }
  }

  function canAutoAdvance() {
    return autoplayActive && inView && !REDUCE_MQ.matches;
  }

  function finishAutoplay() {
    autoplayActive = false;
    autoplayFinished = true;
    updateCopy();
    updateControls();
    if (!completedTracked) {
      completedTracked = true;
      trackDemo('demo_complete');
    }
  }

  function scheduleAdvance(holdMs) {
    if (!canAutoAdvance()) return;
    const last = stepCount() - 1;
    if (stepIndex >= last) {
      finishAutoplay();
      return;
    }
    later(() => goTo(stepIndex + 1), holdMs);
  }

  function completeFailFromSheet() {
    setFailSheetOpen(false);
    setEl018Failed(true);
    if (rows.el018.el) rows.el018.el.classList.remove('is-active');
    showToast(true);
    later(() => showToast(false), 2000);
  }

  function completeTestThenAdvance() {
    if (REDUCE_MQ.matches || !completeBtn) {
      scheduleAdvance(REDUCE_MQ.matches ? 0 : 1600);
      return;
    }
    // The button lives in the sticky top bar — scroll up so it's in view, then press
    const testBody = screenEls.test;
    if (testBody) testBody.scrollTo({ top: 0, behavior: 'smooth' });
    later(() => completeBtn.classList.add('is-press'), 650);
    later(() => {
      completeBtn.classList.remove('is-press');
      scheduleAdvance(700);
    }, 1150);
  }

  function passFitting(key, done) {
    const row = rows[key];
    if (!row?.el) {
      done?.();
      return;
    }
    row.el.classList.add('is-active');
    if (row.passBtn) row.passBtn.classList.add('is-pulse');
    later(() => {
      setRowPassed(key, true);
      done?.();
    }, REDUCE_MQ.matches ? 0 : 550);
  }

  function runFailAutofill(onDone) {
    if (rows.el018.el) rows.el018.el.classList.add('is-active');
    if (rows.el018.failBtn) rows.el018.failBtn.classList.add('is-pulse');

    if (REDUCE_MQ.matches) {
      selectReason('Lamp fault');
      if (notesText) notesText.textContent = NOTES;
      if (notesPh) notesPh.hidden = true;
      attachPhoto();
      completeFailFromSheet();
      onDone?.();
      return;
    }

    later(() => {
      if (rows.el018.failBtn) rows.el018.failBtn.classList.remove('is-pulse');
      setFailSheetOpen(true);
      if (reasonOptions) reasonOptions.hidden = false;
    }, 1100);

    later(() => selectReason('Lamp fault'), 2200);

    later(() => {
      typeNotes(NOTES, () => {
        later(() => {
          attachPhoto();
          later(() => {
            if (saveFailBtn) saveFailBtn.classList.add('is-pulse');
            later(() => {
              if (saveFailBtn) saveFailBtn.classList.remove('is-pulse');
              completeFailFromSheet();
              later(() => onDone?.(), 2200);
            }, 1000);
          }, 700);
        }, 550);
      });
    }, 2900);
  }

  function runSitesTimeline(onDone) {
    setScreen('sites', { animate: false });
    setHeader('Beacon', 'brand');
    setConsoleFocus(false);
    if (riversideBtn) riversideBtn.classList.remove('is-active', 'is-press');
    if (sitesScroll) sitesScroll.scrollTop = 0;

    if (REDUCE_MQ.matches) {
      if (riversideBtn) riversideBtn.classList.add('is-active');
      onDone?.();
      return;
    }

    // Browse down through the list first, then settle back up on Riverside
    later(() => {
      if (!sitesScroll) return;
      const maxTop = Math.max(0, sitesScroll.scrollHeight - sitesScroll.clientHeight);
      sitesScroll.scrollTo({ top: Math.min(maxTop, 190), behavior: 'smooth' });
    }, 320);

    later(() => {
      if (!sitesScroll || !riversideBtn) {
        onDone?.();
        return;
      }
      const top =
        riversideBtn.offsetTop - sitesScroll.clientHeight / 2 + riversideBtn.clientHeight / 2;
      sitesScroll.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 1150);

    later(() => {
      if (riversideBtn) riversideBtn.classList.add('is-active');
    }, 1550);

    later(() => {
      if (riversideBtn) riversideBtn.classList.add('is-press');
    }, 2100);

    later(() => {
      if (riversideBtn) riversideBtn.classList.remove('is-press');
      onDone?.();
    }, 2500);
  }

  function runStepTimeline(index) {
    clearTimers();
    const reduced = REDUCE_MQ.matches;

    if (index === 0) {
      resetChrome();
      runSitesTimeline(() => scheduleAdvance(900));
      return;
    }

    if (index === 1) {
      // Coming from sites — animate into Overview, then tap Test
      setConsoleFocus(false);
      setDefectsOpen(false);
      resetChecklist();
      resetFailSheet();
      setScreen('overview', { animate: true });
      setHeader('Riverside Court', 'site');
      later(() => {
        if (syncIcon) syncIcon.classList.add('is-spot');
      }, reduced ? 0 : 450);
      later(() => {
        if (syncIcon) syncIcon.classList.remove('is-spot');
        if (testNav) testNav.classList.add('is-press');
      }, reduced ? 0 : 1800);
      later(() => {
        if (testNav) testNav.classList.remove('is-press');
        scheduleAdvance(350);
      }, reduced ? 0 : 2300);
      return;
    }

    if (index === 2) {
      // Overview → Test with crossfade, then pass/pass/fail
      setConsoleFocus(false);
      setDefectsOpen(false);
      resetChecklist();
      resetFailSheet();
      showToast(false);
      setHeader('Riverside Court', 'site');
      if (testNav) {
        testNav.classList.add('is-active');
        navItems.overview?.classList.remove('is-active');
      }
      setScreen('test', { animate: true });
      later(() => {
        passFitting('el012', () => {
          later(() => {
            passFitting('el024', () => {
              later(() => runFailAutofill(() => completeTestThenAdvance()), reduced ? 0 : 450);
            });
          }, reduced ? 0 : 400);
        });
      }, reduced ? 0 : 500);
      return;
    }

    if (index === 3) {
      // Stay visually continuous: leave Test → Overview, then defect lands
      setConsoleFocus(false);
      setRowPassed('el012', true);
      setRowPassed('el024', true);
      setEl018Failed(true);
      setDefectsOpen(false);
      setHeader('Riverside Court', 'site');
      setScreen('overview', { animate: true });
      later(() => {
        setDefectsOpen(true);
        if (defects) defects.classList.add('is-spot');
        scheduleAdvance(4800);
      }, reduced ? 0 : 1100);
      return;
    }

    if (index === 4) {
      setRowPassed('el012', true);
      setRowPassed('el024', true);
      setEl018Failed(true);
      setDefectsOpen(true);
      setScreen('overview', { animate: false });
      setHeader('Riverside Court', 'site');
      later(() => {
        setConsoleFocus(true);
        later(() => {
          if (codaSummary) codaSummary.classList.add('is-pulse');
          if (codaRow) codaRow.classList.add('is-spotlight');
        }, 400);
        later(() => {
          if (codaSummary) codaSummary.classList.remove('is-pulse');
          scheduleAdvance(0);
        }, 5200);
      }, reduced ? 0 : 300);
      return;
    }

    scheduleAdvance(2000);
  }

  function goTo(index) {
    const last = stepCount() - 1;
    stepIndex = Math.max(0, Math.min(last, index));
    clearTimers();
    root.dataset.step = String(stepIndex + 1);
    updateCopy();
    updateControls();
    hasStarted = true;

    if (REDUCE_MQ.matches) {
      applyEndState(stepIndex);
      if (autoplayActive) finishAutoplay();
      return;
    }

    runStepTimeline(stepIndex);
  }

  function userGoTo(index) {
    stopAutoplay();
    autoplayFinished = true;
    goTo(index);
  }

  function onViewportChange() {
    const last = stepCount() - 1;
    buildSteps();
    updateCopy();
    updateControls();
    if (stepIndex > last) {
      stopAutoplay();
      goTo(last);
    }
  }

  function openFailInteractive() {
    if (stepIndex !== 2 || failComplete) return;
    trackDemo('demo_fail_tap');
    stopAutoplay();
    autoplayFinished = true;
    updateControls();
    setFailSheetOpen(true);
    if (rows.el018.failBtn) rows.el018.failBtn.classList.remove('is-pulse');
    if (reasonOptions) reasonOptions.hidden = false;
  }

  function saveFailInteractive() {
    if (stepIndex !== 2 || saveFailBtn?.disabled) return;
    trackDemo('demo_fail_save');
    stopAutoplay();
    autoplayFinished = true;
    completeFailFromSheet();
    updateControls();
  }

  prevBtn?.addEventListener('click', () => {
    trackDemo('demo_prev');
    userGoTo(stepIndex - 1);
  });

  nextBtn?.addEventListener('click', () => {
    trackDemo('demo_next');
    userGoTo(stepIndex + 1);
  });

  replayBtn?.addEventListener('click', () => {
    trackDemo('demo_replay');
    completedTracked = false;
    autoplayFinished = false;
    autoplayActive = !REDUCE_MQ.matches;
    updateCopy();
    goTo(0);
  });

  riversideBtn?.addEventListener('click', () => {
    if (stepIndex !== 0) return;
    trackDemo('demo_site_open');
    stopAutoplay();
    autoplayFinished = true;
    userGoTo(1);
  });

  rows.el012.passBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (stepIndex !== 2 || passed012) return;
    stopAutoplay();
    autoplayFinished = true;
    passFitting('el012');
    updateControls();
  });

  rows.el024.passBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (stepIndex !== 2 || passed024) return;
    stopAutoplay();
    autoplayFinished = true;
    passFitting('el024');
    updateControls();
  });

  rows.el018.failBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openFailInteractive();
  });

  rows.el018.passBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    stopAutoplay();
    autoplayFinished = true;
    updateControls();
    if (rows.el018.failBtn) rows.el018.failBtn.classList.add('is-pulse');
  });

  reasonSelect?.addEventListener('click', () => {
    if (stepIndex !== 2 || !failSheet?.classList.contains('is-open')) return;
    stopAutoplay();
    autoplayFinished = true;
    updateControls();
    if (reasonOptions) reasonOptions.hidden = !reasonOptions.hidden;
  });

  reasonButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (stepIndex !== 2) return;
      stopAutoplay();
      autoplayFinished = true;
      updateControls();
      selectReason(btn.getAttribute('data-reason'));
      if (notesText && !notesText.textContent) {
        typeNotes(NOTES, () => {
          if (!photo?.classList.contains('is-ready')) attachPhoto();
        });
      } else if (!photo?.classList.contains('is-ready')) {
        attachPhoto();
      }
    });
  });

  photo?.addEventListener('click', () => {
    if (stepIndex !== 2 || !failSheet?.classList.contains('is-open')) return;
    stopAutoplay();
    autoplayFinished = true;
    updateControls();
    attachPhoto();
  });

  saveFailBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    saveFailInteractive();
  });

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      const nowInView = !!(entry && entry.isIntersecting && entry.intersectionRatio > 0.15);
      if (!nowInView) {
        inView = false;
        clearTimers();
        return;
      }
      inView = true;
      if (!hasStarted) {
        goTo(0);
        return;
      }
      if (autoplayActive && !REDUCE_MQ.matches) {
        runStepTimeline(stepIndex);
      }
    },
    { threshold: [0, 0.15, 0.4] }
  );
  io.observe(root);

  DESKTOP_MQ.addEventListener('change', onViewportChange);
  REDUCE_MQ.addEventListener('change', () => {
    if (REDUCE_MQ.matches) {
      autoplayActive = false;
      clearTimers();
      applyEndState(stepIndex);
      updateCopy();
      updateControls();
    }
  });

  buildSteps();
  updateCopy();
  updateControls();
  if (REDUCE_MQ.matches) {
    autoplayActive = false;
    applyEndState(0);
    hasStarted = true;
    updateCopy();
  }
})();
