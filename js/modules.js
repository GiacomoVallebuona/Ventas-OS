"use strict";
/* Ventas OS — módulo: vistas: reuniones, objeciones, bitácora, conocimiento, metas, coach, exportar, día
   Generado al separar ventas-os.html. Ámbito global compartido entre <script> clásicos. */


  /* ---------- REUNIONES ---------- */
  function viewMeetings() {
    const today = todayStr();
    const active = state.meetings.filter((m) => m.status === "Programada" || m.status === "Reprogramada");
    const upcoming = active.filter((m) => m.date >= today).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    const overdue = active.filter((m) => m.date < today).sort((a, b) => b.date.localeCompare(a.date));
    const closed = state.meetings.filter((m) => m.status === "Realizada" || m.status === "Cancelada").sort((a, b) => b.date.localeCompare(a.date));
    const row = (m) => {
      const lead = m.leadId ? state.leads.find((l) => l.id === m.leadId) : null;
      const col = MEETING_STATUS_COLOR[m.status] || "#818cf8";
      const isOpen = m.status === "Programada" || m.status === "Reprogramada";
      return `<div class="meet" style="--accent:${col}">
        <div class="meet-date"><b>${parseDate(m.date).getDate()}</b><span>${MONTHS[parseDate(m.date).getMonth()].slice(0, 3)}</span></div>
        <div class="meet-main">
          <div class="meet-top"><strong>${esc(m.title || "Reunión")}</strong><span class="badge" style="--bg:${col}">${esc(m.status)}</span></div>
          <div class="meet-sub">${m.time ? ico.clock + " " + esc(m.time) + " · " : ""}${esc(longDate(m.date))}${lead ? " · " + ico.users + " " + esc(lead.company || lead.name) : ""}</div>
          ${m.description ? `<div class="meet-desc">${esc(m.description)}</div>` : ""}
        </div>
        <div class="meet-actions">
          ${isOpen ? `<button class="btn btn-ghost sm" data-act="meet-done" data-id="${m.id}" title="Marcar realizada">${ico.check}</button>` : ""}
          <button class="icon-btn sm" data-act="edit-meeting" data-id="${m.id}" title="Editar / reprogramar">${ico.calendar}</button>
          <button class="icon-btn sm" data-act="del-meeting" data-id="${m.id}" title="Eliminar">${ico.trash}</button>
        </div>
      </div>`;
    };
    return `<div class="tasks-bar"><button class="btn btn-primary" data-act="new-meeting">${ico.plus} Nueva reunión</button>
        <div class="seg-stats"><span><b>${upcoming.length}</b> próximas</span>${overdue.length ? `<span class="due-bad"><b>${overdue.length}</b> vencidas</span>` : ""}<span><b>${state.meetings.filter((m) => m.status === "Realizada").length}</b> realizadas</span></div></div>
      <div class="tasks-list">
        ${overdue.length ? `<div class="task-divider">Vencidas sin gestionar</div>` + overdue.map(row).join("") : ""}
        ${upcoming.length ? (overdue.length ? `<div class="task-divider">Próximas</div>` : "") + upcoming.map(row).join("") : (overdue.length ? "" : `<div class="empty-state">${ico.clock}<p>Sin reuniones programadas. Crea una y vincúlala a un lead.</p></div>`)}
        ${closed.length ? `<div class="task-divider">Historial (${closed.length})</div>` + closed.map(row).join("") : ""}
      </div>`;
  }

  /* ---------- OBJECIONES ---------- */
  function viewObjections() {
    const rk = objectionRanking();
    const defs = state.objectionDefs;
    const totalCalls = state.calls.length;
    const head = `<div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>${ico.shield} Catálogo de objeciones</h3><span class="count">${defs.length}</span></div>
        <p class="muted sm" style="margin:-4px 0 12px">Estas objeciones aparecen como checklist al registrar una llamada. Puedes crear nuevas aquí o desde el formulario de llamada.</p>
        <div class="obj-chips">${defs.map((d) => `<span class="obj-chip">${esc(d.text)}<button class="obj-chip-x" data-act="del-objdef" data-id="${d.id}" title="Eliminar">${ico.x}</button></span>`).join("")}</div>
        <div class="sync-code-row" style="margin-top:12px;max-width:480px"><input id="newObjDef" placeholder="Nueva objeción reutilizable..."><button class="btn btn-primary" data-act="add-objdef">${ico.plus} Crear</button></div>
      </div>`;
    if (!rk.length) return head + `<div class="empty-state">${ico.shield}<p>Aún no se ha seleccionado ninguna objeción en las llamadas.<br>El ranking se construye con lo que marcas en cada llamada.</p></div>`;
    const maxC = rk[0].count;
    return head + `<div class="obj-wrap"><div class="card">
        <div class="card-h"><h3>Ranking de objeciones</h3><span class="muted">${rk.length} tipos · ${rk.reduce((a, o) => a + o.count, 0)} apariciones en ${totalCalls} llamadas</span></div>
        <div class="obj-list">
          ${rk.map((o, i) => `<div class="obj-row">
              <span class="obj-rank">#${i + 1}</span>
              <div class="obj-main"><div class="obj-text">${esc(o.text)}</div>
                <div class="obj-bar"><i style="width:${(o.count / maxC) * 100}%"></i></div></div>
              <div class="obj-stats"><span class="obj-count">${o.count}×</span>
                <span class="obj-rate">${pct(o.rate)} de llamadas</span></div>
            </div>`).join("")}
        </div></div></div>`;
  }

  /* ---------- BITÁCORA (mejora continua) ---------- */
  function viewJournal() {
    const dates = Object.keys(state.days).filter((d) => state.days[d].learnings || state.days[d].improvements).sort().reverse();
    const learnings = dates.map((d) => ({ d, t: state.days[d].learnings })).filter((x) => x.t);
    const improvements = dates.map((d) => ({ d, t: state.days[d].improvements })).filter((x) => x.t);
    const rk = objectionRanking().slice(0, 5);
    const topTech = topKnowledgeByCat();
    return `<div class="journal">
      <div class="card">
        <div class="card-h"><h3>${ico.bulb} Aprendizajes recurrentes</h3></div>
        <div class="jrn-list">${learnings.length ? learnings.map((x) => `<div class="jrn-item"><span class="jrn-date">${longDate(x.d)}</span><p>${esc(x.t)}</p></div>`).join("") : emptyMini("Registra aprendizajes desde el detalle de cada día.")}</div>
      </div>
      <div class="card">
        <div class="card-h"><h3>${ico.shield} Por mejorar / errores frecuentes</h3></div>
        <div class="jrn-list">${improvements.length ? improvements.map((x) => `<div class="jrn-item warn"><span class="jrn-date">${longDate(x.d)}</span><p>${esc(x.t)}</p></div>`).join("") : emptyMini("Anota oportunidades de mejora desde el detalle de cada día.")}</div>
      </div>
      <div class="card">
        <div class="card-h"><h3>${ico.star} Objeciones más comunes</h3></div>
        <div class="jrn-tags">${rk.length ? rk.map((o) => `<span class="tag-stat">${esc(o.text)} <b>${o.count}×</b></span>`).join("") : emptyMini("Sin objeciones registradas todavía.")}</div>
      </div>
      <div class="card">
        <div class="card-h"><h3>${ico.trophy} Técnicas en tu biblioteca</h3></div>
        <div class="jrn-tags">${topTech.length ? topTech.map((k) => `<span class="tag-stat">${esc(k.title)}</span>`).join("") : emptyMini("Guarda técnicas en Conocimiento.")}</div>
      </div>
    </div>`;
  }
  function topKnowledgeByCat() { return state.knowledge.slice(0, 6); }
  function emptyMini(t) { return `<p class="muted mini-empty">${t}</p>`; }

  /* ---------- CONOCIMIENTO ---------- */
  let kbQuery = "";
  function kbGridHTML() {
    const q = kbQuery.toLowerCase();
    const list = state.knowledge.filter((k) => !q || (k.title + " " + k.content + " " + k.tags + " " + k.cat).toLowerCase().includes(q));
    return list.map((k) => `<div class="kb-card" data-act="edit-kb" data-id="${k.id}">
          <span class="kb-cat" style="--cc:${catColor(k.cat)}">${esc(k.cat)}</span>
          <h4>${esc(k.title)}</h4>
          <p>${esc(k.content)}</p>
          ${k.tags ? `<div class="kb-tags">${k.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => `<span>#${esc(t)}</span>`).join("")}</div>` : ""}
        </div>`).join("") || `<div class="empty-state">${ico.bulb}<p>${kbQuery ? "Sin resultados para tu búsqueda." : "Tu biblioteca está vacía."}</p></div>`;
  }
  function viewKnowledge() {
    return `<div class="kb-bar">
        <div class="search"><span>${ico.search}</span><input id="kbSearch" placeholder="Buscar scripts, objeciones, cierres..." value="${esc(kbQuery)}"></div>
        <button class="btn btn-primary" data-act="new-kb">${ico.plus} Nuevo</button>
      </div>
      <div class="kb-grid">${kbGridHTML()}</div>`;
  }
  function catColor(c) { const i = KB_CATS.indexOf(c); const colors = ["#60a5fa", "#a78bfa", "#f59e0b", "#34d399", "#fb923c", "#f472b6", "#22d3ee"]; return colors[i % colors.length]; }

  /* ---------- METAS ---------- */
  function viewGoals() {
    const g = state.goals;
    const fields = [
      ["callsDaily", "Llamadas por día"], ["meetingsWeekly", "Reuniones por semana"],
      ["leadsWeekly", "Leads nuevos por semana"], ["proposalsMonthly", "Propuestas por mes"],
    ];
    const inWeek = (d) => d && isoWeek(parseDate(d)) === isoWeek(new Date());
    const prog = {
      callsDaily: [callCountOn(todayStr()), g.callsDaily],
      meetingsWeekly: [state.meetings.filter((m) => inWeek(m.date) && m.status !== "Cancelada").length, g.meetingsWeekly],
      leadsWeekly: [state.leads.filter((l) => inWeek(l.createdAt)).length, g.leadsWeekly],
      proposalsMonthly: [state.calls.filter((c) => monthFilter()(c) && /propuesta/i.test(c.status)).length, g.proposalsMonthly],
    };
    return `<div class="goals-grid">
      <div class="card">
        <div class="card-h"><h3>Definir objetivos</h3></div>
        <div class="goal-form">
          ${fields.map(([k, l]) => `<label class="field"><span>${l}</span><input type="number" min="0" data-goal="${k}" value="${g[k]}"></label>`).join("")}
          <button class="btn btn-primary" data-act="save-goals">Guardar metas</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Progreso en tiempo real</h3></div>
        <div class="goal-prog">
          ${fields.map(([k, l]) => { const [v, t] = prog[k]; const p = t ? clamp((v / t) * 100, 0, 100) : 0; return `<div class="goal-row"><div class="goal-row-top"><span>${l}</span><span class="muted">${v}/${t}</span></div><div class="bar"><i style="width:${p}%;background:${p >= 100 ? "var(--won)" : "var(--accent)"}"></i></div></div>`; }).join("")}
        </div>
      </div>
    </div>`;
  }

  /* ---------- COACH IA ---------- */
  let coachState = { loading: false, html: "", error: "", mode: "" };
  function viewCoach() {
    return `<div class="coach">
      <div class="coach-head card">
        <div><h3>${ico.spark} Coach Comercial IA</h3>
        <p class="muted">Analiza tus resultados, conversiones, puntajes y notas reales con IA para darte recomendaciones accionables.</p></div>
        <div class="coach-actions">
          <button class="btn btn-primary" data-act="ai" data-mode="coach" ${coachState.loading ? "disabled" : ""}>${ico.spark} Analizar mi desempeño</button>
          <button class="btn btn-ghost" data-act="ai" data-mode="weekly" ${coachState.loading ? "disabled" : ""}>${ico.calendar} Reporte semanal</button>
        </div>
      </div>
      <div class="card coach-out">
        ${coachState.loading ? `<div class="ai-loading"><div class="spinner"></div><p>${coachState.mode === "weekly" ? "Generando tu reporte semanal..." : "Analizando tu desempeño..."}</p></div>`
        : coachState.error ? `<div class="ai-error">${ico.shield}<p>${esc(coachState.error)}</p></div>`
        : coachState.html ? `<div class="ai-result">${coachState.html}</div>`
        : `<div class="empty-state">${ico.spark}<p>Pulsa “Analizar mi desempeño” y la IA revisará tus llamadas, scores, objeciones y notas para darte un plan concreto.</p></div>`}
      </div>
      <p class="coach-note muted">Nota: el análisis de audio (subir grabaciones / transcripción) no está disponible en este entorno, por lo que no se incluye un módulo simulado. El coach analiza tus datos reales registrados.</p>
    </div>`;
  }

  function buildAIContext() {
    const all = rangeStats(() => true);
    const month = rangeStats(monthFilter());
    const rk = objectionRanking().slice(0, 8);
    const g = dealsByStage();
    const recentCalls = state.calls.slice(-25).map((c) => ({
      fecha: c.date, empresa: c.company, estado: c.status, resultado: c.result, score: c.scoreTotal,
      objeciones: (c.objections || []).map((id) => (state.objectionDefs.find((d) => d.id === id) || {}).text).filter(Boolean),
      notas: (c.notes || "").slice(0, 200),
    }));
    const dates = Object.keys(state.days).sort().reverse().slice(0, 10);
    const reflections = dates.map((d) => ({ fecha: d, aprendizajes: state.days[d].learnings, mejorar: state.days[d].improvements })).filter((x) => x.aprendizajes || x.mejorar);
    return {
      resumenGlobal: { llamadas: all.count, leads: state.leads.length, reunionesAgendadas: state.meetings.length, cierres: all.won, conversion: Math.round(all.conv) + "%", scorePromedio: Math.round(all.avgScore) },
      resumenMes: { llamadas: month.count, cierres: month.won, conversion: Math.round(month.conv) + "%", reuniones: month.meetings },
      embudo: STAGES.map((s) => ({ etapa: s.label, negocios: (g[s.id] || []).length })),
      objeciones: rk.map((o) => ({ objecion: o.text, frecuencia: o.count, porcentajeLlamadas: Math.round(o.rate) + "%" })),
      scoringPromedioPorHabilidad: avgScoreBreakdown(),
      llamadasRecientes: recentCalls,
      reflexiones: reflections,
      metas: state.goals,
    };
  }
  function avgScoreBreakdown() {
    const acc = {}; const cnt = {};
    SCORE_KEYS.forEach((s) => { acc[s.k] = 0; cnt[s.k] = 0; });
    state.calls.forEach((c) => { if (c.score) SCORE_KEYS.forEach((s) => { if (c.score[s.k] != null) { acc[s.k] += num(c.score[s.k]); cnt[s.k]++; } }); });
    const out = {}; SCORE_KEYS.forEach((s) => { out[s.label] = cnt[s.k] ? Math.round(acc[s.k] / cnt[s.k]) : null; });
    return out;
  }

  async function runAI(mode) {
    if (!state.calls.length && !state.deals.length) { coachState = { loading: false, html: "", error: "Aún no hay datos suficientes. Registra algunas llamadas o prospectos y vuelve a intentarlo.", mode }; render(); return; }
    coachState = { loading: true, html: "", error: "", mode }; render();
    const ctx = buildAIContext();
    const sys = "Eres un coach comercial de élite (estilo Sandler/Challenger). Analizas datos reales de un vendedor y devuelves un análisis claro, honesto y accionable en español. Devuelve SOLO HTML simple usando estas etiquetas: <h4>, <p>, <ul>, <li>, <strong>. No uses markdown, ni backticks, ni <html>/<body>. Sé específico, cita los números del contexto y prioriza 3-5 acciones concretas.";
    const ask = mode === "weekly"
      ? "Genera un REPORTE SEMANAL con estas secciones: <h4>Qué mejoró</h4>, <h4>Qué empeoró</h4>, <h4>Habilidades a desarrollar</h4>, <h4>Próximas acciones</h4>. Basándote en estos datos del vendedor:\n\n" + JSON.stringify(ctx, null, 2)
      : "Analiza el desempeño y devuelve: <h4>Diagnóstico general</h4>, <h4>Patrones detectados</h4>, <h4>Debilidades principales</h4>, <h4>Oportunidades</h4>, <h4>Plan de acción (3-5 pasos)</h4>. Datos:\n\n" + JSON.stringify(ctx, null, 2);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500, system: sys, messages: [{ role: "user", content: ask }] }),
      });
      if (!res.ok) throw new Error("La IA respondió con estado " + res.status);
      const data = await res.json();
      let text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      text = text.replace(/```html|```/g, "").trim();
      if (!text) throw new Error("Respuesta vacía de la IA.");
      coachState = { loading: false, html: sanitizeAIHtml(text), error: "", mode };
    } catch (e) {
      coachState = { loading: false, html: "", error: "No se pudo completar el análisis (" + (e.message || "error") + "). Verifica tu conexión e inténtalo de nuevo.", mode };
    }
    render();
  }
  function sanitizeAIHtml(t) {
    return t.replace(/<(?!\/?(h4|p|ul|ol|li|strong|em|br)\b)[^>]*>/gi, "");
  }

  /* ---------- EXPORTAR ---------- */
  function viewExport() {
    const statusTxt = { saving: "Guardando…", saved: "Guardado en la nube", offline: "Sin conexión", local: "Nube no disponible aquí", idle: "Conectando…" }[cloudStatus] || "—";
    const ok = cloudStatus === "saved";
    const cloudCard = Cloud.available ? `
      <div class="card sync-card" style="margin-bottom:18px">
        <div class="card-h">${ico.spark} Guardado en la nube (Supabase) <span class="${ok ? "won-chip" : "chip"}">${statusTxt}</span></div>
        <p class="muted sm" style="margin:-4px 0 14px">Toda tu información se guarda automáticamente en tu base de datos de Supabase cada vez que registras o editas algo. No necesitas hacer nada.</p>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-primary sm" data-act="save-now">${ico.check} Guardar ahora</button>
          <button class="btn btn-ghost sm" data-act="reload-cloud">${ico.download} Recargar desde la nube</button>
          <button class="btn btn-ghost sm" data-act="test-conn">${ico.spark} Probar conexión</button>
        </div>
        <div id="connResult" class="conn-result" style="display:none"></div>
      </div>` : `
      <div class="card sync-card" style="margin-bottom:18px;border-color:rgba(251,191,36,.3)">
        <div class="card-h">${ico.shield} Nube no disponible en este entorno</div>
        <p class="muted sm">Aquí no hay conexión a Supabase. Tus datos se guardan localmente; usa la <b style="color:var(--text)">Copia de seguridad</b> para moverlos.</p>
      </div>`;
    return cloudCard + `
    <div class="card" style="margin-bottom:18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div class="ex-ico" style="width:42px;height:42px;border-radius:11px;margin:0">${ico.shield}</div>
      <div style="flex:1;min-width:200px">
        <div style="font-weight:700;font-size:14px">Respaldo local</div>
        <div class="muted sm">Además de la nube, se guarda una copia en este dispositivo (${Store.label}) por si te quedas sin conexión.</div>
      </div>
      <span class="${Store.durable ? "won-chip" : "chip"}">${Store.durable ? "Activo" : "Sin persistencia"}</span>
    </div>
    <div class="export-grid">
      <div class="card ex-card" style="border-color:rgba(99,102,241,.35)">
        <div class="ex-ico">${ico.download}</div><h4>Copia de seguridad</h4>
        <p class="muted">Descarga TODA tu información en un archivo .json para guardarla donde quieras y restaurarla en cualquier momento.</p>
        <button class="btn btn-primary" data-act="backup">Descargar copia</button>
      </div>
      <div class="card ex-card">
        <div class="ex-ico" style="background:var(--won-soft);color:var(--won)">${ico.check}</div><h4>Restaurar datos</h4>
        <p class="muted">Carga un archivo de copia de seguridad para recuperar tus llamadas, prospectos, tareas y notas.</p>
        <button class="btn btn-ghost" data-act="restore">Seleccionar archivo</button>
        <input type="file" id="restoreFile" accept="application/json,.json" style="display:none">
      </div>
      ${exCard("CSV", "Datos en texto plano, compatible con cualquier hoja de cálculo.", ico.download, "csv")}
      ${exCard("Excel", "Libro .xlsx con hojas de Llamadas, Prospectos y Tareas.", ico.grid, "xlsx")}
      ${exCard("PDF", "Reporte imprimible del dashboard y métricas clave.", ico.file, "pdf")}
      <div class="card danger-card">
        <h4>${ico.trash} Borrar todos los datos</h4>
        <p class="muted">Elimina permanentemente llamadas, prospectos, tareas y notas. No se puede deshacer.</p>
        <button class="btn btn-danger" data-act="wipe">Borrar todo</button>
      </div>
    </div>`;
  }
  function exCard(t, d, icon, kind) {
    return `<div class="card ex-card"><div class="ex-ico">${icon}</div><h4>${t}</h4><p class="muted">${d}</p><button class="btn btn-primary" data-act="export" data-kind="${kind}">Exportar ${t}</button></div>`;
  }

  function exportCSV() {
    const objText = (c) => (c.objections || []).map((oid) => (state.objectionDefs.find((d) => d.id === oid) || {}).text).filter(Boolean).join(" | ");
    const headers = ["Fecha", "Hora", "Empresa", "Contacto", "Cargo", "Telefono", "Email", "Industria", "Estado", "Resultado", "Duracion", "Score", "Objeciones", "Notas"];
    const rows = state.calls.map((c) => [c.date, c.time, c.company, c.name, c.title, c.phone, c.email, c.industry, c.status, c.result, c.duration, c.scoreTotal, objText(c), (c.notes || "").replace(/\n/g, " ")]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(",")).join("\n");
    download(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "ventas-llamadas.csv");
    toast("CSV exportado", "ok");
  }
  function exportXLSX() {
    if (typeof XLSX === "undefined") { toast("Librería Excel no disponible", "warn"); return; }
    const objText = (c) => (c.objections || []).map((oid) => (state.objectionDefs.find((d) => d.id === oid) || {}).text).filter(Boolean).join(" | ");
    const wb = XLSX.utils.book_new();
    const calls = state.calls.map((c) => ({ Fecha: c.date, Hora: c.time, Empresa: c.company, Contacto: c.name, Cargo: c.title, Telefono: c.phone, WhatsApp: c.whatsapp, Email: c.email, Web: c.website, Industria: c.industry, Tamaño: c.size, Ubicacion: c.location, Estado: c.status, Resultado: c.result, Duracion: c.duration, Score: c.scoreTotal, Objeciones: objText(c), Notas: c.notes }));
    const leads = state.leads.map((l) => ({ Empresa: l.company, Contacto: l.name, Cargo: l.title, Telefono: l.phone, WhatsApp: l.whatsapp, Email: l.email, Web: l.website, Industria: l.industry, Tamaño: l.size, Ubicacion: l.location, Estado: l.status, Creado: l.createdAt }));
    const deals = state.deals.map((d) => ({ Empresa: d.company, Contacto: d.name, Cargo: d.title, Telefono: d.phone, Etapa: stageLabel(d.stage), Industria: d.industry, Tamaño: d.size, Ubicacion: d.location }));
    const meetings = state.meetings.map((m) => ({ Titulo: m.title, Fecha: m.date, Hora: m.time, Estado: m.status, Lead: (state.leads.find((l) => l.id === m.leadId) || {}).company || (state.leads.find((l) => l.id === m.leadId) || {}).name || "", Descripcion: m.description }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leads.length ? leads : [{}]), "Leads");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(calls.length ? calls : [{}]), "Llamadas");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meetings.length ? meetings : [{}]), "Reuniones");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(deals.length ? deals : [{}]), "Embudo");
    XLSX.writeFile(wb, "ventas-os.xlsx");
    toast("Excel exportado", "ok");
  }
  function exportPDF() {
    const all = rangeStats(() => true);
    const win = window.open("", "_blank");
    if (!win) { toast("Permite ventanas emergentes para exportar PDF", "warn"); return; }
    const rk = objectionRanking().slice(0, 8);
    win.document.write(`<html><head><title>Reporte de Ventas</title><meta charset="utf-8">
      <style>body{font-family:Arial,sans-serif;color:#111;padding:32px;max-width:800px;margin:auto}
      h1{font-size:24px}h2{font-size:16px;border-bottom:2px solid #6366f1;padding-bottom:4px;margin-top:28px}
      .kpis{display:flex;flex-wrap:wrap;gap:12px}.k{border:1px solid #ddd;border-radius:8px;padding:12px 16px;min-width:140px}
      .k b{font-size:22px;display:block}.k span{color:#666;font-size:12px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}
      </style></head><body>
      <h1>Reporte de Ventas</h1><p>Generado el ${longDate(todayStr())}</p>
      <h2>Métricas globales</h2>
      <div class="kpis">
        <div class="k"><b>${all.count}</b><span>Llamadas</span></div>
        <div class="k"><b>${state.leads.length}</b><span>Leads</span></div>
        <div class="k"><b>${state.meetings.length}</b><span>Reuniones</span></div>
        <div class="k"><b>${all.won}</b><span>Cierres</span></div>
        <div class="k"><b>${pct(all.conv)}</b><span>Conversión</span></div>
        <div class="k"><b>${Math.round(all.avgScore)}/100</b><span>Score prom.</span></div>
      </div>
      <h2>Embudo</h2><table><tr><th>Etapa</th><th>Negocios</th></tr>
      ${STAGES.map((s) => { const l = dealsByStage()[s.id] || []; return `<tr><td>${s.label}</td><td>${l.length}</td></tr>`; }).join("")}</table>
      ${rk.length ? `<h2>Top objeciones</h2><table><tr><th>Objeción</th><th>Frecuencia</th><th>% de llamadas</th></tr>${rk.map((o) => `<tr><td>${esc(o.text)}</td><td>${o.count}</td><td>${pct(o.rate)}</td></tr>`).join("")}</table>` : ""}
      <script>window.onload=function(){window.print();}<\/script></body></html>`);
    win.document.close();
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  function exportBackup() {
    download(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }), `ventas-os-backup-${todayStr()}.json`);
    toast("Copia de seguridad descargada", "ok");
  }
  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = migrate(JSON.parse(reader.result));
        scheduleSave(); render();
        toast("Datos restaurados correctamente", "ok", 3500);
      } catch (e) { toast("Archivo inválido: no se pudo restaurar", "err", 5000); }
    };
    reader.onerror = () => toast("No se pudo leer el archivo", "err");
    reader.readAsText(file);
  }

  /* ============================================================
     MODALES
     ============================================================ */
  function openModal(html, cls) {
    const root = $("#modalRoot");
    root.innerHTML = `<div class="overlay" data-act="close-modal"><div class="modal ${cls || ""}" role="dialog">${html}</div></div>`;
    requestAnimationFrame(() => root.querySelector(".overlay").classList.add("show"));
  }
  function closeModal() { $("#modalRoot").innerHTML = ""; }

  /* ---- Detalle de día ---- */
  function initials(s) {
    const t = (s || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
    return (t || "?").toUpperCase();
  }
  function scoreTone(n) { return n >= 75 ? "good" : n >= 50 ? "mid" : "low"; }
  function dayCallCard(c) {
    const accent = statusColor(c.status);
    const sub = [c.name && c.company ? esc(c.name) : "", c.title ? esc(c.title) : ""].filter(Boolean).join(" · ");
    return `<button class="dc" data-act="edit-call" data-id="${c.id}" style="--accent:${accent}">
      <span class="dc-avatar" style="--accent:${accent}">${initials(c.company || c.name)}</span>
      <span class="dc-main">
        <span class="dc-head">
          <strong class="dc-title">${esc(c.company || c.name || "Llamada")}</strong>
          ${c.time ? `<span class="dc-time">${ico.clock}${c.time}</span>` : ""}
        </span>
        ${sub ? `<span class="dc-sub">${sub}</span>` : ""}
        <span class="dc-chips">
          <span class="badge" style="--bg:${accent}">${esc(c.status || "Sin estado")}</span>
          ${c.result ? `<span class="chip">${esc(c.result)}</span>` : ""}
          ${c.scoreTotal != null ? `<span class="dc-score ${scoreTone(c.scoreTotal)}">${c.scoreTotal}<i>/100</i></span>` : ""}
          ${(c.objections && c.objections.length) ? `<span class="chip dim">${c.objections.length} obj.</span>` : ""}
        </span>
      </span>
      <span class="dc-arrow">${ico.chevron}</span>
    </button>`;
  }
  function openDay(date) {
    const cs = callsOn(date).slice().sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const dd = state.days[date] || { learnings: "", improvements: "" };
    const st = rangeStats((c) => c.date === date);
    openModal(`
      <div class="modal-h"><div><h2>${longDate(date)}</h2>
        <div class="day-mini"><span>${st.count} llamadas</span><span>${st.meetings} reuniones</span><span>${st.won} cierres</span><span>${pct(st.conv)} conv.</span></div></div>
        <button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b">
        <div class="day-section">
          <div class="day-sec-h"><h3>Llamadas del día</h3><button class="btn btn-primary sm" data-act="add-call" data-date="${date}">${ico.plus} Añadir</button></div>
          <div class="day-calls">
            ${cs.length ? cs.map(dayCallCard).join("") : `<div class="dc-empty">${ico.phone}<span>Sin llamadas registradas este día.</span><button class="btn btn-primary sm" data-act="add-call" data-date="${date}">${ico.plus} Registrar la primera</button></div>`}
          </div>
        </div>
        <div class="day-grid2">
          <label class="field"><span>${ico.bulb} Aprendizajes del día</span>
            <textarea id="dLearn" rows="5" placeholder="Descubrimientos, patrones, nuevas objeciones, técnicas efectivas...">${esc(dd.learnings)}</textarea></label>
          <label class="field"><span>${ico.shield} Cosas por mejorar</span>
            <textarea id="dImprove" rows="5" placeholder="Errores, debilidades, oportunidades de mejora...">${esc(dd.improvements)}</textarea></label>
        </div>
      </div>
      <div class="modal-f"><button class="btn btn-ghost" data-act="close-modal">Cerrar</button>
        <button class="btn btn-primary" data-act="save-day" data-date="${date}">Guardar reflexión</button></div>
    `, "lg");
  }
  function statusColor(s) {
    if (/ganado/i.test(s)) return "#34d399"; if (/perdido/i.test(s)) return "#f87171";
    if (/propuesta|negocia/i.test(s)) return "#f59e0b"; if (/reuni/i.test(s)) return "#818cf8";
    if (/seguimiento/i.test(s)) return "#22d3ee"; return "#60a5fa";
  }

