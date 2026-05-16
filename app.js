const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const display = document.getElementById("display");
const progressBar = document.getElementById("progressBar");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const timerCard = document.getElementById("timerCard");
const timeInputs = document.getElementById("timeInputs");
const statusEl = document.getElementById("status");

let totalMs = 0;
let remainingMs = 0;
let intervalId = null;
let lastTick = 0;
let state = "idle"; // idle | running | paused | finished

function clampInput(input, max) {
  let v = parseInt(input.value, 10);
  if (Number.isNaN(v) || v < 0) v = 0;
  if (v > max) v = max;
  input.value = String(v);
  return v;
}

function getInputTotalMs() {
  const h = clampInput(hoursInput, 99);
  const m = clampInput(minutesInput, 59);
  const s = clampInput(secondsInput, 59);
  return (h * 3600 + m * 60 + s) * 1000;
}

function formatTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function updateDisplay() {
  display.textContent = formatTime(remainingMs);
  const ratio = totalMs > 0 ? remainingMs / totalMs : 0;
  progressBar.style.transform = `scaleX(${ratio})`;

  display.classList.toggle("urgent", state === "running" && remainingMs <= 10000 && remainingMs > 0);
}

function setInputsDisabled(disabled) {
  hoursInput.disabled = disabled;
  minutesInput.disabled = disabled;
  secondsInput.disabled = disabled;
}

function setState(next) {
  state = next;
  timerCard.classList.toggle("running", state === "running");
  timerCard.classList.toggle("finished", state === "finished");

  const runningOrPaused = state === "running" || state === "paused";

  setInputsDisabled(runningOrPaused || state === "finished");
  startBtn.disabled = state === "running";
  pauseBtn.disabled = !runningOrPaused;
  resetBtn.disabled = false;

  if (state === "idle") {
    startBtn.textContent = "开始";
    pauseBtn.textContent = "暂停";
    statusEl.textContent = "";
    statusEl.classList.remove("done");
  } else if (state === "running") {
    startBtn.textContent = "开始";
    pauseBtn.textContent = "暂停";
    statusEl.textContent = "倒计时进行中…";
    statusEl.classList.remove("done");
  } else if (state === "paused") {
    startBtn.textContent = "继续";
    startBtn.disabled = false;
    pauseBtn.textContent = "暂停";
    statusEl.textContent = "已暂停";
    statusEl.classList.remove("done");
  } else if (state === "finished") {
    startBtn.textContent = "再来一次";
    startBtn.disabled = false;
    pauseBtn.textContent = "暂停";
    statusEl.textContent = "时间到！";
    statusEl.classList.add("done");
  }
}

function syncInputsFromMs(ms) {
  const totalSec = Math.ceil(ms / 1000);
  hoursInput.value = String(Math.floor(totalSec / 3600));
  minutesInput.value = String(Math.floor((totalSec % 3600) / 60));
  secondsInput.value = String(totalSec % 60);
}

function tick(now) {
  if (!lastTick) {
    lastTick = now;
    intervalId = requestAnimationFrame(tick);
    return;
  }

  const delta = now - lastTick;
  lastTick = now;

  remainingMs = Math.max(0, remainingMs - delta);
  updateDisplay();

  if (remainingMs <= 0) {
    stopInterval();
    onFinish();
    return;
  }

  intervalId = requestAnimationFrame(tick);
}

function stopInterval() {
  if (intervalId) {
    cancelAnimationFrame(intervalId);
    intervalId = null;
  }
  lastTick = 0;
}

function startCountdown() {
  if (state === "paused") {
    setState("running");
    lastTick = 0;
    intervalId = requestAnimationFrame(tick);
    return;
  }

  totalMs = getInputTotalMs();
  if (totalMs <= 0) {
    statusEl.textContent = "请设置大于 0 的时间";
    statusEl.classList.remove("done");
    return;
  }

  remainingMs = totalMs;
  updateDisplay();
  setState("running");
  lastTick = 0;
  intervalId = requestAnimationFrame(tick);
}

function pauseCountdown() {
  if (state !== "running") return;
  stopInterval();
  syncInputsFromMs(remainingMs);
  setState("paused");
}

function resetCountdown() {
  stopInterval();
  window.Fireworks.stop();
  setState("idle");
  totalMs = getInputTotalMs();
  remainingMs = totalMs;
  updateDisplay();
  display.classList.remove("urgent");
}

function onFinish() {
  setState("finished");
  display.textContent = "00:00:00";
  progressBar.style.transform = "scaleX(0)";
  display.classList.remove("urgent");
  window.Fireworks.start();

  setTimeout(() => {
    if (state === "finished") {
      window.Fireworks.stop();
    }
  }, 12000);
}

startBtn.addEventListener("click", () => {
  if (state === "finished") {
    window.Fireworks.stop();
    remainingMs = totalMs;
    syncInputsFromMs(totalMs);
    updateDisplay();
    display.classList.remove("urgent");
    statusEl.classList.remove("done");
    startCountdown();
    return;
  }
  startCountdown();
});

pauseBtn.addEventListener("click", () => {
  if (state === "running") pauseCountdown();
});

resetBtn.addEventListener("click", resetCountdown);

[hoursInput, minutesInput, secondsInput].forEach((input) => {
  input.addEventListener("change", () => {
    if (state === "idle") {
      totalMs = getInputTotalMs();
      remainingMs = totalMs;
      updateDisplay();
    }
  });
});

totalMs = getInputTotalMs();
remainingMs = totalMs;
updateDisplay();
setState("idle");
