"use strict";
/* Ventas OS — módulo: vistas: calendario, embudo, dashboard
   Generado al separar ventas-os.html. Ámbito global compartido entre <script> clásicos. */

  /* ---------- CALENDARIO ---------- */
  function viewCalendar() {
    const cur = parseDate(state.ui.monthCursor);
    const y = cur.getFullYear(), mo = cur.getMonth();
    const first = new Date(y, mo, 1);
    const startOffset = (first.getDay() + 6) % 7; // lunes=0
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    let cells = "";
    for (let i = 0; i < startOffset; i++) cells += `<div class="cal-cell empty"></div>`;
    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${y}-${pad(mo + 1)}-${pad(day)}`;
      const lvl = heatLevel(ds);
      const cs = callsOn(ds);
      const won = cs.filter((c) => c.status === "Cerrado ganado").length;
      const isToday = ds === todayStr();
      const hasNote = state.days[ds] && (state.days[ds].learnings || state.days[ds].improvements);
      cells += `<button class="cal-cell heat-${lvl < 0 ? "n" : lvl} ${isToday ? "today" : ""}" data-act="open-day" data-date="${ds}">
        <span class="cal-day">${day}${isToday ? '<i class="dot"></i>' : ""}</span>
        ${cs.length ? `<span class="cal-meta"><b>${cs.length}</b> llam.</span>` : ""}
        ${won ? `<span class="cal-tag won">${won} ✓</span>` : ""}
        ${hasNote ? `<span class="cal-note">${ico.bookmini}</span>` : ""}
      </button>`;
    }
    const total = cells; // placeholder
    return `
      <div class="cal-wrap">
        <div class="cal-head">
          <div class="cal-nav">
            <button class="icon-btn" data-act="month" data-dir="-1">${ico.chevL}</button>
            <h2>${MONTHS[mo]} ${y}</h2>
            <button class="icon-btn" data-act="month" data-dir="1">${ico.chevR}</button>
            <button class="btn btn-ghost sm" data-act="month" data-dir="0">Hoy</button>
          </div>
          <div class="heat-legend">
            <span>Menos</span>
            <i class="hl heat-0"></i><i class="hl heat-1"></i><i class="hl heat-2"></i><i class="hl heat-3"></i><i class="hl heat-4"></i>
            <span>Más</span>
          </div>
        </div>
        <div class="cal-grid-head">${WD.map((w) => `<span>${w}</span>`).join("")}</div>
        <div class="cal-grid">${total}</div>
      </div>`;
  }

  /* ---------- EMBUDO ---------- */
  function viewPipeline() {
    const g = dealsByStage();
    return `<div class="pipe-bar">
        <button class="btn btn-primary" data-act="new-deal">${ico.plus} Nuevo prospecto</button>
        <span class="muted">${state.deals.length} prospectos en el embudo</span>
      </div>
      <div class="pipe">
        ${STAGES.map((s) => {
          const list = g[s.id] || [];
          return `<div class="pipe-col" data-stage="${s.id}">
            <div class="pipe-col-head"><span class="dot-s" style="background:${s.color}"></span>
              <strong>${s.label}</strong><span class="count">${list.length}</span></div>
            <div class="pipe-list" data-stage="${s.id}">
              ${list.map((d) => `<div class="deal" draggable="true" data-id="${d.id}" data-act="edit-deal">
                <div class="deal-top"><strong>${esc(d.company || d.name || "Sin nombre")}</strong></div>
                <div class="deal-sub">${esc(d.name || "")}${d.title ? " · " + esc(d.title) : ""}</div>
                <div class="deal-foot">
                ${d.industry ? `<span class="chip">${esc(d.industry)}</span>` : ""}
                ${d.phone ? `<span class="chip dim">${esc(d.phone)}</span>` : ""}</div>
              </div>`).join("") || `<div class="pipe-empty">—</div>`}
            </div>
          </div>`;
        }).join("")}
      </div>`;
  }
  function wirePipelineDnD() {
    let dragId = null;
    $$(".deal").forEach((el) => {
      el.addEventListener("dragstart", (e) => { dragId = el.dataset.id; el.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; });
      el.addEventListener("dragend", () => { dragId = null; el.classList.remove("dragging"); });
    });
    $$(".pipe-list").forEach((col) => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drop"); });
      col.addEventListener("dragleave", () => col.classList.remove("drop"));
      col.addEventListener("drop", (e) => {
        e.preventDefault(); col.classList.remove("drop");
        if (!dragId) return;
        const d = state.deals.find((x) => x.id === dragId);
        if (d) { d.stage = col.dataset.stage; scheduleSave(); render(); }
      });
    });
  }

  /* ---------- DASHBOARD ---------- */
  function viewDashboard() {
    const all = rangeStats(() => true);
    const month = rangeStats(monthFilter());
    const goals = state.goals;
    const todayCalls = callCountOn(todayStr());
    const weekFilter = (c) => isoWeek(parseDate(c.date)) === isoWeek(new Date());
    const meetingsWeek = state.meetings.filter((m) => isoWeek(parseDate(m.date)) === isoWeek(new Date()) && m.status !== "Cancelada").length;
    const leadsWeek = state.leads.filter((l) => l.createdAt && isoWeek(parseDate(l.createdAt)) === isoWeek(new Date())).length;
    const proposalsMonth = state.calls.filter((c) => monthFilter()(c) && /propuesta/i.test(c.status)).length;
    const upcomingMeetings = state.meetings.filter((m) => m.status === "Programada" || m.status === "Reprogramada").filter((m) => m.date >= todayStr()).length;

    const goalCard = (label, val, goal) => {
      const p = goal ? clamp((val / goal) * 100, 0, 100) : 0;
      return `<div class="goal-row"><div class="goal-row-top"><span>${label}</span><span class="muted">${val}/${goal}</span></div>
        <div class="bar"><i style="width:${p}%;background:${p >= 100 ? "var(--won)" : "var(--accent)"}"></i></div></div>`;
    };

    return `
      <div class="grid-kpi">
        ${kpi("Llamadas totales", all.count, ico.phone)}
        ${kpi("Leads en base", state.leads.length, ico.users)}
        ${kpi("Reuniones activas", upcomingMeetings, ico.clock)}
        ${kpi("Reuniones (mes)", state.calls.filter((c) => monthFilter()(c) && /reuni/i.test(c.status)).length, ico.calendar)}
        ${kpi("Cierres ganados", all.won, ico.trophy)}
        ${kpi("Conversión total", pct(all.conv), ico.percent)}
        ${kpi("Score promedio", Math.round(all.avgScore) + "/100", ico.star)}
        ${kpi("Prospectos activos", state.deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length, ico.pipeline)}
      </div>

      <div class="dash-grid">
        <div class="card span2"><div class="card-h"><h3>Actividad — llamadas por día (30d)</h3></div><div class="chart-box"><canvas id="cActivity"></canvas></div></div>
        <div class="card"><div class="card-h"><h3>Embudo por etapa</h3></div><div class="chart-box"><canvas id="cFunnel"></canvas></div></div>
        <div class="card"><div class="card-h"><h3>Leads nuevos por mes</h3></div><div class="chart-box"><canvas id="cLeads"></canvas></div></div>
        <div class="card"><div class="card-h"><h3>Score promedio (semanal)</h3></div><div class="chart-box"><canvas id="cScore"></canvas></div></div>
        <div class="card">
          <div class="card-h"><h3>Metas en progreso</h3></div>
          ${goalCard("Llamadas hoy", todayCalls, goals.callsDaily)}
          ${goalCard("Reuniones (semana)", meetingsWeek, goals.meetingsWeekly)}
          ${goalCard("Leads nuevos (semana)", leadsWeek, goals.leadsWeekly)}
          ${goalCard("Propuestas (mes)", proposalsMonth, goals.proposalsMonthly)}
        </div>
        <div class="card span2">
          <div class="card-h"><h3>Gamificación</h3></div>
          <div class="game-grid">
            <div class="game-stat"><span class="game-ico">${ico.flame}</span><b>${streak()}</b><span>Racha actual (días)</span></div>
            <div class="game-stat"><span class="game-ico">${ico.trophy}</span><b>${bestDay()}</b><span>Récord llamadas/día</span></div>
            <div class="game-stat"><span class="game-ico">${ico.target}</span><b>${pct(goals.callsDaily ? (todayCalls / goals.callsDaily) * 100 : 0)}</b><span>Meta de hoy</span></div>
            <div class="game-stat"><span class="game-ico">${ico.users}</span><b>${state.leads.length}</b><span>Leads acumulados</span></div>
          </div>
        </div>
      </div>`;
  }
  function kpi(label, val, icon) {
    return `<div class="kpi"><div class="kpi-ico">${icon}</div><div><div class="kpi-n">${val}</div><div class="kpi-l">${label}</div></div></div>`;
  }

  function drawDashboardCharts() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.color = "#8a93a3";
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.borderColor = "rgba(255,255,255,.05)";
    const accent = "#6366f1", won = "#34d399";

    // Actividad 30d
    const labels = [], data = [];
    for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); labels.push(d.getDate() + "/" + (d.getMonth() + 1)); data.push(callCountOn(dstr(d))); }
    mkChart("cActivity", { type: "bar", data: { labels, datasets: [{ label: "Llamadas", data, backgroundColor: accent, borderRadius: 6, maxBarThickness: 18 }] }, options: baseOpts() });

    // Embudo
    const g = dealsByStage();
    mkChart("cFunnel", { type: "bar", data: { labels: STAGES.map((s) => s.label), datasets: [{ label: "Negocios", data: STAGES.map((s) => (g[s.id] || []).length), backgroundColor: STAGES.map((s) => s.color), borderRadius: 6 }] }, options: Object.assign(baseOpts(), { indexAxis: "y" }) });

    // Leads nuevos por mes (últimos 6)
    const ll = [], ld = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); const y = d.getFullYear(), mo = d.getMonth(); ll.push(MONTHS[mo].slice(0, 3)); ld.push(state.leads.filter((l) => { const cd = parseDate(l.createdAt || todayStr()); return cd.getFullYear() === y && cd.getMonth() === mo; }).length); }
    mkChart("cLeads", { type: "line", data: { labels: ll, datasets: [{ label: "Leads", data: ld, borderColor: won, backgroundColor: "rgba(52,211,153,.12)", fill: true, tension: .35, pointRadius: 3 }] }, options: baseOpts(true) });

    // Score semanal (últimas 8)
    const sl = [], sd = [];
    for (let i = 7; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i * 7); const wk = isoWeek(d); const cc = state.calls.filter((c) => isoWeek(parseDate(c.date)) === wk && c.scoreTotal != null); sl.push("S" + wk.split("-W")[1]); sd.push(cc.length ? Math.round(cc.reduce((a, c) => a + c.scoreTotal, 0) / cc.length) : 0); }
    mkChart("cScore", { type: "line", data: { labels: sl, datasets: [{ label: "Score", data: sd, borderColor: accent, backgroundColor: "rgba(99,102,241,.12)", fill: true, tension: .35, pointRadius: 3 }] }, options: baseOpts(true, 100) });
  }
  function baseOpts(area, max) {
    return { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: max || undefined, grid: { color: "rgba(255,255,255,.04)" }, ticks: { precision: 0 } } } };
  }
  function mkChart(id, cfg) { const el = document.getElementById(id); if (!el) return; charts[id] = new Chart(el.getContext("2d"), cfg); }

