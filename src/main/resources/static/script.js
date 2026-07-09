/* ============================================================
   WeatherWatch v2.0 — script.js
   Features:
   ✅ OpenWeatherMap current + forecast API
   ✅ Extreme weather detection (heat, wind, rain, storm)
   ✅ Risk Score (0–100)
   ✅ AI-style recommendations
   ✅ Multi-city dashboard (Madurai, Chennai, Mumbai, Delhi)
   ✅ World clock with timezones
   ✅ Search history (localStorage)
   ✅ Dynamic background
   ✅ Real-time clock
   ✅ Temperature trend chart (Chart.js)
   ✅ Geolocation support
   ✅ Sidebar navigation + page system
   ✅ Forecast-Based Early Warning System
   ✅ Alert History Module (localStorage)
   ✅ Weather Analytics Dashboard
   ✅ Global Weather Map (Leaflet.js)
   ✅ Full error handling
   ============================================================ */

// ─────────────────────────────────────────────
// CONFIG — paste your FREE OpenWeatherMap key here
// Register at: https://openweathermap.org/api
// ─────────────────────────────────────────────



// Cities for the multi-city dashboard AND the global map
const DASHBOARD_CITIES = ["Madurai", "Chennai", "Mumbai", "Delhi"];

// Extended city list for the global map (lat/lon included for Leaflet)
const MAP_CITIES = [
  { name: "Madurai",   lat: 9.9252,  lon: 78.1198 },
  { name: "Chennai",   lat: 13.0827, lon: 80.2707 },
  { name: "Mumbai",    lat: 19.0760, lon: 72.8777 },
  { name: "Delhi",     lat: 28.7041, lon: 77.1025 },
  { name: "Kolkata",   lat: 22.5726, lon: 88.3639 },
  { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  { name: "London",    lat: 51.5074, lon: -0.1278 },
  { name: "New York",  lat: 40.7128, lon: -74.0060 },
  { name: "Tokyo",     lat: 35.6762, lon: 139.6503 },
  { name: "Dubai",     lat: 25.2048, lon: 55.2708 },
  { name: "Sydney",    lat: -33.8688, lon: 151.2093 },
];

// Thresholds for extreme weather detection
const THRESHOLDS = {
  heat: 35,   // °C — heatwave above this
  wind: 50,   // km/h — strong wind above this
};

// World clock timezone labels
const ZONE_LABELS = {
  "Asia/Kolkata":        "India (IST)",
  "America/New_York":    "New York (EST)",
  "Europe/London":       "London (GMT)",
  "Asia/Tokyo":          "Tokyo (JST)",
  "America/Los_Angeles": "Los Angeles (PST)",
  "Europe/Paris":        "Paris (CET)",
  "Asia/Dubai":          "Dubai (GST)",
  "Australia/Sydney":    "Sydney (AEST)",
  "America/Sao_Paulo":   "São Paulo (BRT)",
  "Asia/Singapore":      "Singapore (SGT)",
};

// ─────────────────────────────────────────────
// STATE — all persistent data lives in localStorage
// ─────────────────────────────────────────────
let searchHistory  = JSON.parse(localStorage.getItem("ww_history")       || "[]");
let alertHistory   = JSON.parse(localStorage.getItem("ww_alerts")        || "[]");
let analyticsData  = JSON.parse(localStorage.getItem("ww_analytics")     || "{}");
// analyticsData shape: { totalSearches, cityCount:{}, tempLog:[], highestTemp, totalRisk:[low,med,high,critical], totalAlerts }

let tempChart      = null;   // Chart.js: temp trend
let riskDistChart  = null;   // Chart.js: risk distribution (donut)
let citySearchChart = null;  // Chart.js: searches per city (bar)
let leafletMap     = null;   // Leaflet map instance
let worldClockTimer = null;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  startLiveClock();
  startWorldClock();
  renderHistory();
  loadDashboard();
  buildMiniClocks();
  updateAlertBadge();

  // Enter key triggers search
  document.getElementById("city-input").addEventListener("keydown", e => {
    if (e.key === "Enter") searchCity();
  });
});

// ═══════════════════════════════════════════════════════════
//  SIDEBAR / PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════

/**
 * showPage — switches the visible page and highlights the correct nav item.
 * Called by onclick on each sidebar button.
 */
function showPage(pageId, btn) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
        page.classList.add("hidden");
    });

    document.querySelectorAll(".nav-item").forEach(nav => {
        nav.classList.remove("active");
    });

    const page = document.getElementById("page-" + pageId);

    page.classList.remove("hidden");
    page.classList.add("active");

    if (btn) btn.classList.add("active");

    if (pageId === "analytics") renderAnalyticsPage();
    if (pageId === "alerts") renderAlertHistory();
    if (pageId === "map") initLeafletMap();

    closeSidebar();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("open");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
}

// ═══════════════════════════════════════════════════════════
//  REAL-TIME HEADER CLOCK
// ═══════════════════════════════════════════════════════════
function startLiveClock() {
  function tick() {
    const now = new Date();
    document.getElementById("live-time").textContent = now.toLocaleTimeString("en-IN", { hour12: false });
    document.getElementById("live-date").textContent = now.toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }
  tick();
  setInterval(tick, 1000);
}

// ═══════════════════════════════════════════════════════════
//  WORLD CLOCK
// ═══════════════════════════════════════════════════════════
function startWorldClock() {
  updateWorldClock();
  clearInterval(worldClockTimer);
  worldClockTimer = setInterval(updateWorldClock, 1000);
}

