// Vakantie-app Noord-Spanje 2026 — vanilla JS, mobiel-first.
// State = één object. Bewerken -> STATE aanpassen -> opslaan (debounced) -> realtime naar het andere apparaat.

let STATE = null;
let VIEW = "dashboard";
let SELDAY = null;              // geselecteerde dag in de dashboard-tijdlijn
let map = null, mapLayer = null;
const weatherCache = {};
const openCards = new Set();    // welke inklapkaarten open staan (bewaard over re-renders)

// Kleur per locatie/verblijf — op index, zodat nieuwe verblijven ook een kleur krijgen.
const PALETTE = ["#0ea5a4", "#6366f1", "#f59e0b", "#ec4899", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];
const stayIndex = (id) => STATE.stays.findIndex((s) => s.id === id);
const stayColor = (id) => { const i = stayIndex(id); return i < 0 ? "#868e96" : PALETTE[i % PALETTE.length]; };

const STATUS = {
  vast:          { label: "Vast",          color: "#2f9e44" },
  waarschijnlijk:{ label: "Waarschijnlijk", color: "#1c7ed6" },
  idee:          { label: "Idee",          color: "#f08c00" },
  uitzoeken:     { label: "Uitzoeken",     color: "#868e96" },
};
const PRIORITY = { must: "Must-see", nice: "Nice-to-have", idee: "Idee" };
const STAY_TYPES = ["camping", "appartement", "hotel", "onderweg"];

// Echte afstand + rijtijd (Google Maps) voor specifieke dagen; overschrijft de grove
// hemelsbrede schatting. Sommige dagen zijn meerdere ritten (sightseeing onderweg).
// ponytail: gekoppeld aan datum — deze reis ligt vast; verschuift een datum, pas dit mee aan.
const ROUTE_LEGS = {
  "2026-08-13": [
    { label: "Camping La Paz → Gijón (sightseeing)", km: 80, min: 60 },
    { label: "Gijón → Oviedo", km: 30, min: 30 },
  ],
  "2026-08-16": [
    { label: "Oviedo → Covadonga — binnendoor via Parque de Redes", km: 129, min: 156 },
    { label: "Covadonga → overnachting richting Potes (Riaño e.o.)", km: 70, min: 90 },
  ],
  "2026-08-17": [
    { label: "Riaño → Camping La Viorna (Potes), via Puerto de San Glorio", km: 55, min: 80 },
  ],
};

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

