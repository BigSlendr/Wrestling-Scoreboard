const periodOptions = ["1", "2", "3", "OT1", "OT2"];
const maxUndoSteps = 50;
const debounceWindowMs = 150;

const state = {
  mat: 1,
  bout: 101,
  periodIndex: 0,
  leftName: "Red",
  rightName: "Green",
  leftScore: 0,
  rightScore: 0,
  activeSide: "left",
  timerSeconds: 0,
  timerRunning: false,
  log: []
};

const undoStack = [];
let timerInterval = null;
let lastTick = null;
const debounceMap = new Map();

const elements = {
  matNum: document.getElementById("matNum"),
  boutNum: document.getElementById("boutNum"),
  periodValue: document.getElementById("periodValue"),
  timerDisplay: document.getElementById("timerDisplay"),
  leftName: document.getElementById("leftName"),
  rightName: document.getElementById("rightName"),
  leftScore: document.getElementById("leftScore"),
  rightScore: document.getElementById("rightScore"),
  leftSide: document.getElementById("leftSide"),
  rightSide: document.getElementById("rightSide"),
  activeLeft: document.getElementById("activeLeft"),
  activeRight: document.getElementById("activeRight"),
  toggleActive: document.getElementById("toggleActive"),
  log: document.getElementById("log")
};

function loadState() {
  const raw = localStorage.getItem("scoreboardState");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch (error) {
    console.warn("Failed to load saved state", error);
  }
}

function saveState() {
  localStorage.setItem("scoreboardState", JSON.stringify(state));
}

function pushUndoSnapshot() {
  const snapshot = JSON.parse(JSON.stringify(state));
  undoStack.push(snapshot);
  if (undoStack.length > maxUndoSteps) {
    undoStack.shift();
  }
}

function restoreSnapshot(snapshot) {
  Object.assign(state, snapshot);
  render();
  if (state.timerRunning) {
    startTimerInterval();
  } else {
    stopTimerInterval();
  }
  saveState();
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function render() {
  elements.matNum.textContent = state.mat;
  elements.boutNum.textContent = state.bout;
  elements.periodValue.textContent = periodOptions[state.periodIndex];
  elements.leftName.value = state.leftName;
  elements.rightName.value = state.rightName;
  elements.leftScore.textContent = state.leftScore;
  elements.rightScore.textContent = state.rightScore;
  elements.timerDisplay.textContent = formatTime(state.timerSeconds);

  const leftActive = state.activeSide === "left";
  elements.leftSide.classList.toggle("active", leftActive);
  elements.rightSide.classList.toggle("active", !leftActive);
  elements.activeLeft.classList.toggle("muted", !leftActive);
  elements.activeRight.classList.toggle("muted", leftActive);
  elements.toggleActive.textContent = `Scoring: ${leftActive ? state.leftName : state.rightName}`;

  renderLog();
}

function renderLog() {
  elements.log.innerHTML = "";
  if (state.log.length === 0) {
    const empty = document.createElement("div");
    empty.className = "logEntry";
    empty.textContent = "No events yet.";
    elements.log.appendChild(empty);
    return;
  }

  state.log
    .slice()
    .reverse()
    .forEach((entry) => {
      const row = document.createElement("div");
      row.className = "logEntry";
      const deltaText = entry.type === "outcome" ? "" : ` (${entry.delta >= 0 ? "+" : ""}${entry.delta})`;
      row.textContent = `${entry.bout} Period ${entry.period} ${entry.sideName}: ${entry.label}${deltaText} ${entry.displayTime}`;
      elements.log.appendChild(row);
    });
}

function updateName(side, value) {
  pushUndoSnapshot();
  state[`${side}Name`] = value.trim() || (side === "left" ? "Red" : "Green");
  render();
  saveState();
}

function setActiveSide(side) {
  state.activeSide = side;
  render();
  saveState();
}

function adjustScore(side, delta, label = "Manual") {
  pushUndoSnapshot();
  const key = `${side}Score`;
  state[key] = Math.max(0, state[key] + delta);
  if (label) {
    const sideName = side === "left" ? state.leftName : state.rightName;
    addLog({
      label,
      delta,
      side,
      sideName
    });
  }
  render();
  saveState();
}

function formatLogTime(date) {
  return date
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s/g, "")
    .toLowerCase();
}

function addLog({ label, delta, side, sideName, type = "score", fullTitle = "" }) {
  const at = new Date();
  const entry = {
    at: at.toISOString(),
    displayTime: formatLogTime(at),
    mat: state.mat,
    bout: state.bout,
    period: periodOptions[state.periodIndex],
    side,
    sideName,
    label,
    delta,
    type,
    fullTitle
  };
  state.log.push(entry);
}

function debounceAction(key) {
  const now = Date.now();
  const last = debounceMap.get(key) || 0;
  if (now - last < debounceWindowMs) {
    return true;
  }
  debounceMap.set(key, now);
  return false;
}

