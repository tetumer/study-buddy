/* Shared script for startup, index (dashboard), study, routine, and goal pages */

console.log("script.js loaded");

window.addEventListener("load", () => {
  try {
    initApp();
  } catch (err) {
    console.error("initApp error:", err);
  }
});

const dailyBtn = document.getElementById("dailyBtn");
if (dailyBtn) dailyBtn.onclick = () => window.location.href = "reminders.html";

/* ---------------- MAIN ROUTER ---------------- */
function initApp() {
  const path = window.location.pathname.split("/").pop();

  if (path === "" || path === "index.html") initIndex();
  else if (path === "startup.html") initStartup();
  else if (path === "study.html") initStudy();
  else if (path === "routine.html") initRoutine();
  else if (path === "goal.html") initGoal();
  else initIndex();
}

/* ---------------- STARTUP ---------------- */
function initStartup() {
  const subCountInput = document.getElementById("subCount");
  const subjectInputs = document.getElementById("subjectInputs");
  const saveBtn = document.getElementById("saveBtn");
  const userNameInput = document.getElementById("userName");

  if (!subCountInput || !subjectInputs || !saveBtn || !userNameInput) return;

  subCountInput.addEventListener("input", () => {
    const count = Math.max(0, parseInt(subCountInput.value) || 0);
    subjectInputs.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const box = document.createElement("input");
      box.type = "text";
      box.placeholder = "Subject " + (i + 1);
      box.className = "subjectBox";
      box.style.display = "block";
      box.style.margin = "8px 0";
      subjectInputs.appendChild(box);
    }
  });

  saveBtn.addEventListener("click", () => {
    const name = userNameInput.value.trim();
    const count = Math.max(0, parseInt(subCountInput.value) || 0);
    if (!name || count < 1) {
      alert("Please enter your name and valid subject count.");
      return;
    }
    const boxes = Array.from(document.querySelectorAll(".subjectBox"));
    const subs = boxes.map(b => b.value.trim()).filter(v => v);
    if (subs.length !== count) {
      alert("Please fill all subject names.");
      return;
    }

    localStorage.setItem("userName", name);
    localStorage.setItem("subjects", JSON.stringify(subs));
    const colors = {};
    subs.forEach(s => colors[s] = randomColor());
    localStorage.setItem("subjectColors", JSON.stringify(colors));
    localStorage.setItem("firstTime", "false");
    window.location.href = "index.html";
  });

  const existingSubjects = JSON.parse(localStorage.getItem("subjects") || "[]");
  if (existingSubjects.length) {
    subCountInput.value = existingSubjects.length;
    subCountInput.dispatchEvent(new Event("input"));
    const boxes = document.querySelectorAll(".subjectBox");
    boxes.forEach((b, i) => b.value = existingSubjects[i] || "");
    userNameInput.value = localStorage.getItem("userName") || "";
  }
}

/* ---------------- INDEX / DASHBOARD ---------------- */
let currentChart = null;

function initIndex() {
  const firstTime = localStorage.getItem("firstTime");
  if (!firstTime || firstTime === "true") {
    window.location.href = "startup.html";
    return;
  }

  const goalBtn = document.getElementById("goalBtn");
  if (goalBtn) goalBtn.onclick = () => window.location.href = "goal.html";

  const routineBtn = document.getElementById("routineBtn");
  if (routineBtn) routineBtn.onclick = () => window.location.href = "routine.html";

  const welcomeUser = document.getElementById("welcomeUser");
  const subjectButtons = document.getElementById("subjectButtons");
  const canvas = document.getElementById("studyGraph");
  if (!welcomeUser || !subjectButtons || !canvas) return;

  welcomeUser.textContent = `Hello, ${localStorage.getItem("userName") || "Student"}!`;

  // Subjects
  const subjects = JSON.parse(localStorage.getItem("subjects") || "[]");
  const colors = JSON.parse(localStorage.getItem("subjectColors") || "{}");
  const allSubjects = Array.from(new Set([...subjects, "Personal Project"]));
  if (!colors["Personal Project"]) colors["Personal Project"] = "#FF7F50";
  localStorage.setItem("subjectColors", JSON.stringify(colors));

  // Clear buttons first
  subjectButtons.innerHTML = "";

  // Create subject buttons dynamically
  allSubjects.forEach(sub => {
    const btn = document.createElement("button");
    btn.className = "subject-btn";
    btn.textContent = sub;
    btn.style.margin = "6px";
    btn.onclick = () => window.location.href = `study.html?subject=${encodeURIComponent(sub)}`;
    subjectButtons.appendChild(btn);
  });

  // --- ADD NOTES BUTTON ---
  const notesBtn = document.createElement("button");
  notesBtn.className = "subject-btn";
  notesBtn.textContent = "Notes";
  notesBtn.style.margin = "6px";
  notesBtn.onclick = () => window.location.href = "note.html";
  subjectButtons.appendChild(notesBtn);

  renderGraph();
  renderDashboardReminders();
  scheduleDashboardReminderUpdates();
}