function updateWorldClock() {
  const zone = document.getElementById("timezone-select").value;
  const now  = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { timeZone: zone, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { timeZone: zone, weekday: "short", year: "numeric", month: "short", day: "numeric" });

  document.getElementById("world-clock-time").textContent = timeStr;
  document.getElementById("world-clock-zone").textContent = ZONE_LABELS[zone] || zone;
  document.getElementById("world-clock-date").textContent = dateStr;
  updateMiniClocks();
}

function buildMiniClocks() {
  const zones = [
    { key: "Asia/Kolkata", label: "IST" },
    { key: "Europe/London", label: "GMT" },
    { key: "America/New_York", label: "EST" },
    { key: "Asia/Tokyo", label: "JST" },
    { key: "Australia/Sydney", label: "AEST" },
  ];
  const container = document.getElementById("mini-clocks");
  container.innerHTML = zones.map(z =>
    `<div class="mini-clock-item">
       <div class="mini-clock-city">${z.label}</div>
       <div class="mini-clock-time" id="mc-${z.key.replace("/", "-")}">--:--</div>
     </div>`
  ).join("");
  updateMiniClocks();
}

function updateMiniClocks() {
  const zones = ["Asia/Kolkata","Europe/London","America/New_York","Asia/Tokyo","Australia/Sydney"];
  const now = new Date();
  zones.forEach(z => {
    const el = document.getElementById("mc-" + z.replace("/", "-"));
    if (el) el.textContent = now.toLocaleTimeString("en-US", { timeZone: z, hour12: false, hour: "2-digit", minute: "2-digit" });
  });
}

// ═══════════════════════════════════════════════════════════
//  SEARCH
// ═══════════════════════════════════════════════════════════
function searchCity() {
  const city = document.getElementById("city-input").value.trim();
  if (!city) { showError("Please enter a city name."); return; }
  fetchWeather(city);
}

function getLocationWeather() {
  if (!navigator.geolocation) { showError("Geolocation not supported."); return; }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const data = await apiFetch(
            `/weather/location?lat=${latitude}&lon=${longitude}`
        );
        renderWeather(data);
        fetchForecastAndRender(data.name);
        addToHistory(data.name);
      } catch (e) { showError(e.message); }
    },
    () => showError("Location access denied.")
  );
}

// ═══════════════════════════════════════════════════════════
//  API HELPERS
// ═══════════════════════════════════════════════════════════

/** Generic fetch wrapper that throws on OWM error codes */
async function apiFetch(url) {
  const res  = await fetch(url);
  const data = await res.json();
  if (data.cod && String(data.cod) !== "200" && data.cod !== 200) {
    throw new Error(data.message || "API error");
  }
  return data;
}

/** Fetch current weather then render */
async function fetchWeather(city) {
  showLoading();
  try {
    const data = await apiFetch( `/weather?city=${city}`);
    renderWeather(data);
    fetchForecastAndRender(city);
    addToHistory(city);
    recordAnalytics(data); // ← save to analytics store
  } catch (e) {
    showError(e.message || "Could not fetch weather.");
  }
}

/**
 * Fetch the 5-day / 3-hour forecast, then:
 *   1. Render the temperature trend chart
 *   2. Render the forecast early-warning cards
 */
async function fetchForecastAndRender(city) {
  try {
   const data = await apiFetch(`/forecast?city=${encodeURIComponent(city)}`);
    renderChart(data.list);
    renderForecastWarnings(data.list);   // ← NEW: early warning system
  } catch (e) {
    console.warn("Forecast fetch failed:", e.message);
  }
}

// ═══════════════════════════════════════════════════════════
//  RENDER CURRENT WEATHER
// ═══════════════════════════════════════════════════════════
function renderWeather(data) {
  hideLoading();
  hideError();

  document.getElementById("weather-result").classList.remove("hidden");
  document.getElementById("weather-card").classList.remove("hidden");

  // Extract
  const temp        = Math.round(data.main.temp);
  const feelsLike   = Math.round(data.main.feels_like);
  const humidity    = data.main.humidity;
  const windKmh     = Math.round(data.wind.speed * 3.6);
  const pressure    = data.main.pressure;
  const visibility  = data.visibility ? (data.visibility / 1000).toFixed(1) + " km" : "N/A";
  const clouds      = data.clouds?.all ?? "N/A";
  const condition   = data.weather[0]?.main ?? "Unknown";
  const description = data.weather[0]?.description ?? "";
  const iconCode    = data.weather[0]?.icon;
  const condCode    = data.weather[0]?.id;

  // Populate DOM
  document.getElementById("city-name").textContent    = data.name;
  document.getElementById("country-name").textContent = `${data.sys?.country ?? ""} — Lat ${data.coord?.lat?.toFixed(2)}, Lon ${data.coord?.lon?.toFixed(2)}`;
  document.getElementById("weather-desc").textContent = description;
  document.getElementById("temp-display").textContent = `${temp}°C`;
  document.getElementById("weather-icon").src         = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  document.getElementById("weather-icon").alt         = description;
  document.getElementById("humidity").textContent     = `${humidity}%`;
  document.getElementById("wind-speed").textContent   = `${windKmh} km/h`;
  document.getElementById("pressure").textContent     = `${pressure} hPa`;
  document.getElementById("visibility").textContent   = visibility;
  document.getElementById("feels-like").textContent   = `${feelsLike}°C`;
  document.getElementById("cloud-cover").textContent  = `${clouds}%`;

  setBackground(condition, temp);

  const warnings = detectExtremeWeather(temp, windKmh, condCode);
  renderWarnings(warnings);

  const score = calcRiskScore(temp, humidity, windKmh, condCode);
  renderRiskScore(score);
  renderRecommendations(temp, humidity, windKmh, condCode, score);

  // Save non-OK alerts to persistent alert history
  const realAlerts = warnings.filter(w => w.type !== "ok");
  if (realAlerts.length > 0) {
    saveAlertsToHistory(data.name, realAlerts, score);
  }
}

