// Vakantie-app Noord-Spanje 2026 — vanilla JS, mobiel-first.
// State = één object. Bewerken -> STATE aanpassen -> opslaan (debounced) -> realtime naar het andere apparaat.

let STATE = null;
let VIEW = "dashboard";
let map = null, mapLayer = null;
const weatherCache = {};

const STATUS = {
  vast:          { label: "Vast",          color: "#2f9e44" },
  waarschijnlijk:{ label: "Waarschijnlijk", color: "#1c7ed6" },
  idee:          { label: "Idee",          color: "#f08c00" },
  uitzoeken:     { label: "Uitzoeken",     color: "#868e96" },
};
const PRIORITY = { must: "Must-see", nice: "Nice-to-have", idee: "Idee" };
const STAY_TYPES = ["camping", "appartement", "hotel", "onderweg"];

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const todayISO = () => new Date().toISOString().slice(0, 10);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function fmtDate(iso, opts = { weekday: "short", day: "numeric", month: "short" }) {
  return new Date(iso + "T12:00:00").toLocaleDateString("nl-NL", opts);
}
function daysBetween(aISO, bISO) {
  return Math.round((new Date(bISO) - new Date(aISO)) / 86400000);
}
function getByPath(obj, path) { return path.split(".").reduce((o, k) => o?.[k], obj); }
function setByPath(obj, path, val) {
  const keys = path.split(".");
  const last = keys.pop();
  const t = keys.reduce((o, k) => o[k], obj);
  t[last] = val;
}
function stayById(id) { return STATE.stays.find((s) => s.id === id); }
function activityById(id) { return STATE.activities.find((a) => a.id === id); }
function uid(p) { return p + "-" + Math.random().toString(36).slice(2, 8); }

function verhuisdagen() {
  const days = [...STATE.days].sort((a, b) => a.date.localeCompare(b.date));
  const out = [];
  let prev = null;
  for (const d of days) { if (d.stayId !== prev) out.push(d.date); prev = d.stayId; }
  return out;
}

// ---------- persistence glue ----------
function save() {
  Store.save(STATE, {
    onSaved: () => setSync("Bewaard"),
    onError: (e) => setSync("Fout: " + e.message, true),
  });
  setSync("Opslaan…");
}
function setSync(txt, err = false) {
  const el = $("#sync");
  if (!el) return;
  el.textContent = txt;
  el.style.color = err ? "#e03131" : "var(--muted)";
}

