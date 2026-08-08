/**
 * Field-led homepage demo stepper.
 * Side narration + fail-sheet autofill + light annotations.
 */
(function () {
  const root = document.querySelector('[data-demo-root]');
  if (!root) return;

  const kickerEl = root.querySelector('[data-demo-kicker]');
  const titleEl = root.querySelector('[data-demo-title]');
  const narrationEl = root.querySelector('[data-demo-narration]');
  const hintEl = root.querySelector('[data-demo-hint]');
  const stepsEl = root.querySelector('[data-demo-steps]');
  const prevBtn = root.querySelector('[data-demo-prev]');
  const nextBtn = root.querySelector('[data-demo-next]');
  const autoplayBtn = root.querySelector('[data-demo-autoplay]');
  const replayBtn = root.querySelector('[data-demo-replay]');

  const screenEls = {
    overview: root.querySelector('[data-demo-screen="overview"]'),
    test: root.querySelector('[data-demo-screen="test"]'),
    report: root.querySelector('[data-demo-screen="report"]'),
  };

  const annotEls = {
    sync: root.querySelector('[data-annot="sync"]'),
    fail: root.querySelector('[data-annot="fail"]'),
    defects: root.querySelector('[data-annot="defects"]'),
    issued: root.querySelector('[data-annot="issued"]'),
  };

  const el018 = root.querySelector('[data-demo-row="el018"]');
  const el018Result = root.querySelector('[data-demo-el018-result]');
  const el018Actions = root.querySelector('[data-demo-actions]');
  const failBtn = root.querySelector('[data-demo-fail]');
  const passBtn = root.querySelector('[data-demo-pass]');
  const tapHint = root.querySelector('[data-demo-tap-hint]');
  const previewEl018 = root.querySelector('[data-demo-preview-el018]');
  const previewResult = root.querySelector('[data-demo-preview-result]');
  const defects = root.querySelector('[data-demo-defects]');
  const defectTitle = root.querySelector('[data-demo-defect-title]');
  const defectSub = root.querySelector('[data-demo-defect-sub]');
  const issued = root.querySelector('[data-demo-issued]');
  const syncIcon = root.querySelector('[data-demo-sync]');
  const coda = root.querySelector('[data-demo-coda]');
  const codaRow = root.querySelector('[data-demo-coda-row]');

  const failSheet = root.querySelector('[data-demo-fail-sheet]');
  const notesText = root.querySelector('[data-demo-notes-text]');
  const caret = root.querySelector('[data-demo-caret]');
  const saveFailBtn = root.querySelector('[data-demo-save-fail]');
  const reasonChips = Array.from(root.querySelectorAll('[data-reason]'));

  const DESKTOP_MQ = window.matchMedia('(min-width: 900px)');
  const REDUCE_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  const NOTES = 'Lamp failed to strike';
  const STEP_HOLD_MS = 2800;

  const STEPS = [
    {
      title: 'Open Riverside Court',
      narration:
        'You’re on site. Status and open defects sit at the top — so you know what you’re walking into before you test.',
      hint: 'Or just watch — autoplay walks through it.',
      screen: 'overview',
      annot: 'sync',
    },
    {
      title: 'Fail EL-018 Plant room',
      narration:
        'Tap Fail on a fitting, pick a fault reason, and save. The defect is logged with the test — not scribbled for later.',
      hint: 'You can tap Fail on the phone, or let autoplay fill it in.',
      screen: 'test',
      annot: 'fail',
    },
    {
      title: 'Defect stays on the site',
      narration:
        'Failed fittings don’t disappear when you leave. They stay on the site record until someone clears them.',
      hint: 'Next shows how that visit becomes paperwork.',
      screen: 'overview',
      annot: 'defects',
    },
    {
      title: 'Issue the visit report',
      narration:
        'When the visit is done, issue the report. Assessment and the fail travel with it — ready for the file.',
      hint: 'This is stylised Field chrome, not a live login.',
      screen: 'report',
      annot: 'issued',
    },
    {
      title: 'Office sees it',
      narration:
        'Back in Console, the same site shows needs attention — so the office isn’t waiting on a WhatsApp photo of a checklist.',
      hint: 'Desktop only for this last beat.',
      screen: 'report',
      annot: null,
    },
  ];

  let stepIndex = 0;
  let autoplayOn = !REDUCE_MQ.matches;
  let playing = false;
  let inView = true;
  let timers = [];
  let completedTracked = false;
  let failComplete = false;
  let typingToken = 0;

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

  function setScreen(name) {
    root.dataset.screen = name;
    Object.entries(screenEls).forEach(([key, el]) => {
      if (!el) return;
      el.hidden = key !== name;
    });
  }

  function setAnnot(name) {
    Object.entries(annotEls).forEach(([key, el]) => {
      if (!el) return;
      el.hidden = key !== name;
    });
  }

  function setFailSheetOpen(open) {
    if (!failSheet) return;
    failSheet.classList.toggle('is-open', open);
    failSheet.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function resetFailSheet() {
    setFailSheetOpen(false);
    reasonChips.forEach((chip) => chip.classList.remove('is-selected'));
    if (notesText) notesText.textContent = '';
    if (caret) caret.hidden = true;
    if (saveFailBtn) {
      saveFailBtn.disabled = true;
      saveFailBtn.classList.remove('is-pulse');
    }
  }

  function selectReason(label) {
    reasonChips.forEach((chip) => {
      chip.classList.toggle('is-selected', chip.getAttribute('data-reason') === label);
    });
    if (saveFailBtn && notesText && notesText.textContent.length > 0) {
      saveFailBtn.disabled = false;
    }
  }

  function typeNotes(text, done) {
    if (!notesText) {
      done?.();
      return;
    }
    const token = ++typingToken;
    notesText.textContent = '';
    if (caret) caret.hidden = false;
    let i = 0;

    const tick = () => {
      if (token !== typingToken) return;
      if (i >= text.length) {
        if (caret) caret.hidden = true;
        if (saveFailBtn) saveFailBtn.disabled = false;
        done?.();
        return;
      }
      notesText.textContent += text[i];
      i += 1;
      later(tick, 28);
    };

    later(tick, 40);
  }

  function setEl018Failed(failed) {
    failComplete = failed;
    if (el018) {
      el018.classList.toggle('is-fail', failed);
      el018.classList.toggle('is-pending', !failed);
      el018.classList.toggle('is-active', !failed && stepIndex === 1);
    }
    if (el018Actions) el018Actions.hidden = failed;
    if (el018Result) el018Result.hidden = !failed;
    if (tapHint) tapHint.hidden = failed;
    if (failBtn) failBtn.classList.remove('is-pulse');

    if (previewEl018) {
      previewEl018.classList.toggle('is-fail', failed);
      previewEl018.classList.toggle('is-pending', !failed);
      previewEl018.classList.toggle('is-pass', false);
    }
    if (previewResult) previewResult.textContent = failed ? 'Fail' : '—';
  }

  function setDefectsOpen(open) {
    if (defectTitle) defectTitle.textContent = open ? 'Open defects (3)' : 'Open defects (2)';
    if (defectSub) {
      defectSub.textContent = open
        ? 'EL-018 Plant room — lamp failed to strike'
        : 'EL-031 still open from last visit';
    }
    if (defects) defects.classList.toggle('is-spot', open && stepIndex === 2);
  }

  function resetChrome() {
    resetFailSheet();
    setEl018Failed(false);
    setDefectsOpen(false);
    if (defects) defects.classList.remove('is-bump', 'is-spot');
    if (syncIcon) syncIcon.classList.remove('is-spot');
    if (issued) issued.classList.remove('is-spot');
    if (coda) coda.setAttribute('aria-hidden', 'true');
    if (codaRow) codaRow.classList.remove('is-pulse');
  }

  function applyEndState(index) {
    resetChrome();
    const step = STEPS[index];
    setScreen(step.screen);
    setAnnot(step.annot);

    if (index >= 1) setEl018Failed(true);
    if (index >= 2) setDefectsOpen(true);

    if (index === 0 && syncIcon) syncIcon.classList.add('is-spot');
    if (index === 2 && defects) defects.classList.add('is-spot');
    if (index === 3 && issued) issued.classList.add('is-spot');

    if (index >= 4 && desktopCodaEnabled()) {
      if (coda) coda.setAttribute('aria-hidden', 'false');
    }
  }

  function updateCopy() {
    const total = stepCount();
    const step = STEPS[stepIndex];
    if (kickerEl) kickerEl.textContent = `Step ${stepIndex + 1} of ${total}`;
    if (titleEl) titleEl.textContent = step.title;
    if (narrationEl) narrationEl.textContent = step.narration;
    if (hintEl) hintEl.textContent = step.hint;
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
        goTo(i, { instant: true });
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
    if (replayBtn) replayBtn.hidden = stepIndex < last;
    if (autoplayBtn) {
      autoplayBtn.setAttribute('aria-pressed', autoplayOn ? 'true' : 'false');
      autoplayBtn.textContent = autoplayOn ? 'Autoplay on' : 'Autoplay off';
      autoplayBtn.disabled = REDUCE_MQ.matches;
    }
    if (stepsEl) {
      stepsEl.querySelectorAll('.demo-tour__step').forEach((btn, i) => {
        btn.setAttribute('aria-current', i === stepIndex ? 'step' : 'false');
      });
    }
  }

  function canAutoplay() {
    return autoplayOn && playing && inView && !REDUCE_MQ.matches;
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

  function completeFailFromSheet() {
    setFailSheetOpen(false);
    setEl018Failed(true);
    if (el018) el018.classList.remove('is-active');
  }

  function runFailAutofill(onDone) {
    setScreen('test');
    setAnnot('fail');
    setEl018Failed(false);
    resetFailSheet();
    if (el018) el018.classList.add('is-active');
    if (failBtn) failBtn.classList.add('is-pulse');

    if (REDUCE_MQ.matches) {
      selectReason('Lamp fault');
      if (notesText) notesText.textContent = NOTES;
      if (saveFailBtn) saveFailBtn.disabled = false;
      completeFailFromSheet();
      onDone?.();
      return;
    }

    later(() => {
      if (failBtn) failBtn.classList.remove('is-pulse');
      setFailSheetOpen(true);
    }, 900);

    later(() => {
      selectReason('Lamp fault');
    }, 1500);

    later(() => {
      typeNotes(NOTES, () => {
        if (saveFailBtn) saveFailBtn.classList.add('is-pulse');
        later(() => {
          if (saveFailBtn) saveFailBtn.classList.remove('is-pulse');
          completeFailFromSheet();
          onDone?.();
        }, 900);
      });
    }, 1900);
  }

  function runStepTimeline(index) {
    clearTimers();
    const reduced = REDUCE_MQ.matches;

    if (index === 0) {
      applyEndState(0);
      if (syncIcon && !reduced) {
        later(() => syncIcon.classList.add('is-spot'), 300);
      }
      scheduleAdvance(4200);
      return;
    }

    if (index === 1) {
      runFailAutofill(() => scheduleAdvance(2200));
      return;
    }

    if (index === 2) {
      applyEndState(1);
      setScreen('overview');
      setAnnot('defects');
      later(() => {
        setDefectsOpen(true);
        if (defects) defects.classList.add('is-bump');
      }, reduced ? 0 : 400);
      later(() => {
        if (defects) {
          defects.classList.remove('is-bump');
          defects.classList.add('is-spot');
        }
        scheduleAdvance(2400);
      }, reduced ? 0 : 1600);
      return;
    }

    if (index === 3) {
      applyEndState(2);
      setScreen('report');
      setAnnot('issued');
      later(() => {
        if (issued) issued.classList.add('is-spot');
        scheduleAdvance(2600);
      }, reduced ? 0 : 450);
      return;
    }

    if (index === 4) {
      applyEndState(3);
      setScreen('report');
      setAnnot(null);
      if (coda) coda.setAttribute('aria-hidden', 'false');
      later(() => {
        if (codaRow) codaRow.classList.add('is-pulse');
      }, reduced ? 0 : 400);
      later(() => {
        if (codaRow) codaRow.classList.remove('is-pulse');
        scheduleAdvance(0);
      }, reduced ? 0 : 2400);
      return;
    }

    scheduleAdvance();
  }

  function goTo(index, opts = {}) {
    const last = stepCount() - 1;
    stepIndex = Math.max(0, Math.min(last, index));
    clearTimers();
    root.dataset.step = String(stepIndex + 1);
    updateCopy();
    updateControls();

    if (opts.instant || REDUCE_MQ.matches) {
      applyEndState(stepIndex);
      if (stepIndex >= last && opts.fromAutoplay) {
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
    buildSteps();
    updateCopy();
    updateControls();
    if (stepIndex > last || (stepIndex === 4 && !desktopCodaEnabled())) {
      goTo(Math.min(stepIndex, last), { instant: true });
    }
  }

  function openFailInteractive() {
    if (stepIndex !== 1 || failComplete) return;
    trackDemo('demo_fail_tap');
    clearTimers();
    playing = false;
    setFailSheetOpen(true);
    if (failBtn) failBtn.classList.remove('is-pulse');
    later(() => selectReason('Lamp fault'), REDUCE_MQ.matches ? 0 : 250);
    later(() => {
      typeNotes(NOTES, () => {
        if (saveFailBtn) {
          saveFailBtn.disabled = false;
          saveFailBtn.classList.add('is-pulse');
        }
      });
    }, REDUCE_MQ.matches ? 0 : 500);
  }

  function saveFailInteractive() {
    if (stepIndex !== 1) return;
    trackDemo('demo_fail_save');
    clearTimers();
    completeFailFromSheet();
    playing = autoplayOn && inView;
    if (canAutoplay()) scheduleAdvance(1600);
    else updateControls();
  }

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
      if (stepIndex === 1 && !failComplete) runFailAutofill(() => scheduleAdvance(2200));
      else {
        applyEndState(stepIndex);
        scheduleAdvance(STEP_HOLD_MS);
      }
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

  failBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openFailInteractive();
  });

  passBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    // Pass is decorative in the demo — nudge toward Fail
    if (failBtn) failBtn.classList.add('is-pulse');
  });

  saveFailBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (saveFailBtn.disabled) return;
    saveFailInteractive();
  });

  reasonChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      if (stepIndex !== 1) return;
      selectReason(chip.getAttribute('data-reason'));
      if (notesText && !notesText.textContent) {
        typeNotes(NOTES, () => {
          if (saveFailBtn) saveFailBtn.disabled = false;
        });
      } else if (saveFailBtn) {
        saveFailBtn.disabled = false;
      }
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      inView = !!(entry && entry.isIntersecting && entry.intersectionRatio > 0.15);
      if (!inView) {
        clearTimers();
      } else if (autoplayOn && !REDUCE_MQ.matches) {
        playing = true;
        if (stepIndex === 1 && !failComplete) {
          runFailAutofill(() => scheduleAdvance(2200));
        } else {
          applyEndState(stepIndex);
          scheduleAdvance(STEP_HOLD_MS);
        }
      }
    },
    { threshold: [0, 0.15, 0.4] }
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

  if (REDUCE_MQ.matches) {
    autoplayOn = false;
    playing = false;
  } else {
    playing = true;
  }

  buildSteps();
  goTo(0, { instant: REDUCE_MQ.matches });
})();
