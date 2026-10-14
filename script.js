
// Task Tracker — no stickers

const quotes = [
  "Make it happen. Shock everyone! ✨",
  "Slow progress is still progress. 🌱",
  "Focus on the step right in front of you. 🪐",
  "Clear desk, calm mind. 🍵",
  "You are doing amazing things! 🧸"
];

let tasks = [];
let currentFilter = "all";
let isDarkMode = localStorage.getItem("dark-theme") === "true";
let audioCtx = null;
let particles = [];
let animationStarted = false;

try {
  const saved = JSON.parse(localStorage.getItem("tasks"));
  if (Array.isArray(saved)) tasks = saved;
} catch {
  tasks = [];
}

function saveTasks() {
  try {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  } catch (error) {
    console.error("Unable to save tasks:", error);
  }
}

function playSound(type = "pop") {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;

    if (!audioCtx) audioCtx = new Audio();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.type = type === "chime" ? "triangle" : "sine";
    oscillator.frequency.value = type === "chime" ? 700 : 400;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001, audioCtx.currentTime + 0.2
    );

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch (error) {
    console.log("Sound unavailable.");
  }
}


function applyTheme() {
  document.body.classList.toggle("dark-mode", isDarkMode);

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.textContent = isDarkMode ? "☀️" : "🌙";
  }
}


function addTask(event) {
  event.preventDefault();

  const titleInput = document.getElementById("task-title");
  const descInput = document.getElementById("task-desc");
  const priorityInput = document.getElementById("task-priority");
  const error = document.getElementById("title-error");
  const title = titleInput?.value.trim() || "";

  if (!title) {
    if (error) error.style.display = "block";
    titleInput?.focus();
    return;
  }

  if (error) error.style.display = "none";

  tasks.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    description: descInput?.value.trim() || "",
    priority: priorityInput?.value || "medium",
    completed: false
  });

  saveTasks();
  renderTasks();
  document.getElementById("task-form")?.reset();
  playSound();
}

function toggleTaskComplete(id) {
  tasks = tasks.map(task =>
    task.id === id
      ? { ...task, completed: !task.completed }
      : task
  );

  saveTasks();
  renderTasks();

  if (tasks.find(task => task.id === id)?.completed) {
    playSound("chime");
    spawnConfettiBurst();
  } else {
    playSound();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  playSound();
}

function clearCompletedTasks() {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
  playSound();
}

function renderTasks() {
  const container = document.getElementById("tasks-container");
  const count = document.getElementById("total-count");
  if (!container) return;

  const filtered = tasks.filter(task => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  if (count) {
    count.textContent = tasks.filter(task => !task.completed).length;
  }

  container.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = currentFilter === "completed"
      ? "No completed tasks yet. 🌱"
      : currentFilter === "pending"
        ? "You're all caught up! ✨"
        : "Your desk is clear. Time to unwind! ✨";
    container.appendChild(empty);
    return;
  }

  filtered.forEach(task => {
    const card = document.createElement("article");
    const priority = ["low", "medium", "high"].includes(task.priority)
      ? task.priority : "medium";

    card.className =
      `task-card priority-${priority}` +
      (task.completed ? " completed" : "");
    card.dataset.id = task.id;

    const details = document.createElement("div");
    details.className = "task-details";

    const titleArea = document.createElement("div");
    titleArea.className = "title-area";

    const badge = document.createElement("span");
    badge.className = `priority-badge ${priority}`;
    badge.textContent = priority;

    const title = document.createElement("h3");
    title.textContent = task.title;

    titleArea.append(badge, title);
    details.appendChild(titleArea);

    if (task.description) {
      const description = document.createElement("p");
      description.textContent = task.description;
      details.appendChild(description);
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const complete = document.createElement("button");
    complete.type = "button";
    complete.className = "action-btn complete-btn";
    complete.textContent = task.completed ? "↩" : "✓";
    complete.title = task.completed ? "Mark pending" : "Complete task";
    complete.setAttribute("aria-label", complete.title);
    complete.addEventListener("click", () =>
      toggleTaskComplete(task.id)
    );

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "action-btn delete-btn";
    remove.textContent = "🗑";
    remove.title = "Delete task";
    remove.setAttribute("aria-label", "Delete task");
    remove.addEventListener("click", () => deleteTask(task.id));

    actions.append(complete, remove);
    card.append(details, actions);
    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

function spawnConfettiBurst() {
  if (!document.getElementById("confetti-canvas")) return;

  for (let i = 0; i < 35; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 3,
      size: Math.random() * 6 + 3,
      color: `hsl(${Math.random() * 360}, 85%, 65%)`,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.7) * 12,
      life: 60
    });
  }
}

function initializeConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas || animationStarted) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  animationStarted = true;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.life--;

      ctx.globalAlpha = Math.min(1, p.life / 20);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  animate();
}

function initializeApp() {
  document.getElementById("task-form")
    ?.addEventListener("submit", addTask);

  document.getElementById("clear-completed-btn")
    ?.addEventListener("click", clearCompletedTasks);

  document.getElementById("theme-toggle")
    ?.addEventListener("click", () => {
      isDarkMode = !isDarkMode;
      applyTheme();
    });

  document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn")
        .forEach(item => item.classList.remove("active"));

      button.classList.add("active");
      currentFilter = button.dataset.filter || "all";
      renderTasks();
    });
  });

  const quoteBox = document.getElementById("quote-box");
  if (quoteBox) {
    const quote = document.createElement("p");
    quote.className = "quote-text";
    quote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    quoteBox.replaceChildren(quote);
  }

  applyTheme();
  initializeConfetti();
  renderTasks();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