// ═══════════════════════════════════════════════════════════
//  DYNAMIC BACKGROUND
// ═══════════════════════════════════════════════════════════
function setBackground(condition, temp) {
  document.body.className = document.body.className.replace(/\bbg-\S+/g, "").trim();
  const c = condition.toLowerCase();
  if      (c.includes("thunder") || c.includes("storm")) document.body.classList.add("bg-storm");
  else if (c.includes("drizzle") || c.includes("rain"))  document.body.classList.add("bg-rain");
  else if (c.includes("snow"))                            document.body.classList.add("bg-snow");
  else if (c.includes("cloud"))                           document.body.classList.add("bg-clouds");
  else if (c.includes("clear") && temp >= THRESHOLDS.heat) document.body.classList.add("bg-heat");
  else if (c.includes("clear"))                           document.body.classList.add("bg-clear");
  else                                                    document.body.classList.add("bg-default");
}

// ═══════════════════════════════════════════════════════════
//  EXTREME WEATHER DETECTION
// ═══════════════════════════════════════════════════════════
function detectExtremeWeather(temp, windKmh, condCode) {
  const warns = [];

  if (temp >= THRESHOLDS.heat) {
    warns.push({ type: "heat", icon: "fa-fire", title: "🌡️ Heatwave Warning",
      msg: `Temperature is ${temp}°C — dangerously high. Risk of heat stroke.` });
  }
  if (windKmh >= THRESHOLDS.wind) {
    warns.push({ type: "wind", icon: "fa-wind", title: "💨 Strong Wind Warning",
      msg: `Wind speed is ${windKmh} km/h. Flying debris and unsafe driving.` });
  }
  if (condCode) {
    const p = Math.floor(condCode / 100);
    if (p === 2) {
      warns.push({ type: "rain", icon: "fa-bolt", title: "⛈️ Thunderstorm Warning",
        msg: `Active thunderstorm detected (code ${condCode}). Stay indoors.` });
    } else if (p === 5 && condCode >= 502) {
      warns.push({ type: "rain", icon: "fa-cloud-showers-heavy", title: "🌧️ Heavy Rain Warning",
        msg: `Heavy to extreme rainfall (code ${condCode}). Possible flash floods.` });
    }
  }

  if (warns.length === 0) {
    warns.push({ type: "ok", icon: "fa-circle-check",
      title: "✅ No Extreme Conditions Detected",
      msg: "Current weather is within normal parameters." });
  }
  return warns;
}

function renderWarnings(warns) {
  document.getElementById("warnings-container").innerHTML = warns.map(w =>
    `<div class="warning-badge ${w.type}">
       <i class="fa-solid ${w.icon}"></i>
       <div><strong>${w.title}</strong><br>
       <span style="font-size:13px;opacity:.85">${w.msg}</span></div>
     </div>`
  ).join("");
}

// ═══════════════════════════════════════════════════════════
//  RISK SCORE (0–100)
// ═══════════════════════════════════════════════════════════
function calcRiskScore(temp, humidity, windKmh, condCode) {
  let score = 0;
  if (temp >= 25)    score += Math.min(30, ((temp - 25) / 20) * 30);
  if (windKmh >= 20) score += Math.min(25, ((windKmh - 20) / 80) * 25);
  if (condCode) {
    const p = Math.floor(condCode / 100);
    if      (p === 2)           score += 25;
    else if (condCode >= 504)   score += 25;
    else if (condCode >= 502)   score += 20;
    else if (condCode >= 500)   score += 10;
    else if (p === 3)           score += 5;
  }
  if (temp > 30 && humidity > 80) score += Math.min(10, (humidity - 80) / 2);
  return Math.min(100, Math.max(0, Math.round(score)));
}

function renderRiskScore(score) {
  document.getElementById("risk-score-val").textContent = score;
  const fill = document.getElementById("risk-bar-fill");
  fill.style.width = score + "%";

  let color, level;
  if      (score < 25) { color = "var(--risk-low)";      level = "LOW — Safe conditions."; }
  else if (score < 50) { color = "var(--risk-med)";      level = "MODERATE — Exercise caution."; }
  else if (score < 75) { color = "var(--risk-high)";     level = "HIGH — Take protective measures."; }
  else                 { color = "var(--risk-critical)";  level = "CRITICAL — Avoid outdoor activities."; }

  fill.style.background = `linear-gradient(90deg, ${color}88, ${color})`;
  document.getElementById("risk-score-val").style.color = color;
  document.getElementById("risk-level-text").textContent = `Risk Level: ${level}`;
}

