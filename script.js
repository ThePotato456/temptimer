const display = document.getElementById('timeDisplay');
const startStopButton = document.getElementById('startStopButton');
const resetButton = document.getElementById('resetButton');
const directionButton = document.getElementById('directionButton');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const modeLabel = document.getElementById('modeLabel');
const toastTemplate = document.getElementById('toastTemplate');

let isRunning = false;
let timerId = null;
let direction = 'up'; // 'up' or 'down'
let baseElapsed = 0; // milliseconds already elapsed before current run
let lastTick = null;
let countdownCompleted = false;

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

function getCountdownStartMs() {
  const minutes = clamp(Number.parseInt(minutesInput.value, 10) || 0, 0, 599);
  const seconds = clamp(Number.parseInt(secondsInput.value, 10) || 0, 0, 59);
  return (minutes * 60 + seconds) * 1000;
}

function setCountdownInputs(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  minutesInput.value = minutes;
  secondsInput.value = seconds;
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

function updateDisplay() {
  if (direction === 'up') {
    display.textContent = formatTime(baseElapsed);
    return;
  }

  const remaining = Math.max(0, getCountdownStartMs() - baseElapsed);
  display.textContent = formatTime(remaining);
}

function tick() {
  if (!isRunning) return;
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;
  baseElapsed += delta;

  if (direction === 'down') {
    const remaining = getCountdownStartMs() - baseElapsed;
    if (remaining <= 0) {
      baseElapsed = getCountdownStartMs();
      countdownCompleted = true;
      stopTimer();
      display.textContent = '00 : 00';
      createToast("Time's up!", { variant: 'default', timeout: 3000 });
      return;
    }
  }

  updateDisplay();
}

function startTimer() {
  if (direction === 'down') {
    const countdownMs = getCountdownStartMs();
    if (countdownMs === 0) {
      createToast('Set a countdown duration first.', { variant: 'error' });
      return;
    }

    if (countdownCompleted || baseElapsed >= countdownMs) {
      baseElapsed = 0;
      countdownCompleted = false;
      updateDisplay();
    }
  }

  if (isRunning) return;
  isRunning = true;
  startStopButton.textContent = 'Pause';
  startStopButton.classList.add('button--running');
  lastTick = Date.now();
  timerId = setInterval(tick, 200);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  if (isRunning) {
    isRunning = false;
  }

  startStopButton.textContent = 'Start';
  startStopButton.classList.remove('button--running');
}

function toggleDirection() {
  const countdownMs = getCountdownStartMs();
  const wasRunning = isRunning;
  stopTimer();

  if (direction === 'up') {
    direction = 'down';
    modeLabel.textContent = 'Counting down';
    directionButton.textContent = 'Switch to Count Up';
    directionButton.setAttribute('aria-pressed', 'true');
    baseElapsed = 0;
    countdownCompleted = false;
    display.textContent = formatTime(countdownMs);
  } else {
    direction = 'up';
    modeLabel.textContent = 'Counting up';
    directionButton.textContent = 'Switch to Countdown';
    directionButton.setAttribute('aria-pressed', 'false');
    countdownCompleted = false;
    display.textContent = formatTime(baseElapsed);
  }

  if (wasRunning) {
    startTimer();
  }
}

function normalizeInputs() {
  const minutes = clamp(Number.parseInt(minutesInput.value, 10) || 0, 0, 599);
  const seconds = clamp(Number.parseInt(secondsInput.value, 10) || 0, 0, 59);
  const total = minutes * 60 + seconds;
  setCountdownInputs(total * 1000);
  countdownCompleted = false;
  if (direction === 'down' && !isRunning) {
    updateDisplay();
  }
}

startStopButton.addEventListener('click', () => {
  if (isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
});

resetButton.addEventListener('click', () => {
  baseElapsed = 0;
  countdownCompleted = false;
  if (direction === 'down') {
    updateDisplay();
  } else {
    display.textContent = formatTime(0);
  }
  stopTimer();
});

directionButton.addEventListener('click', toggleDirection);

minutesInput.addEventListener('change', normalizeInputs);
secondsInput.addEventListener('change', normalizeInputs);
minutesInput.addEventListener('input', normalizeInputs);
secondsInput.addEventListener('input', normalizeInputs);

// Initialize display
updateDisplay();
