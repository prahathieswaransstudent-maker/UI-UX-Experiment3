const state = {
  started: false,
  startTime: 0,
  elapsed: null,
  timerId: null,
  searchDone: false,
  openDone: false,
  cartDone: false,
  cartCount: 0,
  runs: JSON.parse(localStorage.getItem("uxlab-runs") || "[]")
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(element.hideTimer);
  element.hideTimer = setTimeout(() => element.classList.remove("show"), 2200);
}

function applyConfiguration() {
  const competitor = $("#competitor").value;
  const variant = $("#variant").value;
  const improved = variant === "improved";
  const prototype = $("#prototype");
  prototype.className = `store variant-${competitor} ${improved ? "improved" : "original"}`;
  $("#brand-name").textContent = competitor === "a" ? "ShopSphere" : "MarketCart";
  $("#search-input").placeholder = improved ? "Search wireless headphones" : "Search for products";
  resetTask(false);
}

function resetTask(showMessage = true) {
  clearInterval(state.timerId);
  state.started = false;
  state.elapsed = null;
  state.startTime = 0;
  state.searchDone = false;
  state.openDone = false;
  state.cartDone = false;
  state.cartCount = 0;
  $("#timer").textContent = "0.0s";
  $("#cart-count").textContent = "0";
  $$("#step-search, #step-open, #step-cart").forEach((item) => item.classList.remove("done"));
  $("#home-state").hidden = false;
  $("#product-state").hidden = true;
  $("#start-task").textContent = "Start timed task";
  if (showMessage) toast("Task reset");
}

function markDone(elementId) {
  $(elementId).classList.add("done");
}

function startTask() {
  if (state.started) return;
  resetTask(false);
  state.started = true;
  state.startTime = performance.now();
  $("#start-task").textContent = "Task in progress";
  state.timerId = setInterval(() => {
    state.elapsed = (performance.now() - state.startTime) / 1000;
    $("#timer").textContent = `${state.elapsed.toFixed(1)}s`;
  }, 100);
  $("#search-input").focus();
  toast("Timed task started");
}

function completeSearch() {
  if (!state.started) return;
  const value = $("#search-input").value.trim().toLower();
  if (value.includes("headphone")) {
    state.searchDone = true;
    markDone("#step-search");
    toast("Search completed");
  }
}

function openProduct() {
  if (!state.started) return;
  if (!state.searchDone) {
    toast("First search for wireless headphones");
    return;
  }
  state.openDone = true;
  markDone("#step-open");
  $("#home-state").hidden = true;
  $("#product-state").hidden = false;
  toast("Product opened");
}

function completeTask() {
  if (!state.started) {
    toast("Start the timed task first");
    return;
  }
  if (!state.openDone) {
    toast("Open the Wireless Headphones product first");
    return;
  }
  state.cartDone = true;
  state.cartCount += 1;
  $("#cart-count").textContent = state.cartCount;
  markDone("#step-cart");
  clearInterval(state.timerId);
  state.elapsed = state.elapsed || (performance.now() - state.startTime) / 1000;
  $("#timer").textContent = `${state.elapsed.toFixed(1)}s`;
  state.started = false;
  $("#start-task").textContent = "Task complete";
  recordRun(true);
  toast("Task completed — item added to cart");
}

function recordRun(completed) {
  const run = {
    competitor: $("#competitor").value,
    variant: $("#variant").value,
    completed,
    time: completed ? Number(state.elapsed.toFixed(2)) : null,
    date: new Date().toISOString()
  };
  state.runs.push(run);
  localStorage.setItem("uxlab-runs", JSON.stringify(state.runs));
  renderRuns();
}

function renderRuns() {
  const rows = state.runs.slice(-10).reverse();
  $("#results-body").innerHTML = rows.map((run, index) =>
    `<tr><td>${state.runs.length - index}</td><td>${run.competitor === "a" ? "A — ShopSphere" : "B — MarketCart"}</td><td>${run.variant}</td><td>${run.completed ? "Complete" : "Incomplete"}</td><td>${run.time ? run.time + "s" : "—"}</td></tr>`
  ).join("");
  const completed = state.runs.filter((run) => run.completed);
  $("#completion-rate").textContent = state.runs.length ? `${Math.round(completed.length / state.runs.length * 100)}%` : "0%";
  $("#attempt-count").textContent = state.runs.length;
  const average = completed.length ? completed.reduce((sum, run) => sum + run.time, 0) / completed.length : null;
  $("#average-time").textContent = average ? `${average.toFixed(1)}s` : "—";
}

$("#start-task").addEventListener("click", startTask);
$("#competitor").addEventListener("change", applyConfiguration);
$("#variant").addEventListener("change", applyConfiguration);
$("#reset-experiment").addEventListener("click", () => {
  state.runs = [];
  localStorage.removeItem("uxlab-runs");
  resetTask(false);
  renderRuns();
  toast("All experiment data cleared");
});
$("#search-input").addEventListener("search", completeSearch);
$("#search-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    completeSearch();
  }
});
$("#shop-now").addEventListener("click", () => {
  $("#search-input").value = "wireless headphones";
  completeSearch();
  toast("Search suggestions applied");
});
$(".headphones.product-image").addEventListener("click", openProduct);
$("#back-products").addEventListener("click", () => {
  $("#home-state").hidden = false;
  $("#product-state").hidden = true;
});
$("#add-to-cart").addEventListener("click", completeTask);
$("#cart-button").addEventListener("click", () => {
  if (state.cartCount) toast(`${state.cartCount} item in your cart`);
  else toast("Your cart is empty");
});
$$(".nav-button[data-view]").forEach((button) => button.addEventListener("click", () => {
  $$(".nav-button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  $$(".view").forEach((view) => view.classList.remove("active"));
  $(`#${button.dataset.view}`).classList.add("active");
}));

applyConfiguration();
renderRuns();