// ═══════════════════════════════════════════════════════════
//  AI RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════
function renderRecommendations(temp, humidity, windKmh, condCode, score) {
  const recs = [];
  const p = condCode ? Math.floor(condCode / 100) : 0;

  if      (temp >= 42)  recs.push("🚨 EXTREME HEAT: Avoid all outdoor activity. Seek air-conditioned shelter immediately. Hydrate every 15–20 min.");
  else if (temp >= 35)  recs.push("☀️ Heatwave active: Limit outdoor exposure to early morning/evening. Wear light, light-coloured clothing.");
  else if (temp >= 28)  recs.push("🌤 Warm weather: Stay hydrated (2–3L/day). Use SPF 50+ sunscreen.");
  else if (temp <= 5)   recs.push("🥶 Cold weather: Layer clothing and cover extremities. Watch for frost on roads.");
  else                  recs.push("🌡 Temperature is comfortable. No special precautions needed.");

  if      (windKmh >= 90) recs.push("🌪 GALE FORCE: Do NOT drive. Secure all outdoor objects. Critical infrastructure alert.");
  else if (windKmh >= 50) recs.push("💨 Strong winds: Drive cautiously. Secure loose outdoor items.");
  else if (windKmh >= 30) recs.push("🌬 Breezy: Hold onto loose documents and headwear.");

  if      (p === 2)                           recs.push("⛈ Thunderstorm: Unplug electronics. Avoid open fields and tall trees.");
  else if (condCode >= 502 && condCode < 600) recs.push("🌧 Heavy rain: Risk of flash flooding. Avoid waterways.");
  else if (p === 5)                           recs.push("🌦 Rain expected: Carry a waterproof jacket. Allow extra commute time.");

  if      (humidity > 85 && temp > 28) recs.push("💧 High humidity + heat raises heat index significantly. Minimize strenuous activity.");
  else if (humidity < 20)              recs.push("🏜 Very low humidity: Risk of dehydration. Use a humidifier indoors.");

  if      (score >= 75) recs.push("🛡 HIGH RISK: Activate emergency kit. Monitor civil defense alerts continuously.");
  else if (score >= 50) recs.push("⚠️ MODERATE RISK: Inform family of your plans. Keep phone charged.");
  else if (score >= 25) recs.push("📻 LOW-MODERATE: Check local weather updates for the next 6 hours.");
  else                  recs.push("✔️ Conditions safe for normal daily activities.");

  document.getElementById("recommendations-list").innerHTML = recs.map(r => `<li>${r}</li>`).join("");
}

// ═══════════════════════════════════════════════════════════
//  FORECAST EARLY WARNING SYSTEM  ← NEW FEATURE
// ═══════════════════════════════════════════════════════════

/**
 * Takes the raw OWM forecast list (40 × 3-hour slots),
 * groups them into up to 5 daily summaries, calculates a
 * risk level for each day, and renders warning cards.
 */
function renderForecastWarnings(forecastList) {
  const section = document.getElementById("forecast-warning-section");
  const cardsEl = document.getElementById("forecast-warning-cards");

  // Group by calendar date
  const byDay = {};
  forecastList.forEach(item => {
    const date = new Date(item.dt_txt);
    const key  = date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(item);
  });

  // Take up to 5 days
  const days = Object.entries(byDay).slice(0, 5);

  let hasWarning = false;

  cardsEl.innerHTML = days.map(([dateLabel, items]) => {
    // Worst-case values for the day
    const maxTemp  = Math.max(...items.map(i => i.main.temp_max));
    const maxWind  = Math.max(...items.map(i => i.wind.speed * 3.6));
    const maxHumid = Math.max(...items.map(i => i.main.humidity));
    // Use the OWM condition code from midday slot if available, else first slot
    const midItem  = items[Math.floor(items.length / 2)];
    const condCode = midItem.weather[0]?.id;
    const desc     = midItem.weather[0]?.description ?? "";
    const icon     = midItem.weather[0]?.icon;
    const score    = calcRiskScore(Math.round(maxTemp), maxHumid, Math.round(maxWind), condCode);

    // Map score to risk level label + CSS class
    let riskLabel, riskClass, cardClass;
    if      (score >= 75) { riskLabel = "Extreme"; riskClass = "extreme"; cardClass = "risk-extreme"; hasWarning = true; }
    else if (score >= 50) { riskLabel = "High";    riskClass = "high";    cardClass = "risk-high";    hasWarning = true; }
    else if (score >= 25) { riskLabel = "Medium";  riskClass = "medium";  cardClass = "risk-med"; }
    else                  { riskLabel = "Low";     riskClass = "low";     cardClass = "risk-low"; }

    return `
      <div class="fw-card ${cardClass}">
        <div class="fw-date">${dateLabel}</div>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" style="width:40px;height:40px" />
        <div class="fw-temp">${Math.round(maxTemp)}°C</div>
        <div class="fw-desc">${desc}</div>
        <div class="fw-wind" style="font-size:11px;color:var(--text-dim);margin-top:2px">
          💨 ${Math.round(maxWind)} km/h
        </div>
        <span class="fw-risk ${riskClass}">${riskLabel}</span>
      </div>`;
  }).join("");

  // Show the section only when we have data
  section.classList.toggle("hidden", days.length === 0);

  // If there are high/extreme days coming up, add a banner
  const banner = document.getElementById("fw-alert-banner");
  if (banner) banner.remove(); // remove old banner if any

  if (hasWarning) {
    const b = document.createElement("p");
    b.id = "fw-alert-banner";
    b.style.cssText = "margin-bottom:12px;font-size:13px;color:var(--warn-heat);font-weight:600;display:flex;align-items:center;gap:6px";
    b.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Dangerous conditions forecast in the next 5 days. Review each day carefully.`;
    cardsEl.parentElement.insertBefore(b, cardsEl);
  }
}

// ═══════════════════════════════════════════════════════════
//  TEMPERATURE TREND CHART (Chart.js)
// ═══════════════════════════════════════════════════════════
function renderChart(forecastList) {
  // Pick one data point per day (every 8 slots = 24 hrs)
  const daily = [];
  for (let i = 0; i < forecastList.length; i += 8) {
    if (daily.length >= 5) break;
    daily.push(forecastList[i]);
  }

  const labels = daily.map(d =>
      new Date(d.dt_txt).toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric"
      })
  );
  const temps    = daily.map(d => Math.round(d.main.temp));
  const maxTemps = daily.map(d => Math.round(d.main.temp_max));
  const minTemps = daily.map(d => Math.round(d.main.temp_min));

  if (tempChart) tempChart.destroy();

  const ctx = document.getElementById("temp-chart").getContext("2d");
  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Avg (°C)", data: temps, borderColor: "#00d4ff", backgroundColor: "rgba(0,212,255,0.08)",
          fill: true, tension: 0.4, pointBackgroundColor: "#00d4ff", pointRadius: 5, pointHoverRadius: 7, borderWidth: 2 },
        { label: "Max (°C)", data: maxTemps, borderColor: "#ff6b35", borderDash: [5,4], tension: 0.4, pointRadius: 3, borderWidth: 1.5, backgroundColor: "transparent" },
        { label: "Min (°C)", data: minTemps, borderColor: "#4db8ff", borderDash: [5,4], tension: 0.4, pointRadius: 3, borderWidth: 1.5, backgroundColor: "transparent" },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#7a95b8", font: { family: "Inter", size: 11 } } },
        tooltip: {
          backgroundColor: "#111827", borderColor: "#1e2d45", borderWidth: 1,
          titleColor: "#e8f0fe", bodyColor: "#7a95b8",
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}°C` },
        },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { color: "#4a6380", font: { family: "Inter", size: 11 } } },
        y: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { color: "#4a6380", font: { family: "Inter", size: 11 }, callback: v => v + "°C" } },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════
