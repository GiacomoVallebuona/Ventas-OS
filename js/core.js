"use strict";
/* Ventas OS — módulo: núcleo (utilidades, dominio, Store/Supabase, estado, agregaciones)
   Generado al separar ventas-os.html. Ámbito global compartido entre <script> clásicos. */

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };

  const money = (n) => {
    n = num(n);
    if (Math.abs(n) >= 1000000) return "$" + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
    if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
    return "$" + n.toLocaleString("es-PE", { maximumFractionDigits: 0 });
  };
  const moneyFull = (n) => "$" + num(n).toLocaleString("es-PE", { maximumFractionDigits: 0 });
  const pct = (n) => (isFinite(n) ? Math.round(n) : 0) + "%";

  const pad = (n) => String(n).padStart(2, "0");
  const dstr = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const todayStr = () => dstr(new Date());
  const parseDate = (s) => { const p = String(s).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const WD = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const longDate = (s) => { const d = parseDate(s); return d.getDate() + " de " + MONTHS[d.getMonth()] + ", " + d.getFullYear(); };

  function isoWeek(d) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = (t.getDay() + 6) % 7;
    t.setDate(t.getDate() - day + 3);
    const first = new Date(t.getFullYear(), 0, 4);
    const w = 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7);
    return t.getFullYear() + "-W" + pad(w);
  }

  /* ---------- Constantes de dominio ---------- */
  const STAGES = [
    { id: "lead", label: "Lead", color: "#94a3b8" },
    { id: "contacted", label: "Contactado", color: "#60a5fa" },
    { id: "meeting", label: "Reunión", color: "#818cf8" },
    { id: "diagnosis", label: "Diagnóstico", color: "#a78bfa" },
    { id: "proposal", label: "Propuesta", color: "#f59e0b" },
    { id: "negotiation", label: "Negociación", color: "#fb923c" },
    { id: "won", label: "Ganado", color: "#34d399" },
    { id: "lost", label: "Perdido", color: "#f87171" },
  ];
  const stageLabel = (id) => (STAGES.find((s) => s.id === id) || {}).label || id;
  const stageColor = (id) => (STAGES.find((s) => s.id === id) || {}).color || "#94a3b8";

  const CALL_STATUS = ["Nuevo lead", "Contactado", "Reunión agendada", "Seguimiento", "Propuesta enviada", "Negociación", "Cerrado ganado", "Cerrado perdido"];
  const CALL_RESULTS = ["Conectado", "No contestó", "Buzón de voz", "Reagendar", "Interesado", "No interesado"];
  const MEETING_STATUS = ["Programada", "Reprogramada", "Realizada", "Cancelada"];
  const MEETING_STATUS_COLOR = { "Programada": "#818cf8", "Reprogramada": "#fbbf24", "Realizada": "#34d399", "Cancelada": "#f87171" };

  // --- Módulo avanzado de leads ---
  const LEAD_STATES = ["Nuevo", "Contactado", "Interesado", "Cliente", "Descartado"];
  const LEAD_STATE_COLOR = { "Nuevo": "#818cf8", "Contactado": "#38bdf8", "Interesado": "#fbbf24", "Cliente": "#34d399", "Descartado": "#f87171" };
  const LEAD_GEO_OPTIONS = [
    ["Argentina", ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"]], ["Bolivia", ["La Paz", "Santa Cruz de la Sierra", "Cochabamba"]],
    ["Brasil", ["São Paulo", "Río de Janeiro", "Brasilia", "Belo Horizonte", "Curitiba"]], ["Chile", ["Santiago", "Valparaíso", "Concepción"]],
    ["Colombia", ["Bogotá", "Medellín", "Cali", "Barranquilla"]], ["Costa Rica", ["San José", "Alajuela"]], ["Cuba", ["La Habana"]],
    ["Ecuador", ["Quito", "Guayaquil", "Cuenca"]], ["El Salvador", ["San Salvador"]], ["Guatemala", ["Ciudad de Guatemala"]],
    ["Honduras", ["Tegucigalpa", "San Pedro Sula"]], ["México", ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana"]],
    ["Nicaragua", ["Managua"]], ["Panamá", ["Ciudad de Panamá"]], ["Paraguay", ["Asunción"]], ["Perú", ["Lima", "Arequipa", "Trujillo", "Cusco"]],
    ["Puerto Rico", ["San Juan"]], ["República Dominicana", ["Santo Domingo"]], ["Uruguay", ["Montevideo"]], ["Venezuela", ["Caracas", "Maracaibo", "Valencia"]],
    ["Alemania", ["Berlín", "Múnich", "Hamburgo", "Fráncfort"]], ["Austria", ["Viena", "Salzburgo"]], ["Bélgica", ["Bruselas", "Amberes"]],
    ["Bulgaria", ["Sofía"]], ["Croacia", ["Zagreb"]], ["Chipre", ["Nicosia"]], ["Dinamarca", ["Copenhague"]], ["Eslovaquia", ["Bratislava"]],
    ["Eslovenia", ["Liubliana"]], ["España", ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"]], ["Estonia", ["Tallin"]],
    ["Finlandia", ["Helsinki"]], ["Francia", ["París", "Lyon", "Marsella", "Toulouse"]], ["Grecia", ["Atenas", "Tesalónica"]],
    ["Hungría", ["Budapest"]], ["Irlanda", ["Dublín", "Cork"]], ["Islandia", ["Reikiavik"]], ["Italia", ["Roma", "Milán", "Nápoles", "Turín"]],
    ["Letonia", ["Riga"]], ["Lituania", ["Vilna"]], ["Luxemburgo", ["Luxemburgo"]], ["Malta", ["La Valeta"]], ["Noruega", ["Oslo", "Bergen"]],
    ["Países Bajos", ["Ámsterdam", "Róterdam", "Utrecht"]], ["Polonia", ["Varsovia", "Cracovia", "Wrocław"]], ["Portugal", ["Lisboa", "Oporto"]],
    ["Reino Unido", ["Londres", "Mánchester", "Birmingham", "Edimburgo"]], ["República Checa", ["Praga"]], ["Rumanía", ["Bucarest", "Cluj-Napoca"]],
    ["Serbia", ["Belgrado"]], ["Suecia", ["Estocolmo", "Gotemburgo"]], ["Suiza", ["Zúrich", "Ginebra", "Basilea"]], ["Turquía", ["Estambul", "Ankara", "Esmirna"]],
    ["Ucrania", ["Kyiv", "Leópolis"]]
  ];
  const geoCountryNames = () => LEAD_GEO_OPTIONS.map((x) => x[0]);
  const geoCitiesFor = (country) => (LEAD_GEO_OPTIONS.find((x) => x[0] === country) || ["", []])[1];
  const geoOptionsHTML = (items, selected) => items.map((x) => `<option value="${esc(x)}" ${x === selected ? "selected" : ""}>${esc(x)}</option>`).join("");
  const countryOptionsHTML = (selected) => `<option value="">— Seleccionar —</option>${geoOptionsHTML(geoCountryNames(), selected)}`;
  const cityOptionsHTML = (country, selected) => `<option value="">— Seleccionar —</option>${geoOptionsHTML(geoCitiesFor(country), selected)}`;
  // Paleta para etiquetas (tagDefs). Se reparte en orden al crear/sembrar etiquetas.
  const TAG_COLORS = ["#6366F1", "#34D399", "#FBBF24", "#F87171", "#38BDF8", "#A78BFA", "#FB923C", "#22D3EE", "#F472B6", "#A3E635", "#E879F9", "#2DD4BF"];
  const CC_LIST = ["1","7","20","27","30","31","32","33","34","36","39","40","41","43","44","45","46","47","48","49","51","52","53","54","55","56","57","58","60","61","62","63","64","65","66","81","82","84","86","90","91","92","93","94","95","98","212","213","216","234","237","248","249","250","251","254","255","256","260","263","264","351","352","353","354","355","356","357","358","359","370","371","372","373","374","375","376","377","378","380","381","385","386","387","389","420","421","423","501","502","503","504","505","506","507","508","509","511","590","591","592","593","594","595","596","597","598","599","670","673","674","675","676","677","678","679","680","685","852","853","855","856","880","886","960","961","962","963","964","965","966","967","968","970","971","972","973","974","975","976","977","992","993","994","995","996","998"];
  function splitPhone(raw) {
    let s = String(raw == null ? "" : raw).trim();
    const hasPlus = /^\s*\+/.test(s) || /^00\d/.test(s.replace(/\s/g, ""));
    let d = s.replace(/\D/g, "");
    if (/^00\d/.test(d)) d = d.slice(2);  // 00 prefijo internacional
    if (hasPlus && d) {
      for (const len of [3, 2, 1]) {
        const code = d.slice(0, len);
        if (CC_LIST.indexOf(code) >= 0) return { cc: "+" + code, num: d.slice(len) };
      }
      return { cc: "", num: d };
    }
    return { cc: "", num: d };
  }
  const leadComplete = (l) => !!(normPhone(l.phone) && (l.name || l.company));
  const FIELD_HINTS = {
    name: ["business name", "nombre", "name", "negocio", "empresa", "company", "razon", "razón", "comercio", "establecimiento"],
    phone: ["phone", "telefono", "teléfono", "tel", "celular", "movil", "móvil", "whatsapp", "número", "numero", "contacto", "mobile", "cell"],
    website: ["website", "web", "url", "sitio", "pagina", "página", "site", "dominio"],
    address: ["address", "direccion", "dirección", "domicilio", "calle", "ubicacion exacta", "street"],
    email: ["email", "correo", "mail", "e-mail", "e_mail"],
    hoursOpen: ["open", "apertura", "abre", "opening", "horario apertura", "hora apertura", "desde"],
    hoursClose: ["close", "cierre", "cierra", "closing", "horario cierre", "hora cierre", "hasta"],
    rating: ["rating", "estrellas", "stars", "calificacion", "calificación", "puntuacion", "puntuación", "score", "valoracion", "valoración", "promedio"],
    reviews: ["reviews", "reseñas", "resenas", "opiniones", "comentarios", "review count", "num reviews", "n reviews", "cantidad reseñas"],
    category: ["category", "categoria", "categoría", "rubro", "giro", "sector", "tipo de negocio", "type"],
    location: ["location", "ubicacion", "ubicación", "distrito", "zona", "region", "región", "provincia", "place", "departamento"],
    country: ["country", "pais", "país", "nation", "país de ubicación"],
    city: ["city", "ciudad", "municipio", "localidad"],
    industry: ["industry", "industria"],
  };
  const FIELD_LABEL = { name: "Nombre del negocio", phone: "Teléfono", website: "Sitio web", address: "Dirección", email: "Correo", hoursOpen: "Hora apertura", hoursClose: "Hora cierre", rating: "Calificación", reviews: "N° reseñas", category: "Categoría", location: "Ubicación", country: "País", city: "Ciudad", industry: "Industria" };
  const FIELD_KEYS = Object.keys(FIELD_LABEL);
  function autoDetectField(header) {
    const h = String(header || "").toLowerCase().trim();
    if (!h) return "";
    for (const f of FIELD_KEYS) { if (FIELD_HINTS[f].some((k) => h === k)) return f; }
    for (const f of FIELD_KEYS) { if (FIELD_HINTS[f].some((k) => h.includes(k))) return f; }
    return "";
  }
  const SCORE_KEYS = [
    { k: "rapport", label: "Rapport" },
    { k: "discovery", label: "Descubrimiento" },
    { k: "objections", label: "Manejo objeciones" },
    { k: "value", label: "Presentación de valor" },
    { k: "closing", label: "Cierre" },
    { k: "followup", label: "Seguimiento" },
  ];
  const PRIORITIES = [{ k: "high", label: "Alta", color: "#f87171" }, { k: "med", label: "Media", color: "#f59e0b" }, { k: "low", label: "Baja", color: "#60a5fa" }];
  const KB_CATS = ["Apertura", "Descubrimiento", "Manejo de objeciones", "Presentación de valor", "Cierre", "Caso de éxito", "Seguimiento"];

  /* ---------- Estado ---------- */
  const STORE_KEY = "ventasos:state:v1";

  // Persistencia en capas: window.storage (entorno Claude) -> localStorage (descargado/publicado) -> memoria.
  // Así la información se guarda sin importar dónde se abra el artefacto.
  const Store = (function () {
    let mode = "memory";
    const hasWS = typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";
    let hasLS = false;
    try { const k = "__vos_probe__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); hasLS = true; } catch (e) { hasLS = false; }
    async function load() {
      if (hasWS) { try { const r = await window.storage.get(STORE_KEY); if (r && r.value) { mode = "ws"; return r.value; } } catch (e) {} }
      if (hasLS) { try { const v = localStorage.getItem(STORE_KEY); if (v) { mode = "ls"; return v; } } catch (e) {} }
      mode = hasWS ? "ws" : (hasLS ? "ls" : "memory");
      return null;
    }
    async function save(str) {
      let ok = false;
      if (hasWS) { try { await window.storage.set(STORE_KEY, str); ok = true; mode = "ws"; } catch (e) {} }
      if (hasLS) { try { localStorage.setItem(STORE_KEY, str); ok = true; if (mode === "memory") mode = "ls"; } catch (e) {} }
      return ok;
    }
    return {
      load, save,
      get mode() { return mode; },
      get durable() { return hasWS || hasLS; },
      get label() { return mode === "ws" ? "Entorno Claude" : mode === "ls" ? "Navegador (local)" : "Solo memoria"; },
    };
  })();

  /* ---------- Almacenamiento en la nube (Supabase, espacio único) ---------- */
  const SUPA_URL = "https://ffiqhhoeokoyrdwlrazz.supabase.co";
  const SUPA_KEY = "sb_publishable_3asvM4Bh3q6qU-2O6B-tBw_-ukmLWhh";
  const WORKSPACE = "claude-sales-os-main";   // espacio fijo: un solo usuario, una sola base

  const Cloud = {
    get available() { return typeof fetch === "function" && !!SUPA_URL && !!SUPA_KEY; },
    async rpc(fn, body) {
      const res = await fetch(SUPA_URL + "/rest/v1/rpc/" + fn, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error("RPC " + fn + " " + res.status + (t ? " " + t.slice(0, 140) : "")); }
      const txt = await res.text();
      return txt ? JSON.parse(txt) : null;
    },
    async load() { return this.rpc("vos_load", { p_code: WORKSPACE }); },
    async save(data) { return this.rpc("vos_save", { p_code: WORKSPACE, p_data: data }); },
  };

  let cloudStatus = "idle";   // idle | saving | saved | offline | local
  let cloudTimer = null, retryTimer = null, warnedBlocked = false, pendingPush = false, listenersBound = false;

  function setCloud(s) { cloudStatus = s; updateCloudBadge(); }
  function scheduleCloud() { clearTimeout(cloudTimer); cloudTimer = setTimeout(cloudPush, 900); }

  function startRetry() {
    if (retryTimer || !Cloud.available) return;
    retryTimer = setInterval(() => { if (cloudStatus !== "saved") cloudPush(); }, 12000);
  }
  function stopRetry() { if (retryTimer) { clearInterval(retryTimer); retryTimer = null; } }
  function bindReconnect() {
    if (listenersBound || typeof window === "undefined" || !window.addEventListener) return;
    listenersBound = true;
    window.addEventListener("online", () => { if (cloudStatus !== "saved") cloudPush(); });
    window.addEventListener("focus", () => { if (pendingPush || cloudStatus === "offline") cloudPush(); });
    if (typeof document !== "undefined" && document.addEventListener) {
      document.addEventListener("visibilitychange", () => { if (!document.hidden && (pendingPush || cloudStatus === "offline")) cloudPush(); });
    }
  }

  function isBlockedErr(e) { return /failed to fetch|networkerror|load failed/i.test((e && e.message) || ""); }
  function cloudErr(label, e) {
    pendingPush = true;
    setCloud("offline");
    console.error(label, e && e.message);
    startRetry();
    if (isBlockedErr(e) && !warnedBlocked) {
      warnedBlocked = true;
      toast("No se pudo conectar a Supabase. Reintentaré solo; si persiste, abre este archivo directamente en tu navegador (no dentro de la vista previa).", "err", 8000);
    }
  }

  async function cloudPush() {
    if (!Cloud.available) { setCloud("local"); return; }
    setCloud("saving");
    try { await Cloud.save(state); pendingPush = false; warnedBlocked = false; stopRetry(); setCloud("saved"); }
    catch (e) { cloudErr("No se pudo guardar en la nube:", e); }
  }
  async function cloudPull() {
    if (!Cloud.available) { setCloud("local"); return; }
    setCloud("saving");
    try {
      const rows = await Cloud.load();
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row && row.data) {
        const incoming = migrate(row.data);
        incoming.ui = state.ui;            // conserva la vista actual
        state = incoming;
        await Store.save(JSON.stringify(state));
        render();
      } else {
        await cloudPush();                 // primera vez: sube lo que haya en local
        return;
      }
      pendingPush = false; warnedBlocked = false; stopRetry(); setCloud("saved");
    } catch (e) { cloudErr("No se pudo cargar de la nube:", e); }
  }
  async function initCloud() {
    bindReconnect();
    if (!Cloud.available) { setCloud("local"); return; }
    await cloudPull();
  }
  async function testConnection() {
    const out = $("#connResult");
    const show = (cls, html) => { if (out) { out.style.display = "block"; out.className = "conn-result " + cls; out.innerHTML = html; } };
    if (!Cloud.available) { show("err", ico.shield + " Este entorno no permite conexiones (fetch no disponible)."); return; }
    show("muted", ico.spark + " Probando conexión con Supabase…");
    try {
      const t0 = Date.now();
      const res = await fetch(SUPA_URL + "/rest/v1/rpc/vos_load", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY },
        body: JSON.stringify({ p_code: WORKSPACE }),
      });
      const ms = Date.now() - t0;
      if (res.ok) { show("ok", ico.check + " <b>Conexión exitosa</b> (" + ms + " ms). Supabase responde correctamente; el guardado funcionará."); setCloud("saved"); }
      else { const b = await res.text().catch(() => ""); show("err", ico.shield + " Supabase respondió con error HTTP " + res.status + ". " + esc(b.slice(0, 160))); }
    } catch (e) {
      show("err", ico.shield + " <b>Bloqueado por el navegador (\"" + esc((e && e.message) || "error") + "\").</b><br>No es problema de tu base de datos: el entorno donde abriste la página no deja conectarse a Supabase. <b>Solución:</b> descarga este archivo y ábrelo directo en tu navegador (Chrome/Edge), o súbelo a un hosting gratuito (Netlify, Vercel o GitHub Pages).");
    }
  }
  function cloudBadgeHTML() {
    const map = {
      saving: ["chip", ico.spark, "Guardando…"],
      saved: ["won-chip", ico.check, "Guardado en la nube"],
      offline: ["chip warn-chip", ico.shield, "Sin conexión"],
      local: ["chip warn-chip", ico.shield, "Solo local"],
      idle: ["chip", ico.spark, "Conectando…"],
    };
    const e = map[cloudStatus] || map.idle;
    return `<span class="${e[0]} sync-badge" data-act="nav" data-view="export" title="Estado del guardado · clic para ver opciones">${e[1]}<span>${e[2]}</span></span>`;
  }
  function updateCloudBadge() { const el = $("#syncBadge"); if (el) el.innerHTML = cloudBadgeHTML(); }

  function defaultState() {
    return {
      version: 2,
      deals: [],
      calls: [],
      leads: [],
      preleads: [],
      meetings: [],
      objectionDefs: seedObjections(),
      tagDefs: [],
      sourceDefs: [],
      days: {},
      knowledge: seedKnowledge(),
      goals: { callsDaily: 20, meetingsWeekly: 5, leadsWeekly: 15, proposalsMonthly: 10 },
      ui: { view: "calendar", monthCursor: dstr(new Date(new Date().getFullYear(), new Date().getMonth(), 1)) },
      updatedAt: null,
    };
  }
  function seedObjections() {
    return ["No tiene presupuesto", "Ya trabaja con otra empresa", "No es prioridad actualmente", "Debe consultarlo con socios", "No está interesado"]
      .map((t) => ({ id: uid(), text: t }));
  }
  function seedKnowledge() {
    return [
      { id: uid(), cat: "Apertura", title: "Apertura por referido", tags: "frío, referido", content: "“Hola [Nombre], me comunico de parte de [Referido], que pensó que esto podría ayudarte con [problema]. ¿Es buen momento para 30 segundos?”" },
      { id: uid(), cat: "Manejo de objeciones", title: "“Está muy caro”", tags: "precio", content: "Reencuadra a valor: “Entiendo. ¿Caro comparado con qué? Veamos el costo de seguir igual durante los próximos 6 meses.”" },
      { id: uid(), cat: "Cierre", title: "Cierre por siguiente paso", tags: "cierre", content: "“Para avanzar, propongo agendar la implementación el martes. ¿Te funciona 10am o prefieres 3pm?”" },
    ];
  }

  let state = defaultState();
  let saveTimer = null;
  const charts = {};

  function sourceDefByName(name) {
    const key = String(name || "").trim().toLowerCase();
    return key ? state.sourceDefs.find((d) => String(d.name || "").trim().toLowerCase() === key) || null : null;
  }
  function rememberInformationSource(name) {
    const clean = String(name || "").trim();
    if (!clean) return "";
    const existing = sourceDefByName(clean);
    if (existing) return existing.name;
    state.sourceDefs.push({ id: uid(), name: clean });
    return clean;
  }
  const sortedSourceDefs = () => (state.sourceDefs || []).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }));

  function scheduleSave() {
    state.updatedAt = new Date().toISOString();
    clearTimeout(saveTimer); saveTimer = setTimeout(persist, 300);
    scheduleCloud();
  }
  async function persist() {
    try { await Store.save(JSON.stringify(state)); }
    catch (e) { console.error("Error al guardar:", e); }
  }
  function migrate(p) {
    const base = defaultState();
    const merged = Object.assign(base, p || {});
    merged.goals = Object.assign(base.goals, p && p.goals || {});
    merged.ui = Object.assign(base.ui, p && p.ui || {});
    if (!Array.isArray(merged.knowledge) || !merged.knowledge.length) merged.knowledge = base.knowledge;
    ["deals", "calls", "leads", "preleads", "meetings"].forEach((k) => { if (!Array.isArray(merged[k])) merged[k] = []; });
    if (!Array.isArray(merged.objectionDefs) || !merged.objectionDefs.length) merged.objectionDefs = base.objectionDefs;
    if (!Array.isArray(merged.tagDefs)) merged.tagDefs = [];
    if (!Array.isArray(merged.sourceDefs)) merged.sourceDefs = [];
    if (!merged.days || typeof merged.days !== "object") merged.days = {};

    const knownSources = new Set(merged.sourceDefs.map((d) => String(d.name || "").trim().toLowerCase()).filter(Boolean));
    merged.leads.concat(merged.preleads).forEach((l) => {
      const name = String(l && l.informationSource || "").trim();
      if (name && !knownSources.has(name.toLowerCase())) { merged.sourceDefs.push({ id: uid(), name }); knownSources.add(name.toLowerCase()); }
    });

    // Compat: sembrar catálogo de etiquetas a partir de los tags ya presentes en leads/preleads
    {
      const have = new Set(merged.tagDefs.map((d) => (d.name || "").toLowerCase()));
      const seen = [];
      merged.leads.concat(merged.preleads).forEach((l) => {
        (l && l.tags ? String(l.tags).split(",") : []).forEach((raw) => {
          const name = raw.trim(); if (!name) return;
          const key = name.toLowerCase();
          if (!have.has(key) && seen.indexOf(key) < 0) { seen.push(key); merged.tagDefs.push({ id: uid(), name, color: TAG_COLORS[(merged.tagDefs.length + seen.length - 1) % TAG_COLORS.length] }); }
        });
      });
    }

    // Compat: tareas antiguas -> reuniones
    if (Array.isArray(p && p.tasks) && p.tasks.length && !(merged.meetings && merged.meetings.length)) {
      merged.meetings = p.tasks.map((t) => ({
        id: t.id || uid(), title: t.title || "Reunión", date: t.due || todayStr(), time: "",
        description: t.type ? "Tipo: " + t.type : "", status: t.done ? "Realizada" : "Programada", leadId: null,
      }));
    }
    delete merged.tasks;

    // Compat: objeciones antiguas [{text,overcome}] -> ids de objectionDefs
    merged.calls.forEach((c) => {
      if (Array.isArray(c.objections) && c.objections.length && typeof c.objections[0] === "object") {
        const ids = [];
        c.objections.forEach((o) => {
          const txt = (o.text || "").trim(); if (!txt) return;
          let def = merged.objectionDefs.find((d) => d.text.toLowerCase() === txt.toLowerCase());
          if (!def) { def = { id: uid(), text: txt }; merged.objectionDefs.push(def); }
          ids.push(def.id);
        });
        c.objections = ids;
      } else if (!Array.isArray(c.objections)) c.objections = [];
    });

    ensureLeadsFromCalls(merged);
    return merged;
  }
  async function boot() {
    try { const raw = await Store.load(); if (raw) state = migrate(JSON.parse(raw)); }
    catch (e) { /* primera vez */ }
    mount();
    render();
    initCloud();
  }

  /* ---------- Cálculos / agregaciones ---------- */
  const callsOn = (date) => state.calls.filter((c) => c.date === date);
  const callCountOn = (date) => callsOn(date).length;
  const normPhone = (p) => String(p == null ? "" : p).replace(/\D/g, "");

  function leadByPhone(phone) {
    const k = normPhone(phone); if (!k) return null;
    return state.leads.find((l) => normPhone(l.phone) === k) || null;
  }
  function preleadByPhone(phone) {
    const k = normPhone(phone); if (!k) return null;
    return state.preleads.find((l) => normPhone(l.phone) === k) || null;
  }
  function promotePrelead(preleadId) {
    const idx = state.preleads.findIndex((p) => p.id === preleadId);
    if (idx < 0) return null;
    const p = state.preleads[idx];
    state.preleads.splice(idx, 1);
    return p;
  }
  function ensureLeadsFromCalls(st) {
    (st.calls || []).forEach((c) => {
      const phone = normPhone(c.phone); if (!phone) return;
      if (st.leads.find((l) => normPhone(l.phone) === phone)) return;
      st.leads.push({
        id: uid(), createdAt: c.date || todayStr(), updatedAt: c.date || todayStr(),
        name: c.name, company: c.company, title: c.title, phone: c.phone, whatsapp: c.whatsapp,
        email: c.email, website: c.website, industry: c.industry, size: c.size, location: c.location, status: c.status,
      });
    });
  }
  function upsertLeadFromCall(c, preleadId) {
    const phone = normPhone(c.phone); if (!phone) return null;
    const fields = { name: c.name, company: c.company, title: c.title, phone: c.phone, whatsapp: c.whatsapp, email: c.email, website: c.website, industry: c.industry, size: c.size, location: c.location };
    let pre = preleadId ? state.preleads.find((p) => p.id === preleadId) : preleadByPhone(c.phone);
    if (pre) { ["address", "hoursOpen", "hoursClose", "rating", "reviews", "category", "countryCode", "country", "city", "informationSource", "tags"].forEach((f) => { if (pre[f] != null && pre[f] !== "" && !fields[f]) fields[f] = pre[f]; }); }
    let lead = leadByPhone(c.phone);
    if (lead) {
      Object.keys(fields).forEach((k) => { if (fields[k] && !lead[k]) lead[k] = fields[k]; });
      if (c.status) lead.status = c.status;
      lead.updatedAt = todayStr();
    } else {
      lead = Object.assign({ id: uid(), createdAt: todayStr(), updatedAt: todayStr(), status: c.status || "Nuevo lead" }, fields);
      state.leads.push(lead);
    }
    if (pre) { const hist = Array.isArray(pre.history) ? pre.history : []; lead.history = (lead.history || []).concat(hist).concat([{ at: todayStr(), change: "Promovido desde preleads (1ª llamada)" }]); promotePrelead(pre.id); }
    return lead;
  }
  const meetingsForLead = (leadId) => state.meetings.filter((m) => m.leadId === leadId);
  const callsForLead = (lead) => { const k = normPhone(lead.phone); return k ? state.calls.filter((c) => normPhone(c.phone) === k) : []; };

  function heatLevel(date) {
    if (date > todayStr()) return -1; // futuro: neutral
    const n = callCountOn(date);
    if (n === 0) return 0;
    if (n <= 8) return 1;
    if (n <= 20) return 2;
    if (n <= 35) return 3;
    return 4;
  }

  function rangeStats(filterFn) {
    const calls = state.calls.filter(filterFn);
    const meetings = calls.filter((c) => /reuni/i.test(c.status) || c.result === "Interesado").length;
    const won = calls.filter((c) => c.status === "Cerrado ganado").length;
    const conv = calls.length ? (won / calls.length) * 100 : 0;
    const scored = calls.filter((c) => c.scoreTotal != null);
    const avgScore = scored.length ? scored.reduce((a, c) => a + c.scoreTotal, 0) / scored.length : 0;
    return { count: calls.length, meetings, won, conv, avgScore };
  }

  function streak() {
    let s = 0;
    let d = new Date();
    if (callCountOn(dstr(d)) === 0) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 400; i++) {
      if (callCountOn(dstr(d)) > 0) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  }
  function bestDay() {
    const map = {};
    state.calls.forEach((c) => { map[c.date] = (map[c.date] || 0) + 1; });
    let best = 0; for (const k in map) best = Math.max(best, map[k]);
    return best;
  }

  function objectionRanking() {
    const defMap = {}; state.objectionDefs.forEach((d) => (defMap[d.id] = d.text));
    const map = {};
    state.calls.forEach((c) => {
      (c.objections || []).forEach((oid) => {
        const text = defMap[oid]; if (!text) return;
        if (!map[oid]) map[oid] = { id: oid, text, count: 0 };
        map[oid].count++;
      });
    });
    const total = state.calls.length || 1;
    return Object.values(map).map((o) => { o.rate = (o.count / total) * 100; return o; }).sort((a, b) => b.count - a.count);
  }

  function dealsByStage() {
    const g = {}; STAGES.forEach((s) => (g[s.id] = []));
    state.deals.forEach((d) => { (g[d.stage] || (g[d.stage] = [])).push(d); });
    return g;
  }

