const questions = [
  {
    id: 1,
    category: "情緒檢查",
    text: "我現在的交易決策沒有受到近期輸贏的影響。",
    correctAnswer: true
  },
  {
    id: 2,
    category: "情緒檢查",
    text: "我希望這筆交易能幫我把最近的虧損快速補回來。",
    correctAnswer: false
  },
  {
    id: 3,
    category: "情緒檢查",
    text: "如果市場短暫逆向波動，我仍願意依原計畫持倉。",
    correctAnswer: true
  },
  {
    id: 4,
    category: "情緒檢查",
    text: "我現在的心態是「不做也沒關係」。",
    correctAnswer: true
  },
  {
    id: 5,
    category: "策略檢查",
    text: "這筆交易是因為策略條件出現，而不是我主觀覺得行情可能會動。",
    correctAnswer: true
  },
  {
    id: 6,
    category: "策略檢查",
    text: "如果現在市場暫停交易 20 分鐘，我仍會在之後做同樣決策。",
    correctAnswer: true
  },
  {
    id: 7,
    category: "策略檢查",
    text: "我現在其實只是覺得「感覺差不多可以進場了」。",
    correctAnswer: false
  },
  {
    id: 8,
    category: "策略檢查",
    text: "我能清楚描述這筆交易的進場邏輯。",
    correctAnswer: true
  },
  {
    id: 9,
    category: "風險管理",
    text: "如果停損被觸發，我已經知道會虧多少。",
    correctAnswer: true
  },
  {
    id: 10,
    category: "風險管理",
    text: "這筆交易的部位大小，是依照既定規則計算出來的。",
    correctAnswer: true
  },
  {
    id: 11,
    category: "風險管理",
    text: "如果這筆交易失敗，我不會立刻再做下一筆交易。",
    correctAnswer: true
  },
  {
    id: 12,
    category: "風險管理",
    text: "我現在願意承受的風險，比平常大一點也沒關係。",
    correctAnswer: false
  },
  {
    id: 13,
    category: "交易結構",
    text: "我打算先用較小部位進場，再視情況加碼。",
    correctAnswer: true
  },
  {
    id: 14,
    category: "交易結構",
    text: "這筆交易若失敗，我仍會等待新的訊號再進場。",
    correctAnswer: true
  },
  {
    id: 15,
    category: "交易結構",
    text: "我現在進場主要是因為市場看起來快要動了。",
    correctAnswer: false
  },
  {
    id: 16,
    category: "交易結構",
    text: "即使今天完全不交易，也不會影響我的整體策略。",
    correctAnswer: true
  }
];

const LOCK_KEY = "tradeChecklistLockUntil";
const LOCK_DURATION_MS = 10 * 60 * 1000;

let currentIndex = 0;
let answers = [];
let timerId = null;

const app = document.getElementById("app");
const content = document.getElementById("content");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");

function getLockUntil() {
  const storedValue = localStorage.getItem(LOCK_KEY);
  const lockUntil = Number(storedValue);
  return Number.isFinite(lockUntil) ? lockUntil : 0;
}

function setLockUntil(timestamp) {
  localStorage.setItem(LOCK_KEY, String(timestamp));
}

function clearLock() {
  localStorage.removeItem(LOCK_KEY);
}

function isLocked() {
  return getLockUntil() > Date.now();
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateProgress(doneCount) {
  progressText.textContent = `Progress: ${doneCount} / ${questions.length}`;
  progressBar.style.width = `${(doneCount / questions.length) * 100}%`;
}

function resetSession() {
  currentIndex = 0;
  answers = [];
  app.classList.remove("success", "failure");
  stopLockTimer();
  render();
}

function stopLockTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startLockTimer() {
  stopLockTimer();
  timerId = setInterval(() => {
    if (!isLocked()) {
      clearLock();
      resetSession();
      return;
    }

    renderLocked();
  }, 1000);
}

function handleAnswer(answer) {
  const question = questions[currentIndex];
  answers.push(answer);

  if (answer !== question.correctAnswer) {
    const lockUntil = Date.now() + LOCK_DURATION_MS;
    setLockUntil(lockUntil);
    renderLocked();
    startLockTimer();
    return;
  }

  currentIndex += 1;

  if (currentIndex >= questions.length) {
    renderSuccess();
    return;
  }

  render();
}

function renderQuestion() {
  const question = questions[currentIndex];
  app.classList.remove("success", "failure");
  updateProgress(currentIndex);

  content.innerHTML = `
    <p class="category">${question.category} (${currentIndex + 1}/${questions.length})</p>
    <p class="question">${question.text}</p>
    <div class="actions">
      <button class="answer-button yes" data-answer="yes" type="button">是</button>
      <button class="answer-button no" data-answer="no" type="button">否</button>
    </div>
  `;

  content.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      handleAnswer(button.dataset.answer === "yes");
    });
  });
}

function renderSuccess() {
  app.classList.add("success");
  app.classList.remove("failure");
  updateProgress(questions.length);
  content.innerHTML = `
    <div class="status-box success">
      <p class="status-title">✅ 檢查通過，可以交易</p>
      <p class="status-note">全部 ${questions.length} 題皆符合預設答案。</p>
    </div>
    <button id="restartButton" class="reset-button" type="button">重新檢查</button>
  `;

  document.getElementById("restartButton").addEventListener("click", resetSession);
}

function renderLocked() {
  const lockUntil = getLockUntil();
  const remaining = Math.max(0, lockUntil - Date.now());

  if (remaining <= 0) {
    clearLock();
    resetSession();
    return;
  }

  app.classList.add("failure");
  app.classList.remove("success");
  updateProgress(currentIndex + 1);
  content.innerHTML = `
    <div class="status-box failure">
      <p class="status-title">❌ 檢查未通過，請冷靜 10 分鐘</p>
      <p class="status-note">期間不能重新測試，請等待倒數結束。</p>
      <p class="lock-timer">剩餘時間：${formatRemaining(remaining)}</p>
    </div>
  `;
}

function render() {
  if (isLocked()) {
    renderLocked();
    startLockTimer();
    return;
  }

  clearLock();
  stopLockTimer();
  renderQuestion();
}

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

render();