//  MULTI-CITY DASHBOARD
// ═══════════════════════════════════════════════════════════
async function loadDashboard() {
  const grid = document.getElementById("dashboard-grid");
  grid.innerHTML = `<div class="dash-loading"><div class="spin-ring small"></div> Scanning ${DASHBOARD_CITIES.length} cities…</div>`;

  const results = await Promise.allSettled(
    DASHBOARD_CITIES.map(city =>
      apiFetch(`/weather?city=${encodeURIComponent(city)}`)
    )
  );

  grid.innerHTML = "";

  results.forEach((result, idx) => {
    const city = DASHBOARD_CITIES[idx];
    if (result.status === "rejected") {
      grid.innerHTML += `<div class="city-card"><div class="cc-city">${city}</div><p style="color:var(--text-dim);font-size:13px;margin-top:8px">⚠️ Failed to load.</p></div>`;
      return;
    }

    const d        = result.value;
    const temp     = Math.round(d.main.temp);
    const humidity = d.main.humidity;
    const windKmh  = Math.round(d.wind.speed * 3.6);
    const condCode = d.weather[0]?.id;
    const desc     = d.weather[0]?.description ?? "";
    const icon     = d.weather[0]?.icon;
    const pressure = d.main.pressure;
    const score    = calcRiskScore(temp, humidity, windKmh, condCode);

    let alertClass = "";
    const pf = condCode ? Math.floor(condCode / 100) : 0;
    if      (temp >= THRESHOLDS.heat)                          alertClass = "alert-heat";
    else if (windKmh >= THRESHOLDS.wind)                       alertClass = "alert-wind";
    else if (pf === 2 || (pf === 5 && condCode >= 502))        alertClass = "alert-rain";

    let badge = "SAFE", badgeClass = "safe";
    if      (score >= 75) { badge = "CRITICAL"; badgeClass = "critical"; }
    else if (score >= 50) { badge = "DANGER";   badgeClass = "danger"; }
    else if (score >= 25) { badge = "CAUTION";  badgeClass = "caution"; }

    let riskColor = "var(--risk-low)";
    if      (score >= 75) riskColor = "var(--risk-critical)";
    else if (score >= 50) riskColor = "var(--risk-high)";
    else if (score >= 25) riskColor = "var(--risk-med)";

    grid.innerHTML += `
      <div class="city-card ${alertClass}" onclick="searchByDashCity('${city}')" title="Click for full details">
        <div class="cc-header">
          <div class="cc-city">${city}</div>
          <div class="cc-icon"><img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" /></div>
        </div>
        <div class="cc-temp">${temp}°C</div>
        <div class="cc-desc">${desc}</div>
        <div class="cc-stats">
          <div class="cc-stat">💧 Humidity: <span>${humidity}%</span></div>
          <div class="cc-stat">💨 Wind: <span>${windKmh} km/h</span></div>
          <div class="cc-stat">⬇ Pressure: <span>${pressure} hPa</span></div>
          <div class="cc-stat">☁ Clouds: <span>${d.clouds?.all ?? "—"}%</span></div>
        </div>
        <div class="cc-risk-row">
          <div>
            <div class="cc-risk-label">Risk Score</div>
            <div class="cc-risk-val" style="color:${riskColor}">${score}</div>
            <span class="cc-badge ${badgeClass}">${badge}</span>
          </div>
          <div class="cc-risk-mini">
            <div class="cc-risk-mini-fill" style="width:${score}%;background:${riskColor}"></div>
          </div>
        </div>
      </div>`;
  });
}