/* ---------------- DASHBOARD REMINDERS ---------------- */
function renderDashboardReminders() {
  const containerId = "dashboardReminders";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.style.margin = "12px 0";
    container.style.padding = "10px";
    container.style.background = "#FFF3CD";
    container.style.border = "1px solid #FFEEBA";
    container.style.borderRadius = "8px";
    const refEl = document.getElementById("subjectButtons") || document.body.firstChild;
    document.body.insertBefore(container, refEl);
  }

  container.innerHTML = "";
  const now = new Date();
  const todayDay = now.toLocaleString("en-US", { weekday: "long" });

  // Routine reminders
  const routineData = JSON.parse(localStorage.getItem("routines") || "[]");
  routineData.forEach(r => {
    if (r.day !== todayDay) return;
    const [h, m] = r.startTime.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    const durationMs = r.duration * 60 * 1000;
    const remaining = start.getTime() + durationMs - now.getTime();
    if (remaining > 0 && remaining <= durationMs * 0.1) {
      const div = document.createElement("div");
      div.style.margin = "4px 0";
      div.style.padding = "6px 10px";
      div.style.background = "#FFF9C4";
      div.style.borderRadius = "6px";
      div.textContent = `⚠️ Almost time: Study ${r.subject} (${r.duration}min)`;
      container.appendChild(div);
    }
  });

  // Goal reminders (within 24h)
  const goals = JSON.parse(localStorage.getItem("goals") || "[]");
  goals.forEach(g => {
    const deadline = new Date(g.deadline);
    const remainingMs = deadline - now;
    if (remainingMs > 0 && remainingMs <= 24 * 60 * 60 * 1000) {
      const div = document.createElement("div");
      div.style.margin = "4px 0";
      div.style.padding = "6px 10px";
      div.style.background = "#D1ECF1";
      div.style.borderRadius = "6px";
      div.textContent = `⚠️ Goal deadline soon: ${g.subject} - ${g.task}`;
      container.appendChild(div);
    }
  });

  container.style.display = container.hasChildNodes() ? "block" : "none";
}

// Update dashboard reminders every 5s
function scheduleDashboardReminderUpdates() {
  setInterval(() => {
    if (window.location.pathname.split("/").pop() === "index.html") {
      renderDashboardReminders();
    }
  }, 5000);
}

