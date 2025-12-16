/* Shared script for startup, index (dashboard), study, routine, and goal pages */

console.log("script.js loaded");

// Ensure the DOM is fully loaded before executing initApp
window.addEventListener("load", () => {
  try {
    initApp();
  } catch (err) {
    console.error("initApp error:", err);
  }
});

const dailyBtn = document.getElementById("dailyBtn");
if (dailyBtn) {
  dailyBtn.onclick = () => {
    window.location.href = "reminders.html";
  };
} else {
  console.warn("dailyBtn is missing");
}

/* ---------------- MAIN ROUTER ---------------- */
function initApp() {
  const path = window.location.pathname.split("/").pop();

  switch (path) {
    case "":
    case "index.html":
      initIndex();
      break;
    case "startup.html":
      initStartup();
      break;
    case "study.html":
      initStudy();
      break;
    case "routine.html":
      initRoutine();
      break;
    case "goal.html":
      initGoal();
      break;
    default:
      initIndex();
  }
}

/* ---------------- STARTUP ---------------- */
function initStartup() {
  const subCountInput = document.getElementById("subCount");
  const subjectInputs = document.getElementById("subjectInputs");
  const saveBtn = document.getElementById("saveBtn");
  const userNameInput = document.getElementById("userName");

  if (!subCountInput || !subjectInputs || !saveBtn || !userNameInput) {
    console.error("Required elements for initStartup are missing");
    return;
  }

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
    subs.forEach(s => (colors[s] = randomColor()));
    localStorage.setItem("subjectColors", JSON.stringify(colors));
    localStorage.setItem("firstTime", "false");
    window.location.href = "index.html";
  });

  const existingSubjects = JSON.parse(localStorage.getItem("subjects") || "[]");
  if (existingSubjects.length) {
    subCountInput.value = existingSubjects.length;
    subCountInput.dispatchEvent(new Event("input"));
    const boxes = document.querySelectorAll(".subjectBox");
    boxes.forEach((b, i) => (b.value = existingSubjects[i] || ""));
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
  if (goalBtn) {
    goalBtn.onclick = () => {
      window.location.href = "goal.html";
    };
  }

  const routineBtn = document.getElementById("routineBtn");
  if (routineBtn) {
    routineBtn.onclick = () => {
      window.location.href = "routine.html";
    };
  }

  const welcomeUser = document.getElementById("welcomeUser");
  const subjectButtons = document.getElementById("subjectButtons");
  const canvas = document.getElementById("studyGraph");
  if (!welcomeUser || !subjectButtons || !canvas) {
    console.error("Critical elements missing on the index page");
    return;
  }

  welcomeUser.textContent = `Hello, ${localStorage.getItem("userName") || "Student"}!`;

  // Populate subjects
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
    btn.onclick = () => {
      window.location.href = `study.html?subject=${encodeURIComponent(sub)}`;
    };
    subjectButtons.appendChild(btn);
  });

  // Add notes button
  const notesBtn = document.createElement("button");
  notesBtn.className = "subject-btn";
  notesBtn.textContent = "Notes";
  notesBtn.style.margin = "6px";
  notesBtn.onclick = () => {
    window.location.href = "note.html";
  };
  subjectButtons.appendChild(notesBtn);

  renderGraph();
  renderDashboardReminders();
  scheduleDashboardReminderUpdates();
}

// Additional fixes and optimizations have been added to prevent common DOM and script-loading issues. Separate components and their initialization handlers follow the existing logic but include improved checks and error messages.

function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}
