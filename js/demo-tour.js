/**
 * Field-led homepage demo — simplified real Field flow.
 * Autoplays once on first view; manual Back/Next always runs step animations.
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

  const screenEls = {
    overview: root.querySelector('[data-demo-screen="overview"]'),
    test: root.querySelector('[data-demo-screen="test"]'),
    console: root.querySelector('[data-demo-screen="console"]'),
  };

  const navItems = {
    overview: root.querySelector('[data-nav="overview"]'),
    test: root.querySelector('[data-nav="test"]'),
  };

  const el018 = root.querySelector('[data-demo-row="el018"]');
  const el018Badge = root.querySelector('[data-demo-el018-badge]');
  const el018Fault = root.querySelector('[data-demo-el018-fault]');
  const el018Change = root.querySelector('[data-demo-el018-change]');
  const el018Actions = root.querySelector('[data-demo-actions]');
  const failBtn = root.querySelector('[data-demo-fail]');
  const passBtn = root.querySelector('[data-demo-pass]');
  const defects = root.querySelector('[data-demo-defects]');
  const defectTitle = root.querySelector('[data-demo-defect-title]');
  const defectNew = root.querySelector('[data-demo-defect-new]');
  const snapDefects = root.querySelector('[data-demo-snap-defects]');
  const syncIcon = root.querySelector('[data-demo-sync]');
  const codaRow = root.querySelector('[data-demo-coda-row]');
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
      title: 'Open Riverside Court',
      narration:
        'Overview is the site home — status for the period, and any open defects still on the register.',
      tip: 'the sync icon — green when the site is up to date',
      screen: 'overview',
      spot: 'sync',
    },
    {
      title: 'Fail EL-018 on Test',
      narration:
        'On Test, each fitting has PASS and FAIL. Fail opens Log failure — reason, optional notes, and a defect photo.',
      tip: 'PASS / FAIL on the fitting row — same as in Field',
      screen: 'test',
      spot: 'fail',
    },
    {
      title: 'Defect stays on the site',
      narration:
        'After you save, the fail is on the checklist — and Open defects on Overview keeps it until it’s cleared.',
      tip: 'Open defects — the new EL-018 row on the register',
      screen: 'overview',
      spot: 'defects',
    },
    {
      title: 'Office sees it',
      narration:
        'Same site in Console — needs attention shows up for the office, without a photo of a paper checklist.',
      tip: 'Console Sites list — Riverside Court needs attention',
      screen: 'console',
      spot: null,
    },
  ];

  let stepIndex = 0;
  /** One-shot guided play; false after finish or any user control click. */
  let autoplayActive = !REDUCE_MQ.matches;
  let autoplayFinished = false;
  let inView = true;
  let hasStarted = false;
  let timers = [];
  let completedTracked = false;
  let failComplete = false;
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
    return desktopCodaEnabled() ? 4 : 3;
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

  function setScreen(name) {
    root.dataset.screen = name;
    Object.entries(screenEls).forEach(([key, el]) => {
      if (el) el.hidden = key !== name;
    });
    Object.entries(navItems).forEach(([key, el]) => {
      if (el) el.classList.toggle('is-active', key === name);
    });
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
    const hasPhoto = photo?.classList.contains('is-ready');
    saveFailBtn.disabled = !(selectedReason && hasPhoto);
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
      later(tick, 48);
    };
    later(tick, 80);
  }

  function setEl018Failed(failed) {
    failComplete = failed;
    if (el018) {
      el018.classList.toggle('is-fail', failed);
      el018.classList.toggle('is-pending', !failed);
      el018.classList.toggle('is-active', !failed && stepIndex === 1);
    }
    if (el018Actions) el018Actions.hidden = failed;
    if (el018Badge) el018Badge.hidden = !failed;
    if (el018Fault) el018Fault.hidden = !failed;
    if (el018Change) el018Change.hidden = !failed;
    if (failBtn) failBtn.classList.remove('is-pulse');

    if (failed) {
      if (progressLabel) progressLabel.textContent = '3/3 tested';
      if (progressPct) progressPct.textContent = '100%';
      if (progressBar) progressBar.style.width = '100%';
      if (groupCount) groupCount.textContent = '3/3 tested';
    } else {
      if (progressLabel) progressLabel.textContent = '2/3 tested';
      if (progressPct) progressPct.textContent = '67%';
      if (progressBar) progressBar.style.width = '67%';
      if (groupCount) groupCount.textContent = '2/3 tested';
    }
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
    if (defects) defects.classList.toggle('is-spot', open && stepIndex === 2);
  }

  function clearSpots() {
    if (syncIcon) syncIcon.classList.remove('is-spot');
    if (defects) defects.classList.remove('is-spot');
    if (failBtn) failBtn.classList.remove('is-pulse');
  }

  function applySpot(spot) {
    clearSpots();
    if (spot === 'sync' && syncIcon) syncIcon.classList.add('is-spot');
    if (spot === 'fail' && failBtn && !failComplete) failBtn.classList.add('is-pulse');
    if (spot === 'defects' && defects) defects.classList.add('is-spot');
  }

  function resetChrome() {
    resetFailSheet();
    setEl018Failed(false);
    setDefectsOpen(false);
    clearSpots();
    showToast(false);
    if (codaRow) codaRow.classList.remove('is-pulse');
  }

  function applyEndState(index) {
    resetChrome();
    const step = STEPS[index];
    setScreen(step.screen);
    applySpot(step.spot);

    if (index >= 1) setEl018Failed(true);
    if (index >= 2) setDefectsOpen(true);
    if (index === 1) clearSpots();
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
    if (el018) el018.classList.remove('is-active');
    showToast(true);
    later(() => showToast(false), 2200);
  }

  function runFailAutofill(onDone) {
    setScreen('test');
    setEl018Failed(false);
    resetFailSheet();
    if (el018) el018.classList.add('is-active');
    if (failBtn) failBtn.classList.add('is-pulse');

    if (REDUCE_MQ.matches) {
      selectReason('Lamp fault');
      if (notesText) notesText.textContent = NOTES;
      if (notesPh) notesPh.hidden = true;
      attachPhoto();
      completeFailFromSheet();
      onDone?.();
      return;
    }

    // Let people notice FAIL before the sheet opens
    later(() => {
      if (failBtn) failBtn.classList.remove('is-pulse');
      setFailSheetOpen(true);
      if (reasonOptions) reasonOptions.hidden = false;
    }, 1600);

    // Pause on the open sheet, then pick a reason
    later(() => selectReason('Lamp fault'), 2800);

    // Brief beat after reason, then type notes slowly
    later(() => {
      typeNotes(NOTES, () => {
        later(() => {
          attachPhoto();
          later(() => {
            if (saveFailBtn) saveFailBtn.classList.add('is-pulse');
            later(() => {
              if (saveFailBtn) saveFailBtn.classList.remove('is-pulse');
              completeFailFromSheet();
              // Hold on the failed row + toast before leaving
              later(() => onDone?.(), 2800);
            }, 1200);
          }, 900);
        }, 700);
      });
    }, 3600);
  }

  function runStepTimeline(index) {
    clearTimers();
    const reduced = REDUCE_MQ.matches;

    if (index === 0) {
      applyEndState(0);
      // First look at Overview — enough time to read status + tip
      scheduleAdvance(6500);
      return;
    }

    if (index === 1) {
      runFailAutofill(() => scheduleAdvance(2000));
      return;
    }

    if (index === 2) {
      resetChrome();
      setEl018Failed(true);
      setScreen('overview');
      applySpot(null);
      later(() => {
        setDefectsOpen(true);
        if (defects) defects.classList.add('is-spot');
        // Give time to notice the new defect row
        scheduleAdvance(4800);
      }, reduced ? 0 : 900);
      return;
    }

    if (index === 3) {
      resetChrome();
      setEl018Failed(true);
      setDefectsOpen(true);
      setScreen('console');
      later(() => {
        if (codaRow) codaRow.classList.add('is-pulse');
      }, reduced ? 0 : 600);
      later(() => {
        if (codaRow) codaRow.classList.remove('is-pulse');
        scheduleAdvance(0);
      }, reduced ? 0 : 5200);
      return;
    }

    scheduleAdvance(3000);
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
    if (stepIndex !== 1 || failComplete) return;
    trackDemo('demo_fail_tap');
    stopAutoplay();
    autoplayFinished = true;
    updateControls();
    setFailSheetOpen(true);
    if (failBtn) failBtn.classList.remove('is-pulse');
    if (reasonOptions) reasonOptions.hidden = false;
  }

  function saveFailInteractive() {
    if (stepIndex !== 1 || saveFailBtn?.disabled) return;
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

  failBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openFailInteractive();
  });

  passBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    stopAutoplay();
    autoplayFinished = true;
    updateControls();
    if (failBtn) failBtn.classList.add('is-pulse');
  });

  reasonSelect?.addEventListener('click', () => {
    if (stepIndex !== 1 || !failSheet?.classList.contains('is-open')) return;
    stopAutoplay();
    autoplayFinished = true;
    updateControls();
    if (reasonOptions) reasonOptions.hidden = !reasonOptions.hidden;
  });

  reasonButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (stepIndex !== 1) return;
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
    if (stepIndex !== 1 || !failSheet?.classList.contains('is-open')) return;
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