// ---------- render ----------
function render() {
  $("#app").innerHTML = views[VIEW]();
  $$nav();
  if (VIEW === "kaart") setTimeout(drawMap, 0);
  if (VIEW === "dashboard") loadDashboardWeather();
}
function $$nav() {
  document.querySelectorAll(".nav-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === VIEW));
}

const views = {
  dashboard: renderDashboard,
  planning: renderPlanning,
  verblijven: renderStays,
  activiteiten: renderActivities,
  kaart: () => `<div id="map"></div>`,
  checklist: renderChecklist,
};

function statusSelect(path, value) {
  return `<select class="pill" data-bind="${path}" style="background:${STATUS[value]?.color || "#868e96"}">
    ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === value ? "selected" : ""}>${v.label}</option>`).join("")}
  </select>`;
}

// ---------- Dashboard ----------
function renderDashboard() {
  const t = STATE.trip, today = todayISO();
  const started = today >= t.startDate, ended = today > t.endDate;
  let countdown, phase;
  if (!started) { countdown = daysBetween(today, t.startDate); phase = `nog ${countdown} ${countdown === 1 ? "dag" : "dagen"} tot vertrek`; }
  else if (!ended) { countdown = daysBetween(t.startDate, today) + 1; phase = `dag ${countdown} van de reis`; }
  else phase = "reis afgerond";

  const curDay = STATE.days.find((d) => d.date === today);
  const curStay = curDay ? stayById(curDay.stayId) : null;
  const future = STATE.days.filter((d) => d.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const nextDay = future[0];
  const vh = verhuisdagen().filter((d) => d > today);
  const nextVh = vh[0];

  return `
  <h1>${esc(t.notes ? "Noord-Spanje 2026" : "")}</h1>
  <div class="hero">
    <div class="hero-big">${started && !ended ? `Dag ${countdown}` : (!started ? `T-${countdown}` : "Klaar")}</div>
    <div class="hero-sub">${phase} · ${fmtDate(t.startDate, { day: "numeric", month: "short" })} – ${fmtDate(t.endDate, { day: "numeric", month: "short" })}</div>
  </div>
  <div class="cards">
    ${card("Nu", curStay ? `${esc(curStay.name)}<div class="muted">${esc(curStay.location)}</div>` : "Nog niet vertrokken")}
    ${card("Volgende bestemming", nextDay ? `${esc(stayById(nextDay.stayId)?.name || "—")}<div class="muted">vanaf ${fmtDate(nextDay.date)}</div>` : "—")}
    ${card("Volgende verhuisdag", nextVh ? `${fmtDate(nextVh)}<div class="muted">over ${daysBetween(today, nextVh)} dagen</div>` : "Geen meer")}
    ${card("Open acties", `${STATE.todos.filter((x) => x.category === "actie" && !x.done).length} te doen`)}
  </div>
  <h2>Weer op de bestemming</h2>
  <div id="weather" class="weather">Weer laden…</div>
  <h2>Hoogtepunten</h2>
  <div class="chips">
    ${STATE.activities.filter((a) => a.priority === "must").map((a) => `<span class="chip">${esc(a.name)}</span>`).join("")}
  </div>`;
}
function card(title, body) {
  return `<div class="card"><div class="card-t">${title}</div><div class="card-b">${body}</div></div>`;
}

async function loadDashboardWeather() {
  const today = todayISO();
  // Eerstvolgende dag (of vandaag) waarvan het verblijf coördinaten heeft.
  const upcoming = STATE.days.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const day = upcoming.find((d) => stayById(d.stayId)?.coords) || STATE.days.find((d) => stayById(d.stayId)?.coords);
  const stay = day && stayById(day.stayId);
  const el = $("#weather");
  if (!el) return;
  if (!stay?.coords) { el.innerHTML = `<span class="muted">Geen coördinaten voor deze plek.</span>`; return; }
  try {
    const wx = await getWeather(stay.coords[0], stay.coords[1]);
    el.innerHTML = `<div class="muted" style="width:100%;margin-bottom:6px">${esc(stay.name)}</div>` +
      wx.time.slice(0, 5).map((d, i) =>
      `<div class="wx"><div>${fmtDate(d, { weekday: "short" })}</div>
       <div class="wx-e">${wmo(wx.code[i])}</div>
       <div>${Math.round(wx.tmax[i])}°<span class="muted">/${Math.round(wx.tmin[i])}°</span></div></div>`).join("");
  } catch (e) {
    el.innerHTML = `<span class="muted">Weer niet beschikbaar (geen internet?).</span>`;
  }
}
async function getWeather(lat, lon) {
  const key = lat.toFixed(2) + "," + lon.toFixed(2);
  if (weatherCache[key]) return weatherCache[key];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=7`;
  const r = await fetch(url);
  const j = await r.json();
  const wx = { time: j.daily.time, tmax: j.daily.temperature_2m_max, tmin: j.daily.temperature_2m_min, code: j.daily.weathercode };
  weatherCache[key] = wx;
  return wx;
}
function wmo(c) {
  if (c === 0) return "☀️"; if (c <= 3) return "⛅"; if (c <= 48) return "🌫️";
  if (c <= 57) return "🌦️"; if (c <= 67) return "🌧️"; if (c <= 77) return "🌨️";
  if (c <= 82) return "🌦️"; if (c <= 86) return "🌨️"; return "⛈️";
}