function searchByDashCity(city) {
  document.getElementById("city-input").value = city;
  fetchWeather(city);
  document.getElementById("weather-result").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ═══════════════════════════════════════════════════════════
//  SEARCH HISTORY
// ═══════════════════════════════════════════════════════════
function addToHistory(city) {
  const norm = city.trim();
  searchHistory = [norm, ...searchHistory.filter(c => c.toLowerCase() !== norm.toLowerCase())].slice(0, 8);
  localStorage.setItem("ww_history", JSON.stringify(searchHistory));
  renderHistory();
}

function renderHistory() {
  const el = document.getElementById("history-list");
  el.innerHTML = searchHistory.length === 0
    ? "<span style='font-size:12px;color:var(--text-dim)'>No searches yet.</span>"
    : searchHistory.map(c => `<span class="history-tag" onclick="searchFromHistory('${c}')">${c}</span>`).join("");
}

function searchFromHistory(city) {
  document.getElementById("city-input").value = city;
  fetchWeather(city);
}

// ═══════════════════════════════════════════════════════════
//  ALERT HISTORY MODULE  ← NEW FEATURE
// ═══════════════════════════════════════════════════════════

/**
 * saveAlertsToHistory — called every time real warnings are detected.
 * Stores an entry per alert type in localStorage.
 */
function saveAlertsToHistory(city, warns, score) {
  const now = new Date();
  warns.forEach(w => {
    alertHistory.unshift({
      id:        Date.now() + Math.random(), // unique id
      city,
      type:      w.type,
      title:     w.title,
      score,
      timestamp: now.toISOString(),
    });
  });

  // Keep last 100 alerts
  alertHistory = alertHistory.slice(0, 100);
  localStorage.setItem("ww_alerts", JSON.stringify(alertHistory));

  // Update badge immediately
  updateAlertBadge();
}

/** Update the sidebar badge showing alert count */
function updateAlertBadge() {
  const badge = document.getElementById("alert-nav-badge");
  if (!badge) return;
  badge.textContent  = alertHistory.length;
  badge.setAttribute("data-count", alertHistory.length);
  badge.style.display = alertHistory.length > 0 ? "inline-block" : "none";
}

/** Render the full alert history list on the Alerts page */
function renderAlertHistory() {
  const container = document.getElementById("alert-history-list");
  if (alertHistory.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-shield-check"></i>
        <p>No alerts recorded yet. Alerts appear here when extreme weather is detected.</p>
      </div>`;
    return;
  }

  // Icon map for alert types
  const iconMap = { heat: "fa-fire", wind: "fa-wind", rain: "fa-cloud-showers-heavy", storm: "fa-bolt" };

  container.innerHTML = alertHistory.map(a => {
    const dt       = new Date(a.timestamp);
    const dateStr  = dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const timeStr  = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const icon     = iconMap[a.type] || "fa-triangle-exclamation";
    const typeClass = a.type === "rain" && a.title.includes("Thunder") ? "storm" : a.type;

    // Score color
    let scoreColor = "var(--risk-low)";
    if      (a.score >= 75) scoreColor = "var(--risk-critical)";
    else if (a.score >= 50) scoreColor = "var(--risk-high)";
    else if (a.score >= 25) scoreColor = "var(--risk-med)";

    return `
      <div class="alert-history-item">
        <div class="ahi-icon ${typeClass}">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div class="ahi-body">
          <div class="ahi-title">${a.title}</div>
          <div class="ahi-city">📍 ${a.city} &nbsp;·&nbsp; ${dateStr} at ${timeStr}</div>
        </div>
        <div class="ahi-meta">
          <div class="ahi-score" style="color:${scoreColor}">${a.score}</div>
          <div class="ahi-time">Risk Score</div>
        </div>
      </div>`;
  }).join("");
}

/** Clear all stored alerts */
function clearAlertHistory() {
  if (!confirm("Clear all alert history? This cannot be undone.")) return;
  alertHistory = [];
  localStorage.setItem("ww_alerts", JSON.stringify(alertHistory));
  updateAlertBadge();
  renderAlertHistory();
}

// ═══════════════════════════════════════════════════════════
//  ANALYTICS — data recording  ← NEW FEATURE
// ═══════════════════════════════════════════════════════════

/**
 * recordAnalytics — called every time weather is successfully fetched.
 * Accumulates stats in localStorage.
 */
function recordAnalytics(data) {
  // Initialise structure if missing
  if (!analyticsData.totalSearches) {
    analyticsData = {
      totalSearches: 0,
      cityCount: {},
      tempLog: [],          // last 50 entries: { city, temp, condition, score, time }
      highestTemp: null,    // { temp, city }
      riskBuckets: [0,0,0,0], // [low, medium, high, critical]
      totalAlerts: 0,
    };
  }

  const temp     = Math.round(data.main.temp);
  const humidity = data.main.humidity;
  const windKmh  = Math.round(data.wind.speed * 3.6);
  const condCode = data.weather[0]?.id;
  const condition = data.weather[0]?.main ?? "Unknown";
  const city      = data.name;
  const score     = calcRiskScore(temp, humidity, windKmh, condCode);

  // Increment counters
  analyticsData.totalSearches++;
  analyticsData.cityCount[city] = (analyticsData.cityCount[city] || 0) + 1;

  // Highest temp ever recorded
  if (!analyticsData.highestTemp || temp > analyticsData.highestTemp.temp) {
    analyticsData.highestTemp = { temp, city };
  }

  // Risk distribution buckets
  if      (score >= 75) analyticsData.riskBuckets[3]++;
  else if (score >= 50) analyticsData.riskBuckets[2]++;
  else if (score >= 25) analyticsData.riskBuckets[1]++;
  else                  analyticsData.riskBuckets[0]++;

  // Alert count
  const warnings = detectExtremeWeather(temp, windKmh, condCode);
  if (warnings.some(w => w.type !== "ok")) analyticsData.totalAlerts++;

  // Temperature log (newest first, cap at 50)
  analyticsData.tempLog.unshift({
    city, temp, condition, score,
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  });
  analyticsData.tempLog = analyticsData.tempLog.slice(0, 50);

  localStorage.setItem("ww_analytics", JSON.stringify(analyticsData));
}

// ═══════════════════════════════════════════════════════════
//  ANALYTICS PAGE — rendering  ← NEW FEATURE
// ═══════════════════════════════════════════════════════════
function renderAnalyticsPage() {
  const d = analyticsData;
  const hasData = d.totalSearches > 0;

  // ── Stat Cards ──
  const allTemps    = (d.tempLog || []).map(e => e.temp);
  const avgTemp     = allTemps.length ? Math.round(allTemps.reduce((a,b) => a+b, 0) / allTemps.length) : "—";
  const mostCity    = d.cityCount ? Object.entries(d.cityCount).sort((a,b) => b[1]-a[1])[0] : null;
  const highestTemp = d.highestTemp ? `${d.highestTemp.temp}°C` : "—";

  document.getElementById("analytics-stats-row").innerHTML = `
    <div class="stat-card">
      <div class="stat-card-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
      <div class="stat-card-value">${d.totalSearches || 0}</div>
      <div class="stat-card-label">Total Searches</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon"><i class="fa-solid fa-city"></i></div>
      <div class="stat-card-value">${mostCity ? mostCity[0] : "—"}</div>
      <div class="stat-card-label">Most Searched City ${mostCity ? `(${mostCity[1]}×)` : ""}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon"><i class="fa-solid fa-temperature-half"></i></div>
      <div class="stat-card-value">${avgTemp}${avgTemp !== "—" ? "°C" : ""}</div>
      <div class="stat-card-label">Average Temperature</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:rgba(255,107,53,.15);color:var(--warn-heat)"><i class="fa-solid fa-fire"></i></div>
      <div class="stat-card-value" style="color:var(--warn-heat)">${highestTemp}</div>
      <div class="stat-card-label">Highest Temp Recorded ${d.highestTemp ? `(${d.highestTemp.city})` : ""}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:rgba(239,68,68,.15);color:var(--risk-critical)"><i class="fa-solid fa-bell"></i></div>
      <div class="stat-card-value" style="color:var(--risk-critical)">${d.totalAlerts || 0}</div>
      <div class="stat-card-label">Alerts Generated</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon"><i class="fa-solid fa-globe"></i></div>
      <div class="stat-card-value">${Object.keys(d.cityCount || {}).length}</div>
      <div class="stat-card-label">Unique Cities Searched</div>
    </div>`;

  // ── Risk Distribution Donut Chart ──
  if (riskDistChart) riskDistChart.destroy();
  const riskCtx = document.getElementById("risk-dist-chart").getContext("2d");
  const buckets = d.riskBuckets || [0,0,0,0];
  riskDistChart = new Chart(riskCtx, {
    type: "doughnut",
    data: {
      labels: ["Low (0–24)", "Medium (25–49)", "High (50–74)", "Critical (75–100)"],
      datasets: [{
        data: buckets,
        backgroundColor: ["rgba(34,197,94,.7)","rgba(245,197,24,.7)","rgba(255,107,53,.7)","rgba(239,68,68,.7)"],
        borderColor:     ["#22c55e","#f5c518","#ff6b35","#ef4444"],
        borderWidth: 1,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: "#7a95b8", font: { family: "Inter", size: 11 }, padding: 14 } },
        tooltip: {
          backgroundColor: "#111827", borderColor: "#1e2d45", borderWidth: 1,
          titleColor: "#e8f0fe", bodyColor: "#7a95b8",
        },
      },
      cutout: "62%",
    },
  });

  // ── Searches Per City Bar Chart ──
  if (citySearchChart) citySearchChart.destroy();
  const cityCtx   = document.getElementById("city-search-chart").getContext("2d");
  const cityEntries = Object.entries(d.cityCount || {}).sort((a,b) => b[1]-a[1]).slice(0, 10);
  citySearchChart = new Chart(cityCtx, {
    type: "bar",
    data: {
      labels: cityEntries.map(e => e[0]),
      datasets: [{
        label: "Searches",
        data:  cityEntries.map(e => e[1]),
        backgroundColor: "rgba(0,212,255,.3)",
        borderColor: "#00d4ff",
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#111827", borderColor: "#1e2d45", borderWidth: 1,
          titleColor: "#e8f0fe", bodyColor: "#7a95b8",
        },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { color: "#4a6380", font: { family: "Inter", size: 11 } } },
        y: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { color: "#e8f0fe", font: { family: "Inter", size: 11 } } },
      },
    },
  });

  // ── Temperature Log Table ──
  const tbody = document.getElementById("temp-log-body");
  if (!d.tempLog || d.tempLog.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No data yet. Search for a city on the Dashboard.</td></tr>`;
    return;
  }

  // Score color helper
  const sc = s => s >= 75 ? "var(--risk-critical)" : s >= 50 ? "var(--risk-high)" : s >= 25 ? "var(--risk-med)" : "var(--risk-low)";

  tbody.innerHTML = d.tempLog.map(e => `
    <tr>
      <td><strong>${e.city}</strong></td>
      <td style="font-family:var(--font-display);font-weight:600">${e.temp}°C</td>
      <td style="text-transform:capitalize;color:var(--text-muted)">${e.condition}</td>
      <td style="color:${sc(e.score)};font-weight:600">${e.score}</td>
      <td style="color:var(--text-dim)">${e.time}</td>
    </tr>`).join("");
}

// ═══════════════════════════════════════════════════════════
//  GLOBAL WEATHER MAP (Leaflet.js)  ← NEW FEATURE
// ═══════════════════════════════════════════════════════════

/**
 * initLeafletMap — called when the Map page is first opened.
 * Creates a Leaflet map, adds markers for all cities,
 * fetches weather for each, and colours the markers by risk.
 */
async function initLeafletMap() {
  // Only initialise once
  if (leafletMap) return;

  // Check Leaflet is loaded
  if (typeof L === "undefined") {
    document.getElementById("leaflet-map").innerHTML =
      "<p style='padding:40px;color:var(--text-muted);text-align:center'>Leaflet.js failed to load. Check your internet connection.</p>";
    return;
  }

  // Create the map, centred on India
  leafletMap = L.map("leaflet-map", {
    center: [20, 78],
    zoom: 4,
    zoomControl: true,
  });

  // Add dark-style tile layer (free, no API key needed)
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '© <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(leafletMap);

  // Fetch weather for all map cities in parallel
  const results = await Promise.allSettled(
   MAP_CITIES.map(c =>
       apiFetch(`/weather?city=${encodeURIComponent(c.name)}`)
   )
  );

  // Place a coloured circle marker for each city
  results.forEach((result, idx) => {
    const cityInfo = MAP_CITIES[idx];

    if (result.status === "rejected") {
      // Grey marker for failed cities
      L.circleMarker([cityInfo.lat, cityInfo.lon], {
        radius: 8, color: "#4a6380", fillColor: "#4a6380", fillOpacity: 0.5, weight: 1,
      }).addTo(leafletMap).bindPopup(`<div class="map-popup-city">${cityInfo.name}</div><p style="color:var(--text-dim);font-size:12px">Data unavailable</p>`);
      return;
    }

    const d        = result.value;
    const temp     = Math.round(d.main.temp);
    const humidity = d.main.humidity;
    const windKmh  = Math.round(d.wind.speed * 3.6);
    const condCode = d.weather[0]?.id;
    const desc     = d.weather[0]?.description ?? "";
    const icon     = d.weather[0]?.icon;
    const score    = calcRiskScore(temp, humidity, windKmh, condCode);

    // Marker colour based on risk
    let markerColor = "#22c55e";   // Green — normal
    if      (score >= 75) markerColor = "#ef4444"; // Red — critical
    else if (score >= 50) markerColor = "#ff6b35"; // Orange — high
    else if (score >= 25) markerColor = "#f5c518"; // Yellow — moderate

    const marker = L.circleMarker([cityInfo.lat, cityInfo.lon], {
      radius: 10,
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 0.7,
      weight: 2,
    }).addTo(leafletMap);

    // Risk label for popup
    let riskLabel = "Low";
    if      (score >= 75) riskLabel = "🔴 Critical";
    else if (score >= 50) riskLabel = "🟠 High";
    else if (score >= 25) riskLabel = "🟡 Moderate";
    else                  riskLabel = "🟢 Normal";

    // Bind popup with weather info + "Load Details" button
    marker.bindPopup(`
      <div class="map-popup-city">${d.name}, ${d.sys?.country ?? ""}</div>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" style="width:32px;vertical-align:middle" />
      <span class="map-popup-temp">${temp}°C</span>
      <div class="map-popup-desc">${desc}</div>
      <div class="map-popup-risk" style="margin-top:6px">
        💧 ${humidity}% &nbsp; 💨 ${windKmh} km/h
      </div>
      <div class="map-popup-risk">Risk: <strong style="color:${markerColor}">${riskLabel} (${score})</strong></div>
      <button class="map-popup-btn" onclick="loadCityFromMap('${d.name}')">
        <i class="fa-solid fa-chart-line"></i> Load Full Details
      </button>
    `, { maxWidth: 220 });
  });
}

/** Called when user clicks "Load Full Details" in a map popup */
function loadCityFromMap(city) {
  // Switch to Dashboard page
  showPage("dashboard", document.querySelector('[data-page="dashboard"]'));
  // Trigger search
  document.getElementById("city-input").value = city;
  fetchWeather(city);
}

// ═══════════════════════════════════════════════════════════
//  UI STATE HELPERS
// ═══════════════════════════════════════════════════════════
function showLoading() {
  document.getElementById("weather-result").classList.remove("hidden");
  document.getElementById("loading-spinner").classList.remove("hidden");
  document.getElementById("error-msg").classList.add("hidden");
  document.getElementById("weather-card").classList.add("hidden");
}

function hideLoading() {
  document.getElementById("loading-spinner").classList.add("hidden");
}

function showError(msg) {
  document.getElementById("weather-result").classList.remove("hidden");
  document.getElementById("loading-spinner").classList.add("hidden");
  document.getElementById("weather-card").classList.add("hidden");

  const errBox  = document.getElementById("error-msg");
  const errText = document.getElementById("error-text");
  errBox.classList.remove("hidden");

  if      (msg.toLowerCase().includes("city not found") || msg.includes("404"))
    errText.textContent = "City not found. Double-check the spelling or try a nearby city.";
  else if (msg.includes("401") || msg.includes("invalid api"))
    errText.textContent = "Invalid API key. Please add your OpenWeatherMap key to script.js (line 1).";
  else if (msg.includes("429"))
    errText.textContent = "Rate limit reached. Wait a minute and try again.";
  else
    errText.textContent = msg || "Something went wrong. Please try again.";
}

function hideError() {
  document.getElementById("error-msg").classList.add("hidden");
}
async function loadAnalytics() {
    try {
        const data = await apiFetch("/analytics");

        document.getElementById("avg-temp").textContent =
            data.averageTemperature.toFixed(1) + "°C";

        document.getElementById("max-temp").textContent =
            data.maximumTemperature.toFixed(1) + "°C";

        document.getElementById("min-temp").textContent =
            data.minimumTemperature.toFixed(1) + "°C";

    } catch (e) {
        console.error(e);
    }
}