// Reisafstand op een verhuisdag: hemelsbreed × 1.3 wegfactor, afgerond op 10 km.
// ponytail: grove schatting uit coördinaten; null als een van beide plekken geen coords heeft.
function haversine([la1, lo1], [la2, lo2]) {
  const R = 6371, r = Math.PI / 180;
  const dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function travelKm(dateISO) {
  const days = [...STATE.days].sort((a, b) => a.date.localeCompare(b.date));
  const idx = days.findIndex((d) => d.date === dateISO);
  if (idx <= 0 || days[idx].stayId === days[idx - 1].stayId) return null;
  const a = stayById(days[idx - 1].stayId)?.coords, b = stayById(days[idx].stayId)?.coords;
  if (!a || !b) return null;
  return Math.round(haversine(a, b) * 1.3 / 10) * 10;
}

// Reis-info voor een dag: expliciete route-legs waar bekend, anders grove schatting.
// Geeft {km, min, legs} of null als het geen reisdag is.
function travelInfo(date) {
  const legs = ROUTE_LEGS[date];
  if (legs) return { km: legs.reduce((s, l) => s + l.km, 0), min: legs.reduce((s, l) => s + l.min, 0), legs };
  const km = travelKm(date);
  if (km == null) return null;
  return { km, min: Math.round(km / 70 * 60), legs: null }; // ~70 km/u voor regionale wegen
}
// "2 u 36" / "1 u 05" / "45 min"
function fmtDur(min) {
  min = Math.round(min);
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return `${h} u ${String(m).padStart(2, "0")}`;
  if (h) return `${h} u`;
  return `${m} min`;
}

// ---------- Reisplanner heenreis ----------
// Corridor NL → Asturië, cumulatieve wegkilometers vanaf het vertrekpunt (bij benadering).
const HEEN_START = "Utrecht";
const CORRIDOR = [
  { name: "Antwerpen", km: 150 }, { name: "Rijsel", km: 300 }, { name: "Parijs", km: 520 },
  { name: "Orléans", km: 640 }, { name: "Tours", km: 760 }, { name: "Poitiers", km: 870 },
  { name: "Bordeaux", km: 1090 }, { name: "Bayonne", km: 1280 }, { name: "San Sebastián", km: 1340 },
  { name: "Bilbao", km: 1440 }, { name: "Santander", km: 1540 }, { name: "Camping La Paz", km: 1650 },
];
// Rijmodel met twee jonge kinderen — knoppen om aan te draaien (ponytail: kalibreer op ervaring).
const DRIVE = { speed: 78, meal: 0.75, dayStart: 9, dayEnd: 19, arriveBy: 15 };

// Geef per dag terug hoe ver je komt bij een gegeven vertrektijd (uur, bv 12.5 = 12:30).
function planHeenreis(departHour) {
  const dest = CORRIDOR[CORRIDOR.length - 1].km;
  const stops = CORRIDOR.slice(0, -1); // mogelijke overnachtsteden onderweg
  const days = [];
  let pos = 0, start = departHour, n = 1;
  while (pos < dest - 1 && n <= 8) {
    const avail = Math.max(0.5, DRIVE.dayEnd - start - DRIVE.meal);
    const reach = pos + avail * DRIVE.speed;
    if (reach >= dest) {
      const driveH = (dest - pos) / DRIVE.speed;
      const meal = driveH > 3 ? DRIVE.meal : driveH > 1.5 ? 0.5 : 0;
      days.push({ n, from: pos, to: dest, city: "Camping La Paz", arrive: start + driveH + meal, driveH, final: true });
      pos = dest;
    } else {
      const city = stops.filter((s) => s.km > pos + 20)
        .reduce((a, b) => Math.abs(b.km - reach) < Math.abs(a.km - reach) ? b : a);
      days.push({ n, from: pos, to: city.km, city: city.name, driveH: (city.km - pos) / DRIVE.speed });
      pos = city.km;
    }
    start = DRIVE.dayStart; n++;
  }
  return days;
}
function renderHeenPlanner() {
  const depart = localStorage.getItem("heenreis-depart") || "12:00";
  return `<details class="card-d planner" id="heen-planner" ${openCards.has("heen-planner") ? "open" : ""}>
    <summary>
      <span class="sum-main">
        <span class="sum-name">Reisplanner heenreis</span>
        <span class="sum-sub">Vertrektijd invullen → schatting per dag tot La Paz</span>
      </span>
    </summary>
    <div class="card-body">
      <label class="lbl">Vertrek woensdag 5 aug uit ${esc(HEEN_START)}</label>
      <input class="field" type="time" id="depart-time" value="${depart}">
      <div id="heen-out">${heenOutHTML(depart)}</div>
      <div class="muted" style="margin-top:12px">Schatting vanaf ${esc(HEEN_START)}, ~${DRIVE.speed} km/u incl. korte pauzes, warme maaltijd ~${Math.round(DRIVE.meal * 60)} min/dag, rijden tot ~${DRIVE.dayEnd}:00. Pas vertrekpunt of tempo naar wens aan.</div>
    </div>
  </details>`;
}
function heenOutHTML(departStr) {
  const [h, m] = departStr.split(":").map(Number);
  const days = planHeenreis((h || 0) + (m || 0) / 60);
  const dateFor = (n) => { const d = new Date("2026-08-05T12:00:00"); d.setDate(d.getDate() + n - 1); return d; };
  const wdLong = (d) => d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "short" });
  const hm = (f) => { const H = Math.floor(f), M = Math.round((f - H) * 60); return `${H}:${String(M).padStart(2, "0")}`; };
  const rows = days.map((d) => {
    const dt = dateFor(d.n);
    if (d.final) {
      const late = d.arrive > DRIVE.arriveBy;
      return `<div class="hp-day${late ? " hp-late" : ""}">
        <div class="hp-date">${wdLong(dt)}</div>
        <div class="hp-body"><b>Aankomst Camping La Paz</b> rond ${hm(d.arrive)} ${late ? "⚠︎ na 15:00 — eerder weg of extra tussenstop" : "✓ ruim op tijd"}<br>
        <span class="muted">laatste ${Math.round(d.to - d.from)} km · ${fmtDur(d.driveH * 60)}</span></div></div>`;
    }
    return `<div class="hp-day">
      <div class="hp-date">${wdLong(dt)}</div>
      <div class="hp-body">Overnachten rond <b>${esc(d.city)}</b><br>
      <span class="muted">${Math.round(d.to - d.from)} km · ${fmtDur(d.driveH * 60)} rijden · ${d.n === 1 ? `vertrek ${departStr}` : `vanaf ${DRIVE.dayStart}:00`}</span></div></div>`;
  }).join("");
  const arriveISO = dateFor(days[days.length - 1].n).toISOString().slice(0, 10);
  let note = "";
  if (arriveISO < "2026-08-08") note = `<div class="hp-note">Je komt volgens deze schatting vóór 8 aug aan. La Paz is geboekt vanaf za 8 aug — je hebt marge om rustiger te rijden of onderweg een extra nacht te pakken.</div>`;
  else if (arriveISO > "2026-08-08") note = `<div class="hp-note hp-note-warn">Let op: je komt ná 8 aug aan, terwijl La Paz vanaf 8 aug geboekt is. Vertrek eerder of rijd de eerste dagen langer door.</div>`;
  return rows + note;
}