/* ---------------- STUDY PAGE ---------------- */
function initStudy() {
  console.log("initStudy: starting");

  // DOM
  const sound = document.getElementById("alarmSound");
  const studySubjectEl = document.getElementById("studySubject");
  const startBtn = document.getElementById("startTimerBtn");
  const stopBtn = document.getElementById("stopTimerBtn");
  const timerInput = document.getElementById("timerInput");
  const display = document.getElementById("timerDisplay");
  const backBtn = document.getElementById("backBtn");

  if (!startBtn || !stopBtn || !timerInput || !display || !studySubjectEl) {
    console.error("initStudy: missing DOM elements");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || "Personal Project";

  if (activeSubject && (startTime || elapsedMs > 0)) {
    studySubjectEl.textContent = `Studying: ${activeSubject}`;
  } else {
    studySubjectEl.textContent = `Studying: ${subject}`;
  }

  // ===== Alarm =====
  function triggerAlarm(subj) {
    console.log("triggerAlarm fired for", subj);

    // Stop sound if already looping
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
      sound.loop = false;
    }

    // Try to play alarm
    if (sound) {
      sound.currentTime = 0;
      sound.loop = true;
      sound.play().catch(err => {
        console.error("Alarm audio failed:", err);
        if (navigator.vibrate) navigator.vibrate([300,200,300,200,600]);
      });
    }

    // Notification
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const n = new Notification("Study Buddy", {
        body: `⏰ Your ${subj} session has ended.`,
        icon: "icon.png",
        requireInteraction: true
      });
      n.onclick = () => {
        if (sound) {
          sound.pause(); sound.currentTime = 0; sound.loop = false;
        }
        n.close();
      };
    } else {
      // Fallback popup
      const popup = document.createElement("div");
      popup.innerHTML = `
        <div style="position:fixed;top:30%;left:50%;transform:translateX(-50%);
          background:#fff;padding:20px;border:2px solid #000;z-index:9999">
          <p>⏰ Time's up! Your ${subj} session has ended.</p>
          <button id="closeAlarmBtn">OK</button>
        </div>`;
      document.body.appendChild(popup);
      document.getElementById("closeAlarmBtn").onclick = () => {
        if (sound) {
          sound.pause(); sound.currentTime = 0; sound.loop = false;
        }
        popup.remove();
      };
    }
  }

  // ===== Single persistent notification =====
  let activeNotification = null;
  function ensureNotification(subj) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    if (Notification.permission === "granted" && !activeNotification) {
      activeNotification = new Notification("Study Buddy Timer", {
        body: `⏳ ${subj} — running...`,
        icon: "icon.png",
        requireInteraction: true
      });
    }
  }
  function updateNotification(remainingSec, subj) {
    if (!activeNotification) return;
    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    activeNotification.body = `⏳ ${subj} — ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} left`;
  }

  // ===== Timer display =====
  function updateTimerDisplay() {
    if (!startTime || !durationMs) {
      display.textContent = "00:00";
      return;
    }
    const now = Date.now();
    const remainingSec = Math.ceil((startTime + durationMs - now) / 1000);

    if (remainingSec <= 0) {
      display.textContent = "00:00";
      clearInterval(timerId); timerId = null;

      // Clear state
      localStorage.removeItem("timerStart");
      localStorage.removeItem("timerDuration");
      localStorage.removeItem("timerSetMinutes");
      localStorage.removeItem("activeSubject");
      localStorage.removeItem("elapsedMs");

      // Complete + alarm
      onSessionComplete(activeSubject || subject, setMinutes);
      triggerAlarm(activeSubject || subject);

      // Reset UI
      startBtn.textContent = "Start";
      startBtn.disabled = false;
      stopBtn.disabled = true;
      timerInput.disabled = false;
      if (activeNotification) { activeNotification.close(); activeNotification = null; }
      return;
    }

    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    display.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    updateNotification(remainingSec, activeSubject || subject);
  }

  // ===== Start =====
  startBtn.onclick = () => {
    setMinutes = Math.max(1, parseInt(timerInput.value) || 30);
    timerInput.disabled = true;

    durationMs = setMinutes * 60 * 1000;
    startTime = Date.now();
    activeSubject = subject;

    localStorage.setItem("timerStart", String(startTime));
    localStorage.setItem("timerDuration", String(durationMs));
    localStorage.setItem("timerSetMinutes", String(setMinutes));
    localStorage.setItem("activeSubject", activeSubject);
    localStorage.removeItem("elapsedMs");

    ensureNotification(activeSubject || subject);
    updateTimerDisplay();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    timerId = setInterval(updateTimerDisplay, 1000);
    console.log("startTimer: locked", { setMinutes, durationMs });
  };

  // ===== Stop/Pause =====
  stopBtn.onclick = () => {
    if (timerId) clearInterval(timerId);
    timerId = null;
    if (startTime) {
      elapsedMs = Date.now() - startTime;
      localStorage.setItem("elapsedMs", String(elapsedMs));
    }
    localStorage.removeItem("timerStart");
    localStorage.removeItem("timerDuration");

    const elapsedMinutes = Math.floor((elapsedMs || 0) / 60000);
    onSessionComplete(activeSubject || subject, elapsedMinutes);

    startBtn.textContent = "Resume";
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (activeNotification) { activeNotification.close(); activeNotification = null; }
    updateTimerDisplay();
    console.log("stopTimer: paused", { elapsedMs, elapsedMinutes });
  };

  if (backBtn) backBtn.onclick = () => (window.location.href = "index.html");

  // ===== Resume if running =====
  if (!timerId && startTime && durationMs) {
    timerId = setInterval(updateTimerDisplay, 1000);
    startBtn.disabled = true;
    stopBtn.disabled = false;
    timerInput.disabled = true;
    ensureNotification(activeSubject || subject);
    console.log("initStudy: resumed");
  }

  console.log("initStudy: ready");
}


