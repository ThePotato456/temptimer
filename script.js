const toastTemplate = document.getElementById('toastTemplate');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((part) => String(part).padStart(2, '0'))
      .join(' : ');
  }

  return [minutes, seconds].map((part) => String(part).padStart(2, '0')).join(' : ');
}

function createToast(message, { variant = 'default', timeout = 2500 } = {}) {
  const existingContainer = document.querySelector('.toast-container');
  const container = existingContainer || document.createElement('div');
  container.className = 'toast-container';

  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  if (variant === 'error') {
    toast.classList.add('toast--error');
  }

  container.appendChild(toast);
  document.body.appendChild(container);

  setTimeout(() => {
    toast.classList.add('toast--hide');
    toast.addEventListener(
      'animationend',
      () => {
        toast.remove();
        if (!container.children.length) {
          container.remove();
        }
      },
      { once: true }
    );
  }, timeout);
}

function createTicker(callback) {
  let isRunning = false;
  let lastTick = null;
  let rafId = null;

  function tick() {
    if (!isRunning) {
      return;
    }

    const now = Date.now();
    const delta = now - lastTick;
    lastTick = now;
    callback(delta);
    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (isRunning) return;
      isRunning = true;
      lastTick = Date.now();
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      if (!isRunning) return;
      isRunning = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}

function createCountdownTimer({ display, minuteInput, secondInput, completionMessage }) {
  let duration = 0;
  let remaining = 0;
  let inputsLocked = false;

  function sanitizeInputs() {
    const minutes = clamp(Number.parseInt(minuteInput.value, 10) || 0, 0, 599);
    const seconds = clamp(Number.parseInt(secondInput.value, 10) || 0, 0, 59);

    minuteInput.value = minutes;
    secondInput.value = seconds;

    return (minutes * 60 + seconds) * 1000;
  }

  function updateDisplay() {
    display.textContent = formatTime(remaining);
  }

  function syncFromInputs() {
    duration = sanitizeInputs();
    remaining = duration;
    updateDisplay();
  }

  function onInputChange() {
    if (inputsLocked) return;
    syncFromInputs();
  }

  minuteInput.addEventListener('input', onInputChange);
  secondInput.addEventListener('input', onInputChange);
  minuteInput.addEventListener('change', onInputChange);
  secondInput.addEventListener('change', onInputChange);

  syncFromInputs();

  return {
    captureDuration() {
      syncFromInputs();
      return duration;
    },
    tick(delta) {
      if (remaining <= 0) {
        return true;
      }

      remaining = Math.max(0, remaining - delta);
      updateDisplay();
      return remaining === 0;
    },
    resetToInputs() {
      syncFromInputs();
    },
    lockInputs(locked) {
      inputsLocked = locked;
      minuteInput.disabled = locked;
      secondInput.disabled = locked;
    },
    get duration() {
      return duration;
    },
    completionMessage,
  };
}

const heatTimer = createCountdownTimer({
  display: document.getElementById('heatDisplay'),
  minuteInput: document.getElementById('heatMinutes'),
  secondInput: document.getElementById('heatSeconds'),
  completionMessage: 'Heat up complete! Starting cool down.',
});

const coolTimer = createCountdownTimer({
  display: document.getElementById('coolDisplay'),
  minuteInput: document.getElementById('coolMinutes'),
  secondInput: document.getElementById('coolSeconds'),
  completionMessage: 'Cool down complete! All done.',
});

const timers = [heatTimer, coolTimer];
const sequenceToggle = document.getElementById('sequenceToggle');

const ticker = createTicker(handleTick);
let activeTimerIndex = null;
let running = false;

function handleTick(delta) {
  if (activeTimerIndex === null) {
    return;
  }

  const timer = timers[activeTimerIndex];
  const finished = timer.tick(delta);

  if (!finished) {
    return;
  }

  if (timer.completionMessage) {
    createToast(timer.completionMessage, { timeout: 3000 });
  }

  const nextIndex = timers.findIndex((candidate, index) => {
    if (index <= activeTimerIndex) return false;
    return candidate.duration > 0;
  });

  if (nextIndex === -1) {
    finishSequence();
    return;
  }

  activeTimerIndex = nextIndex;
}

function finishSequence() {
  ticker.stop();
  running = false;
  activeTimerIndex = null;
  timers.forEach((timer) => timer.lockInputs(false));
  updateToggleButton();
}

function initializeSequence() {
  let hasDuration = false;
  timers.forEach((timer) => {
    const duration = timer.captureDuration();
    if (duration > 0) {
      hasDuration = true;
    }
  });

  if (!hasDuration) {
    createToast('Set a duration for at least one timer.', { variant: 'error' });
    return false;
  }

  activeTimerIndex = timers.findIndex((timer) => timer.duration > 0);
  timers.forEach((timer) => timer.lockInputs(true));
  return true;
}

function startSequence() {
  const initialized = initializeSequence();
  if (!initialized) {
    return;
  }

  running = true;
  updateToggleButton();
  ticker.start();
}

function stopSequence() {
  ticker.stop();
  running = false;
  activeTimerIndex = null;
  timers.forEach((timer) => {
    timer.lockInputs(false);
    timer.resetToInputs();
  });
  updateToggleButton();
}

function updateToggleButton() {
  if (running) {
    sequenceToggle.textContent = 'Stop';
    sequenceToggle.classList.add('button--running');
  } else {
    sequenceToggle.textContent = 'Start';
    sequenceToggle.classList.remove('button--running');
  }
}

sequenceToggle.addEventListener('click', () => {
  if (running) {
    stopSequence();
  } else {
    startSequence();
  }
});

updateToggleButton();