// ---------- Planning ----------
function renderPlanning() {
  const days = [...STATE.days].sort((a, b) => a.date.localeCompare(b.date));
  let out = `<h1>Planning</h1>`;
  let lastStay = null;
  for (const d of days) {
    const i = STATE.days.indexOf(d);
    const stay = stayById(d.stayId);
    if (d.stayId !== lastStay) {
      out += `<div class="stay-head">${esc(stay?.name || "—")} <span class="muted">· ${esc(stay?.location || "")}</span></div>`;
      lastStay = d.stayId;
    }
    out += `<div class="day">
      <div class="day-top">
        <div class="day-date">${fmtDate(d.date)}</div>
        ${statusSelect(`days.${i}.status`, d.status)}
      </div>
      <input class="field title" data-bind="days.${i}.title" value="${esc(d.title)}" placeholder="Titel van de dag">
      <label class="lbl">Verblijf</label>
      <select class="field" data-bind="days.${i}.stayId">
        ${STATE.stays.map((s) => `<option value="${s.id}" ${s.id === d.stayId ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
      </select>
      <label class="lbl">Activiteiten</label>
      <div class="chips">
        ${d.activityIds.map((aid) => `<span class="chip">${esc(activityById(aid)?.name || "?")}
           <button class="x" data-action="day-rm-act" data-day="${i}" data-act="${aid}">×</button></span>`).join("")}
        <select class="chip-add" data-action="day-add-act" data-day="${i}">
          <option value="">+ activiteit</option>
          ${STATE.activities.filter((a) => !d.activityIds.includes(a.id)).map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}
        </select>
      </div>
      <label class="lbl">Notities</label>
      <textarea class="field" data-bind="days.${i}.notes" rows="2" placeholder="Notitie">${esc(d.notes)}</textarea>
    </div>`;
  }
  return out;
}

// ---------- Verblijven ----------
function renderStays() {
  let out = `<h1>Verblijven</h1><button class="add" data-action="add-stay">+ Verblijf toevoegen</button>`;
  STATE.stays.forEach((s, i) => {
    out += `<div class="day">
      <div class="day-top">
        <input class="field title" data-bind="stays.${i}.name" value="${esc(s.name)}">
        ${statusSelect(`stays.${i}.status`, s.status)}
      </div>
      <div class="row2">
        <div><label class="lbl">Type</label>
          <select class="field" data-bind="stays.${i}.type">
            ${STAY_TYPES.map((t) => `<option ${t === s.type ? "selected" : ""}>${t}</option>`).join("")}
          </select></div>
        <div><label class="lbl">Boeking</label>
          <input class="field" data-bind="stays.${i}.booking" value="${esc(s.booking)}" placeholder="Ref / status"></div>
      </div>
      <div class="row2">
        <div><label class="lbl">Van</label><input class="field" type="date" data-bind="stays.${i}.startDate" value="${s.startDate}"></div>
        <div><label class="lbl">Tot</label><input class="field" type="date" data-bind="stays.${i}.endDate" value="${s.endDate}"></div>
      </div>
      <label class="lbl">Locatie</label>
      <input class="field" data-bind="stays.${i}.location" value="${esc(s.location)}">
      <label class="lbl">Coördinaten (lat, lon) — voor de kaart</label>
      <input class="field" data-action="coords" data-kind="stays" data-i="${i}" value="${s.coords ? s.coords.join(", ") : ""}" placeholder="43.15, -4.63">
      <label class="lbl">Website</label>
      <input class="field" data-bind="stays.${i}.website" value="${esc(s.website)}" placeholder="https://">
      <label class="lbl">Notities</label>
      <textarea class="field" data-bind="stays.${i}.notes" rows="2">${esc(s.notes)}</textarea>
      <button class="del" data-action="del-stay" data-i="${i}">Verwijderen</button>
    </div>`;
  });
  return out;
}

// ---------- Activiteiten ----------
function renderActivities() {
  let out = `<h1>Activiteiten</h1><button class="add" data-action="add-act">+ Activiteit toevoegen</button>`;
  STATE.activities.forEach((a, i) => {
    out += `<div class="day">
      <div class="day-top">
        <input class="field title" data-bind="activities.${i}.name" value="${esc(a.name)}">
      </div>
      <div class="row2">
        <div><label class="lbl">Prioriteit</label>
          <select class="field" data-bind="activities.${i}.priority">
            ${Object.entries(PRIORITY).map(([k, v]) => `<option value="${k}" ${k === a.priority ? "selected" : ""}>${v}</option>`).join("")}
          </select></div>
        <div><label class="lbl">Categorie</label>
          <input class="field" data-bind="activities.${i}.category" value="${esc(a.category)}"></div>
      </div>
      <label class="chk"><input type="checkbox" data-bind="activities.${i}.childFriendly" ${a.childFriendly ? "checked" : ""}> Kindvriendelijk</label>
      <label class="lbl">Locatie</label>
      <input class="field" data-bind="activities.${i}.location" value="${esc(a.location)}">
      <label class="lbl">Coördinaten (lat, lon)</label>
      <input class="field" data-action="coords" data-kind="activities" data-i="${i}" value="${a.coords ? a.coords.join(", ") : ""}" placeholder="43.15, -4.63">
      <label class="lbl">Notities</label>
      <textarea class="field" data-bind="activities.${i}.notes" rows="2">${esc(a.notes)}</textarea>
      <button class="del" data-action="del-act" data-i="${i}">Verwijderen</button>
    </div>`;
  });
  return out;
}

// ---------- Checklist ----------
function renderChecklist() {
  const section = (cat, title) => {
    const items = STATE.todos.filter((t) => t.category === cat);
    return `<h2>${title}</h2>
      ${items.map((t) => {
        const i = STATE.todos.indexOf(t);
        return `<label class="todo ${t.done ? "done" : ""}">
          <input type="checkbox" data-bind="todos.${i}.done" ${t.done ? "checked" : ""}>
          <input class="todo-txt" data-bind="todos.${i}.text" value="${esc(t.text)}">
          <button class="x" data-action="del-todo" data-i="${i}">×</button>
        </label>`;
      }).join("")}
      <button class="add sm" data-action="add-todo" data-cat="${cat}">+ toevoegen</button>`;
  };
  return `<h1>Checklist</h1>${section("actie", "Openstaande acties")}${section("paklijst", "Paklijst")}`;
}

// ---------- Kaart ----------
function drawMap() {
  const c = $("#map");
  if (!c || typeof L === "undefined") return;
  if (!map) {
    map = L.map(c);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: "© OpenStreetMap",
    }).addTo(map);
  }
  if (mapLayer) mapLayer.remove();
  mapLayer = L.layerGroup().addTo(map);
  const pts = [];
  // Route langs de verblijven (op volgorde).
  const routeStays = STATE.stays.filter((s) => s.coords);
  routeStays.forEach((s) => {
    pts.push(s.coords);
    L.marker(s.coords).addTo(mapLayer).bindPopup(`<b>${esc(s.name)}</b><br>${esc(s.location)}`);
  });
  if (routeStays.length > 1) L.polyline(routeStays.map((s) => s.coords), { color: "#1c7ed6", weight: 3, opacity: .6 }).addTo(mapLayer);
  // Activiteiten als kleine markers.
  STATE.activities.filter((a) => a.coords).forEach((a) => {
    L.circleMarker(a.coords, { radius: 6, color: "#f08c00", fillColor: "#f08c00", fillOpacity: .9 })
      .addTo(mapLayer).bindPopup(`<b>${esc(a.name)}</b><br>${esc(a.location)}`);
    pts.push(a.coords);
  });
  if (pts.length) map.fitBounds(pts, { padding: [30, 30] });
  else map.setView([43.2, -5.0], 8);
  map.invalidateSize();
}

// ---------- events (delegated) ----------
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.bind && t.type !== "checkbox" && t.tagName !== "SELECT") {
    setByPath(STATE, t.dataset.bind, t.value);
    save();
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.bind) {
    const val = t.type === "checkbox" ? t.checked : t.value;
    setByPath(STATE, t.dataset.bind, val);
    save();
    if (t.tagName === "SELECT" || t.type === "checkbox") render();
    return;
  }
  const a = t.dataset.action;
  if (a === "coords") {
    const parts = t.value.split(",").map((x) => parseFloat(x.trim()));
    STATE[t.dataset.kind][+t.dataset.i].coords = (parts.length === 2 && parts.every(Number.isFinite)) ? parts : null;
    save();
  } else if (a === "day-add-act" && t.value) {
    STATE.days[+t.dataset.day].activityIds.push(t.value); save(); render();
  }
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "day-rm-act") {
    const d = STATE.days[+b.dataset.day];
    d.activityIds = d.activityIds.filter((x) => x !== b.dataset.act); save(); render();
  } else if (a === "add-stay") {
    STATE.stays.push({ id: uid("s"), name: "Nieuw verblijf", type: "camping", status: "idee",
      startDate: todayISO(), endDate: todayISO(), location: "", coords: null, website: "", booking: "", notes: "" });
    save(); render();
  } else if (a === "del-stay") {
    if (confirm("Dit verblijf verwijderen?")) { STATE.stays.splice(+b.dataset.i, 1); save(); render(); }
  } else if (a === "add-act") {
    STATE.activities.push({ id: uid("a"), name: "Nieuwe activiteit", category: "idee", priority: "idee",
      childFriendly: true, coords: null, location: "", notes: "" });
    save(); render();
  } else if (a === "del-act") {
    if (confirm("Deze activiteit verwijderen?")) {
      const id = STATE.activities[+b.dataset.i].id;
      STATE.activities.splice(+b.dataset.i, 1);
      STATE.days.forEach((d) => d.activityIds = d.activityIds.filter((x) => x !== id));
      save(); render();
    }
  } else if (a === "add-todo") {
    STATE.todos.push({ id: uid("t"), text: "", category: b.dataset.cat, done: false }); save(); render();
  } else if (a === "del-todo") {
    STATE.todos.splice(+b.dataset.i, 1); save(); render();
  }
});
document.addEventListener("click", (e) => {
  const n = e.target.closest(".nav-btn");
  if (n) { VIEW = n.dataset.view; render(); }
});

// ---------- boot ----------
async function boot() {
  try {
    const { state, offline } = await Store.load();
    STATE = state;
    if (offline || !Store.configured) $("#banner").style.display = "block";
    render();
    Store.subscribe((remote) => {
      // Alleen overnemen als je niet net in een veld typt (voorkomt focus-verlies).
      if (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bind) return;
      STATE = remote; render(); setSync("Bijgewerkt vanaf ander apparaat");
    });
  } catch (e) {
    $("#app").innerHTML = `<div class="err">Kon niet laden: ${esc(e.message)}<br>Check config.js en schema.sql.</div>`;
  }
}
boot();