// Groepeer opeenvolgende dagen per verblijf (voor de reis-tijdlijn).
function dayGroups() {
  const days = [...STATE.days].sort((a, b) => a.date.localeCompare(b.date));
  const groups = [];
  let cur = null;
  for (const d of days) {
    if (!cur || cur.stayId !== d.stayId) { cur = { stayId: d.stayId, days: [] }; groups.push(cur); }
    cur.days.push(d);
  }
  return groups;
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
  if (VIEW === "dashboard") { loadDashboardWeather(); fillDayDetail(); }
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
  let big, phase;
  if (!started) { const c = daysBetween(today, t.startDate); big = `T-${c}`; phase = `nog ${c} ${c === 1 ? "dag" : "dagen"} tot vertrek`; }
  else if (!ended) { const c = daysBetween(t.startDate, today) + 1; big = `Dag ${c}`; phase = `dag ${c} van de reis`; }
  else { big = "Klaar"; phase = "reis afgerond"; }

  // Standaard geselecteerde dag: vandaag als die in de reis valt, anders de eerste dag.
  if (!SELDAY || !STATE.days.some((d) => d.date === SELDAY))
    SELDAY = STATE.days.some((d) => d.date === today) ? today : STATE.days[0]?.date;

  return `
  <div class="hero">
    <div class="hero-eyebrow">Noord-Spanje 2026</div>
    <div class="hero-big">${big}</div>
    <div class="hero-sub">${phase} · ${fmtDate(t.startDate, { day: "numeric", month: "short" })} – ${fmtDate(t.endDate, { day: "numeric", month: "short" })}</div>
  </div>
  <h2>Reisplanner</h2>
  ${renderHeenPlanner()}
  <h2>Waar zijn we</h2>
  ${renderJourney(today)}
  <h2>Deze dag</h2>
  <div id="day-detail"></div>
  <h2>Weer op de bestemming</h2>
  <div id="weather" class="weather">Weer laden…</div>
  <h2>Hoogtepunten</h2>
  <div class="chips">
    ${STATE.activities.filter((a) => a.priority === "must").map((a) => `<span class="chip">${esc(a.name)}</span>`).join("")}
  </div>`;
}