/* ---------------- ROUTINE PAGE ---------------- */
function initRoutine() {
  const form = document.getElementById("routineForm");
  const list = document.getElementById("routineList");
  if (!form || !list) return;

  renderRoutineList();

  form.onsubmit = (e) => {
    e.preventDefault();
    const day = document.getElementById("routineDay").value;
    const time = document.getElementById("routineTime").value;
    const subject = document.getElementById("routineSubject").value;
    const routines = JSON.parse(localStorage.getItem("routines") || "[]");
    routines.push({ day, startTime: time, duration: 60, subject });
    localStorage.setItem("routines", JSON.stringify(routines));
    renderRoutineList();
    form.reset();
  };

  function renderRoutineList() {
    const routines = JSON.parse(localStorage.getItem("routines") || "[]");
    list.innerHTML = routines.length
      ? ""
      : "<p>No routines added yet.</p>";
    routines.forEach((r, i) => {
      const div = document.createElement("div");
      div.className = "goalCard";
      div.innerHTML = `
        <h3>${r.day} - ${r.subject}</h3>
        <p>Time: ${r.startTime}</p>
        <button onclick="deleteRoutine(${i})">Delete</button>
      `;
      list.appendChild(div);
    });
  }

  window.deleteRoutine = function(i) {
    const routines = JSON.parse(localStorage.getItem("routines") || "[]");
    routines.splice(i, 1);
    localStorage.setItem("routines", JSON.stringify(routines));
    renderRoutineList();
  };
}

/* ---------------- GOAL PAGE ---------------- */
function initGoal() {
  const form = document.getElementById("goalForm");
  const list = document.getElementById("goalList");
  if (!form || !list) return;

  renderGoalList();

  form.onsubmit = (e) => {
    e.preventDefault();
    const subject = document.getElementById("goalSubject").value;
    const task = document.getElementById("goalTask").value;
    const deadline = document.getElementById("goalDeadline").value;
    const goals = JSON.parse(localStorage.getItem("goals") || "[]");
    goals.push({ subject, task, deadline });
    localStorage.setItem("goals", JSON.stringify(goals));
    renderGoalList();
    form.reset();
  };

  function renderGoalList() {
    const goals = JSON.parse(localStorage.getItem("goals") || "[]");
    list.innerHTML = goals.length
      ? ""
      : "<p>No goals added yet.</p>";
    goals.forEach((g, i) => {
      const div = document.createElement("div");
      div.className = "goalCard";
      div.innerHTML = `
        <h3>${g.subject}</h3>
        <p>${g.task}</p>
        <p>Deadline: ${g.deadline}</p>
        <button onclick="deleteGoal(${i})">Delete</button>
      `;
      list.appendChild(div);
    });
  }

  window.deleteGoal = function(i) {
    const goals = JSON.parse(localStorage.getItem("goals") || "[]");
    goals.splice(i, 1);
    localStorage.setItem("goals", JSON.stringify(goals));
    renderGoalList();
  };
}

/* ---------------- Helpers ---------------- */
function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/* ---------------- STUDY SESSION RECORD ---------------- */
function onSessionComplete(subject, minutes) {
  minutes = Math.max(1, Math.round(minutes));
  const raw = localStorage.getItem("studyData");
  const studyData = raw ? JSON.parse(raw) : {};
  const today = new Date().toISOString().split("T")[0];

  if (!studyData[today]) studyData[today] = {};
  if (!studyData[today][subject]) studyData[today][subject] = 0;
  studyData[today][subject] += minutes;

  localStorage.setItem("studyData", JSON.stringify(studyData));

  // Update index graph if on dashboard
  if (window.location.pathname.split("/").pop() === "index.html") {
    try { renderGraph(); } catch(e) { console.error(e); }
  }
}

/* ---------------- RENDER GRAPH ---------------- */
function renderGraph() {
  const canvas = document.getElementById("studyGraph");
  const placeholder = document.getElementById("statsPlaceholder");
  if (!canvas) return;

  const studyData = JSON.parse(localStorage.getItem("studyData") || "{}");
  const todayData = studyData[new Date().toISOString().split("T")[0]] || {};

  const labels = Object.keys(todayData);
  const values = Object.values(todayData);

  if (!labels.length) {
    if (placeholder) placeholder.style.display = "block";
    canvas.style.display = "none";
    if (currentChart) { try { currentChart.destroy(); } catch(e){} currentChart = null; }
    return;
  } else {
    if (placeholder) placeholder.style.display = "none";
    canvas.style.display = "block";
  }

  const colorsMap = JSON.parse(localStorage.getItem("subjectColors") || "{}");
  const bg = labels.map(l => colorsMap[l] || randomColor());

  if (currentChart) { try { currentChart.destroy(); } catch(e){} currentChart = null; }

  if (typeof Chart === "undefined") {
    console.error("Chart.js not found");
    return;
  }

  currentChart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: { labels, datasets: [{ label: "Minutes studied (today)", data: values, backgroundColor: bg }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });
}