function cyclePeriod(direction) {
  pushUndoSnapshot();
  const max = periodOptions.length;
  state.periodIndex = (state.periodIndex + direction + max) % max;
  render();
  saveState();
}

function changeMat(delta) {
  pushUndoSnapshot();
  state.mat = Math.max(1, state.mat + delta);
  render();
  saveState();
}

function changeBout(delta) {
  pushUndoSnapshot();
  state.bout = Math.max(0, state.bout + delta);
  render();
  saveState();
}

function setTime() {
  const minutesInput = prompt("Set minutes:", "2");
  if (minutesInput === null) return;
  const secondsInput = prompt("Set seconds:", "0");
  if (secondsInput === null) return;
  const minutes = Number.parseInt(minutesInput, 10);
  const seconds = Number.parseInt(secondsInput, 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds) || minutes < 0 || seconds < 0 || seconds > 59) {
    alert("Enter valid minutes and seconds.");
    return;
  }
  pushUndoSnapshot();
  state.timerSeconds = minutes * 60 + seconds;
  state.timerRunning = false;
  stopTimerInterval();
  render();
  saveState();
}

function startTimerInterval() {
  if (timerInterval) return;
  lastTick = Date.now();
  timerInterval = window.setInterval(() => {
    const now = Date.now();
    const delta = Math.floor((now - lastTick) / 1000);
    if (delta >= 1) {
      state.timerSeconds = Math.max(0, state.timerSeconds - delta);
      lastTick = now;
      if (state.timerSeconds === 0) {
        state.timerRunning = false;
        stopTimerInterval();
      }
      render();
      saveState();
    }
  }, 250);
}

function stopTimerInterval() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  if (state.timerRunning || state.timerSeconds <= 0) return;
  pushUndoSnapshot();
  state.timerRunning = true;
  startTimerInterval();
  saveState();
}

function stopTimer() {
  if (!state.timerRunning) return;
  pushUndoSnapshot();
  state.timerRunning = false;
  stopTimerInterval();
  saveState();
}

function resetTimer() {
  pushUndoSnapshot();
  state.timerSeconds = 0;
  state.timerRunning = false;
  stopTimerInterval();
  render();
  saveState();
}

function resetScores() {
  pushUndoSnapshot();
  state.leftScore = 0;
  state.rightScore = 0;
  render();
  saveState();
}

function undo() {
  if (undoStack.length === 0) return;
  const snapshot = undoStack.pop();
  restoreSnapshot(snapshot);
}