// Reis-tijdlijn: per locatie een inklapbaar blok met een bolletje per dag (klikbaar).
// Bolletje toont de weekdag (ma/di/wo…) + de datum; de subtitel toont reisafstand + -tijd.
function renderJourney(today) {
  const groups = dayGroups();
  const remembered = [...openCards].some((id) => id.startsWith("leg-"));
  // Standaard open: het blok met vandaag; anders (reis nog niet begonnen) het eerste.
  const defIdx = groups.findIndex((g) => g.days.some((d) => d.date === today));
  const openIdx = defIdx >= 0 ? defIdx : (today < STATE.trip.startDate ? 0 : groups.length - 1);
  return `<div class="journey">${groups.map((g, gi) => {
    const stay = stayById(g.stayId), c = stayColor(g.stayId);
    const first = g.days[0].date, last = g.days[g.days.length - 1].date;
    const info = travelInfo(first);
    const arr = info ? `≈ ${info.km} km · ${fmtDur(info.min)}` : (gi === 0 ? "vertrek" : "");
    const id = "leg-" + g.stayId;
    const open = remembered ? openCards.has(id) : gi === openIdx;
    const dots = g.days.map((d) => {
      const dt = new Date(d.date + "T12:00:00");
      const wd = dt.toLocaleDateString("nl-NL", { weekday: "short" }).replace(".", "");
      const cls = "jd" + (d.date === today ? " is-today" : "") + (d.date === SELDAY ? " is-sel" : "");
      return `<button class="${cls}" data-day="${d.date}" title="${esc(d.title)}"><i>${wd}</i><b>${dt.getDate()}</b></button>`;
    }).join("");
    return `<details class="card-d leg-d" id="${id}" ${open ? "open" : ""} style="--c:${c}">
      <summary>
        <span class="sum-dot"></span>
        <span class="sum-main">
          <span class="sum-name">${esc(stay?.name || "—")}</span>
          <span class="sum-sub">${fmtDate(first, { day: "numeric", month: "short" })} – ${fmtDate(last, { day: "numeric", month: "short" })} · ${g.days.length} ${g.days.length === 1 ? "dag" : "dagen"}${arr ? ` · ${arr}` : ""}</span>
        </span>
      </summary>
      <div class="card-body"><div class="leg-days">${dots}</div></div>
    </details>`;
  }).join("")}</div>`;
}