function exportCsv() {
  const headers = ["at", "mat", "bout", "period", "side", "sideName", "label", "delta", "type", "fullTitle"];
  const rows = state.log.map((entry) => [
    entry.at,
    entry.mat,
    entry.bout,
    entry.period,
    entry.side,
    entry.sideName,
    entry.label,
    entry.delta,
    entry.type ?? "score",
    entry.fullTitle ?? ""
  ]);
  const csv = [headers.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");
  downloadFile("wrestling-log.csv", "text/csv", csv);
}

function exportJson() {
  downloadFile("wrestling-log.json", "application/json", JSON.stringify(state.log, null, 2));
}

function escapeCsv(value) {
  const stringValue = String(value ?? "");
  if (/[,"\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadFile(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function clearLog() {
  pushUndoSnapshot();
  state.log = [];
  render();
  saveState();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function handleAction(action) {
  switch (action) {
    case "matDec":
      changeMat(-1);
      break;
    case "matInc":
      changeMat(1);
      break;
    case "boutDec100":
      changeBout(-100);
      break;
    case "boutDec10":
      changeBout(-10);
      break;
    case "boutDec1":
      changeBout(-1);
      break;
    case "boutInc1":
      changeBout(1);
      break;
    case "boutInc10":
      changeBout(10);
      break;
    case "boutInc100":
      changeBout(100);
      break;
    case "periodDec":
      cyclePeriod(-1);
      break;
    case "periodInc":
      cyclePeriod(1);
      break;
    case "setTime":
      setTime();
      break;
    case "startTimer":
      startTimer();
      break;
    case "stopTimer":
      stopTimer();
      break;
    case "resetTimer":
      resetTimer();
      break;
    case "resetScores":
      resetScores();
      break;
    case "leftInc":
      if (!debounceAction("leftInc")) adjustScore("left", 1, "Manual +1");
      break;
    case "leftDec":
      if (!debounceAction("leftDec")) adjustScore("left", -1, "Manual -1");
      break;
    case "rightInc":
      if (!debounceAction("rightInc")) adjustScore("right", 1, "Manual +1");
      break;
    case "rightDec":
      if (!debounceAction("rightDec")) adjustScore("right", -1, "Manual -1");
      break;
    case "undo":
      undo();
      break;
    case "fullscreen":
      toggleFullscreen();
      break;
    case "exportCsv":
      exportCsv();
      break;
    case "exportJson":
      exportJson();
      break;
    case "clearLog":
      clearLog();
      break;
    default:
      break;
  }
}

function handleQuickScore(button) {
  const points = Number(button.dataset.points);
  const label = button.dataset.label;
  const side = state.activeSide;
  const sideName = side === "left" ? state.leftName : state.rightName;
  if (debounceAction(`quick-${label}`)) return;
  pushUndoSnapshot();
  state[`${side}Score`] = Math.max(0, state[`${side}Score`] + points);
  addLog({ label, delta: points, side, sideName, type: "score" });
  render();
  saveState();
}

function handleOutcome(button) {
  const label = button.dataset.outcomeLabel;
  const fullTitle = button.dataset.outcomeTitle || "";
  const side = state.activeSide;
  const sideName = side === "left" ? state.leftName : state.rightName;
  if (debounceAction(`outcome-${label}`)) return;
  pushUndoSnapshot();
  addLog({ label, delta: 0, side, sideName, type: "outcome", fullTitle });
  render();
  saveState();
}

function handleKeyboard(event) {
  if (event.target instanceof HTMLInputElement) return;
  if (event.key === " ") {
    event.preventDefault();
    if (state.timerRunning) {
      stopTimer();
    } else {
      startTimer();
    }
    return;
  }
  const key = event.key.toLowerCase();
  if (key === "u") {
    undo();
  } else if (key === "a") {
    toggleActiveSide();
  } else if (key === "t") {
    triggerQuickByLabel("T3");
  } else if (key === "r") {
    triggerQuickByLabel("R2");
  } else if (key === "1") {
    triggerQuickByLabel("E1");
  } else if (key === "2") {
    triggerQuickByLabel("NF2");
  } else if (key === "3") {
    triggerQuickByLabel("NF3");
  } else if (key === "4") {
    triggerQuickByLabel("NF4");
  } else if (key === "p" && event.shiftKey) {
    triggerQuickByLabel("P2");
  } else if (key === "p") {
    triggerQuickByLabel("P1");
  } else if (event.key === "+" || event.key === "=") {
    adjustScore(state.activeSide, 1, "Manual +1");
  } else if (event.key === "-") {
    adjustScore(state.activeSide, -1, "Manual -1");
  }
}

function triggerQuickByLabel(label) {
  const button = document.querySelector(`.scoreBtn[data-label="${label}"]`);
  if (button) {
    handleQuickScore(button);
  }
}

function toggleActiveSide() {
  setActiveSide(state.activeSide === "left" ? "right" : "left");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
}


function normalizeLoadedLog() {
  state.bout = Math.max(0, Number.parseInt(state.bout, 10) || 0);
  state.mat = Math.max(1, Number.parseInt(state.mat, 10) || 1);
  state.periodIndex = Math.min(periodOptions.length - 1, Math.max(0, Number.parseInt(state.periodIndex, 10) || 0));
  state.leftScore = Math.max(0, Number.parseInt(state.leftScore, 10) || 0);
  state.rightScore = Math.max(0, Number.parseInt(state.rightScore, 10) || 0);

  state.log = (state.log || []).map((entry) => {
    const entryDate = entry.at ? new Date(entry.at) : new Date();
    const resolvedSide = entry.side || "left";
    return {
      at: entry.at || entryDate.toISOString(),
      displayTime: entry.displayTime || formatLogTime(entryDate),
      mat: Number.isFinite(entry.mat) ? entry.mat : state.mat,
      bout: Number.isFinite(entry.bout) ? entry.bout : state.bout,
      period: entry.period || periodOptions[state.periodIndex],
      side: resolvedSide,
      sideName:
        entry.sideName ||
        (resolvedSide === "left" ? state.leftName : state.rightName),
      label: entry.label || "",
      delta: Number.isFinite(entry.delta) ? entry.delta : 0,
      type: entry.type === "outcome" ? "outcome" : "score",
      fullTitle: entry.fullTitle || ""
    };
  });
}

function init() {
  loadState();
  normalizeLoadedLog();
  render();
  if (state.timerRunning) {
    startTimerInterval();
  }
  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    if (action) {
      handleAction(action);
      return;
    }
    if (button.classList.contains("scoreBtn")) {
      handleQuickScore(button);
      return;
    }
    if (button.classList.contains("outcomeBtn")) {
      handleOutcome(button);
    }
  });

  elements.leftName.addEventListener("change", (event) => updateName("left", event.target.value));
  elements.rightName.addEventListener("change", (event) => updateName("right", event.target.value));
  elements.toggleActive.addEventListener("click", toggleActiveSide);

  document.addEventListener("keydown", handleKeyboard);
  registerServiceWorker();
}

init();