// Detailkaart voor de geselecteerde dag (klik op een bolletje).
function fillDayDetail() {
  const el = $("#day-detail");
  if (el) el.innerHTML = dayDetailHTML(SELDAY);
}
function dayDetailHTML(date) {
  const d = STATE.days.find((x) => x.date === date);
  if (!d) return "";
  const stay = stayById(d.stayId), c = stayColor(d.stayId), st = STATUS[d.status];
  const info = travelInfo(date);
  const acts = d.activityIds.map((id) => activityById(id)).filter(Boolean);
  return `<div class="detail" style="--c:${c}">
    <div class="detail-head">
      <div><div class="detail-date">${fmtDate(date, { weekday: "long", day: "numeric", month: "long" })}</div>
        <div class="detail-title">${esc(d.title || "—")}</div></div>
      <span class="pill-static" style="background:${st?.color || "#868e96"}">${st?.label || esc(d.status)}</span>
    </div>
    <div class="detail-loc"><span class="loc-dot"></span><span>${esc(stay?.name || "—")}</span></div>
    ${stay?.location ? `<div class="detail-sub muted">${esc(stay.location)}</div>` : ""}
    ${info ? `<div class="detail-km">🚗 Reisdag · ≈ ${info.km} km · ${fmtDur(info.min)} rijden</div>
      ${info.legs ? `<div class="legs">${info.legs.map((l) => `<div class="leg-row"><span>${esc(l.label)}</span><span class="muted">${l.km} km · ${fmtDur(l.min)}</span></div>`).join("")}</div>` : ""}` : ""}
    ${acts.length ? `<div class="chips" style="margin-top:12px">${acts.map((a) => `<span class="chip">${esc(a.name)}</span>`).join("")}</div>` : ""}
    ${d.notes ? `<div class="detail-notes">${esc(d.notes)}</div>` : ""}
  </div>`;
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
    const stay = stayById(d.stayId), c = stayColor(d.stayId), st = STATUS[d.status];
    if (d.stayId !== lastStay) {
      out += `<div class="stay-head" style="--c:${c}"><span class="sum-dot"></span>${esc(stay?.name || "—")} <span class="muted">· ${esc(stay?.location || "")}</span></div>`;
      lastStay = d.stayId;
    }
    const info = travelInfo(d.date), id = "day-" + d.date;
    out += `<details class="card-d day-d" id="${id}" ${openCards.has(id) ? "open" : ""} style="--c:${c}">
      <summary>
        <span class="sum-main">
          <span class="sum-name">${fmtDate(d.date)}${info ? ` <span class="km-badge">🚗 ≈${info.km} km · ${fmtDur(info.min)}</span>` : ""}</span>
          <span class="sum-sub">${esc(d.title || "—")}</span>
        </span>
        <span class="pill-static" style="background:${st?.color || "#868e96"}">${st?.label || esc(d.status)}</span>
      </summary>
      <div class="card-body">
        <label class="lbl">Titel van de dag</label>
        <input class="field" data-bind="days.${i}.title" value="${esc(d.title)}">
        <div class="row2">
          <div><label class="lbl">Status</label>${statusSelect(`days.${i}.status`, d.status)}</div>
          <div><label class="lbl">Verblijf</label>
            <select class="field" data-bind="days.${i}.stayId">
              ${STATE.stays.map((s) => `<option value="${s.id}" ${s.id === d.stayId ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
            </select></div>
        </div>
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
      </div>
    </details>`;
  }
  return out;
}

// ---------- Verblijven ----------
function renderStays() {
  let out = `<h1>Verblijven</h1><button class="add" data-action="add-stay">+ Verblijf toevoegen</button>`;
  STATE.stays.forEach((s, i) => {
    const c = stayColor(s.id), st = STATUS[s.status], id = "stay-" + s.id;
    out += `<details class="card-d" id="${id}" ${openCards.has(id) ? "open" : ""} style="--c:${c}">
      <summary>
        <span class="sum-dot"></span>
        <span class="sum-main">
          <span class="sum-name">${esc(s.name)}</span>
          <span class="sum-sub">${fmtDate(s.startDate, { day: "numeric", month: "short" })}–${fmtDate(s.endDate, { day: "numeric", month: "short" })} · ${esc(s.location || s.type)}</span>
        </span>
        <span class="pill-static" style="background:${st?.color || "#868e96"}">${st?.label || esc(s.status)}</span>
      </summary>
      <div class="card-body">
        <label class="lbl">Naam</label>
        <input class="field" data-bind="stays.${i}.name" value="${esc(s.name)}">
        <div class="row2">
          <div><label class="lbl">Status</label>${statusSelect(`stays.${i}.status`, s.status)}</div>
          <div><label class="lbl">Type</label>
            <select class="field" data-bind="stays.${i}.type">
              ${STAY_TYPES.map((t) => `<option ${t === s.type ? "selected" : ""}>${t}</option>`).join("")}
            </select></div>
        </div>
        <div class="row2">
          <div><label class="lbl">Van</label><input class="field" type="date" data-bind="stays.${i}.startDate" value="${s.startDate}"></div>
          <div><label class="lbl">Tot</label><input class="field" type="date" data-bind="stays.${i}.endDate" value="${s.endDate}"></div>
        </div>
        <div class="row2">
          <div><label class="lbl">Locatie</label><input class="field" data-bind="stays.${i}.location" value="${esc(s.location)}"></div>
          <div><label class="lbl">Boeking</label><input class="field" data-bind="stays.${i}.booking" value="${esc(s.booking)}" placeholder="Ref / status"></div>
        </div>
        <label class="lbl">Website</label>
        <input class="field" data-bind="stays.${i}.website" value="${esc(s.website)}" placeholder="https://">
        <label class="lbl">Notities</label>
        <textarea class="field" data-bind="stays.${i}.notes" rows="2">${esc(s.notes)}</textarea>
        <button class="del" data-action="del-stay" data-i="${i}">Verwijderen</button>
      </div>
    </details>`;
  });
  return out;
}

// ---------- Activiteiten ----------
function renderActivities() {
  let out = `<h1>Activiteiten</h1><button class="add" data-action="add-act">+ Activiteit toevoegen</button>`;
  STATE.activities.forEach((a, i) => {
    const id = "act-" + a.id;
    out += `<details class="card-d" id="${id}" ${openCards.has(id) ? "open" : ""}>
      <summary>
        <span class="sum-main">
          <span class="sum-name">${esc(a.name)}</span>
          <span class="sum-sub">${esc(a.category)}${a.location ? " · " + esc(a.location) : ""}</span>
        </span>
        <span class="pri pri-${a.priority}">${PRIORITY[a.priority] || esc(a.priority)}</span>
      </summary>
      <div class="card-body">
        <label class="lbl">Naam</label>
        <input class="field" data-bind="activities.${i}.name" value="${esc(a.name)}">
        <div class="row2">
          <div><label class="lbl">Prioriteit</label>
            <select class="field" data-bind="activities.${i}.priority">
              ${Object.entries(PRIORITY).map(([k, v]) => `<option value="${k}" ${k === a.priority ? "selected" : ""}>${v}</option>`).join("")}
            </select></div>
          <div><label class="lbl">Categorie</label>
            <input class="field" data-bind="activities.${i}.category" value="${esc(a.category)}"></div>
        </div>
        <label class="lbl">Locatie</label>
        <input class="field" data-bind="activities.${i}.location" value="${esc(a.location)}">
        <label class="lbl">Notities</label>
        <textarea class="field" data-bind="activities.${i}.notes" rows="2">${esc(a.notes)}</textarea>
        <button class="del" data-action="del-act" data-i="${i}">Verwijderen</button>
      </div>
    </details>`;
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
  return `<h1>Checklist</h1>${section("actie", "Openstaande acties")}`;
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
  // Reisplanner: lokaal (localStorage), raakt de Supabase-reisdata niet.
  if (t.id === "depart-time") {
    localStorage.setItem("heenreis-depart", t.value);
    const out = $("#heen-out");
    if (out && t.value) out.innerHTML = heenOutHTML(t.value);
    return;
  }
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
  if (t.dataset.action === "day-add-act" && t.value) {
    STATE.days[+t.dataset.day].activityIds.push(t.value); save(); render();
  }
});
// Onthoud welke inklapkaarten open staan, zodat ze na een re-render open blijven.
document.addEventListener("toggle", (e) => {
  const d = e.target;
  if (d.tagName !== "DETAILS" || !d.id) return;
  if (d.open) openCards.add(d.id); else openCards.delete(d.id);
}, true);
// Klik op een dag-bolletje in de tijdlijn -> dagdetail tonen.
document.addEventListener("click", (e) => {
  const dot = e.target.closest(".jd");
  if (!dot) return;
  SELDAY = dot.dataset.day;
  document.querySelectorAll(".jd").forEach((x) => x.classList.toggle("is-sel", x === dot));
  fillDayDetail();
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
