"use strict";
/* Ventas OS — módulo: shell de render (mount, render, sidebar, topbar)
   Generado al separar ventas-os.html. Ámbito global compartido entre <script> clásicos. */

  /* ============================================================
     RENDER
     ============================================================ */
  function mount() {
    document.body.innerHTML = `
      <div id="app">
        <aside class="sidebar" id="sidebar"></aside>
        <main class="main">
          <header class="topbar" id="topbar"></header>
          <div class="view" id="view"></div>
        </main>
      </div>
      <div id="modalRoot"></div>
      <div id="toastRoot"></div>`;
    document.body.addEventListener("click", onClick);
    if (!Store.durable) toast("Este entorno no guarda datos al cerrar. Usa “Copia de seguridad” en Exportar para descargar y restaurar tu información.", "warn", 8000);
  }

  function navItems() { return [
    { id: "calendar", label: "Calendario", icon: ico.calendar },
    { id: "leads", label: "Leads", icon: ico.users },
    { id: "preleads", label: "Preleads", icon: ico.spark },
    { id: "pipeline", label: "Embudo", icon: ico.pipeline },
    { id: "dashboard", label: "Dashboard", icon: ico.chart },
    { id: "meetings", label: "Reuniones", icon: ico.clock },
    { id: "objections", label: "Objeciones", icon: ico.shield },
    { id: "journal", label: "Bitácora", icon: ico.book },
    { id: "knowledge", label: "Conocimiento", icon: ico.bulb },
    { id: "goals", label: "Metas", icon: ico.target },
    { id: "coach", label: "Coach IA", icon: ico.spark },
    { id: "export", label: "Exportar", icon: ico.download },
  ]; }

  function renderSidebar() {
    const v = state.ui.view;
    $("#sidebar").innerHTML = `
      <div class="brand">
        <div class="brand-mark">V</div>
        <div class="brand-text"><strong>Ventas OS</strong><span>Sistema comercial</span></div>
      </div>
      <nav class="nav">
        ${navItems().map((n) => `<button class="nav-item ${v === n.id ? "active" : ""}" data-act="nav" data-view="${n.id}">
          <span class="nav-ico">${n.icon}</span><span>${n.label}</span></button>`).join("")}
      </nav>
      <div class="sidebar-foot">
        <div class="streak-pill">${ico.flame}<span><strong>${streak()}</strong> días seguidos</span></div>
      </div>`;
  }

  function renderTopbar() {
    const m = rangeStats(monthFilter());
    $("#topbar").innerHTML = `
      <div class="tb-title"><h1>${navItems().find((n) => n.id === state.ui.view).label}</h1>
        <span class="tb-sub">${miniSub()}</span></div>
      <span id="syncBadge" class="tb-sync">${cloudBadgeHTML()}</span>
      <div class="tb-kpis">
        <div class="tb-kpi"><span class="tb-kpi-n">${m.count}</span><span class="tb-kpi-l">Llamadas (mes)</span></div>
        <div class="tb-kpi"><span class="tb-kpi-n">${state.leads.length}</span><span class="tb-kpi-l">Leads</span></div>
        <div class="tb-kpi"><span class="tb-kpi-n">${m.meetings}</span><span class="tb-kpi-l">Reuniones</span></div>
        <div class="tb-kpi"><span class="tb-kpi-n">${pct(m.conv)}</span><span class="tb-kpi-l">Conversión</span></div>
      </div>
      <button class="btn btn-primary" data-act="quick-call">${ico.plus} Registrar llamada</button>`;
  }
  function miniSub() {
    const v = state.ui.view;
    if (v === "calendar") { const d = parseDate(state.ui.monthCursor); return MONTHS[d.getMonth()] + " " + d.getFullYear(); }
    const map = { leads: "Base de contactos · teléfono único", pipeline: "Arrastra prospectos entre etapas", dashboard: "Vista ejecutiva en tiempo real", meetings: "Agenda y seguimiento de reuniones", objections: "Checklist y ranking automático", journal: "Aprendizaje y mejora continua", knowledge: "Biblioteca de ventas", goals: "Objetivos y progreso", coach: "Análisis con IA", export: "Nube · respaldos · exportar" };
    return map[v] || "";
  }

  function monthFilter() {
    const d = parseDate(state.ui.monthCursor);
    const y = d.getFullYear(), mo = d.getMonth();
    return (c) => { const cd = parseDate(c.date); return cd.getFullYear() === y && cd.getMonth() === mo; };
  }

  function render() {
    renderSidebar();
    renderTopbar();
    const v = state.ui.view;
    const host = $("#view");
    Object.keys(charts).forEach((k) => { try { charts[k].destroy(); } catch (e) {} delete charts[k]; });
    if (v === "calendar") host.innerHTML = viewCalendar();
    else if (v === "leads") host.innerHTML = viewLeads();
    else if (v === "preleads") host.innerHTML = viewPreleads();
    else if (v === "pipeline") host.innerHTML = viewPipeline();
    else if (v === "dashboard") { host.innerHTML = viewDashboard(); requestAnimationFrame(drawDashboardCharts); }
    else if (v === "meetings") host.innerHTML = viewMeetings();
    else if (v === "objections") host.innerHTML = viewObjections();
    else if (v === "journal") host.innerHTML = viewJournal();
    else if (v === "knowledge") host.innerHTML = viewKnowledge();
    else if (v === "goals") host.innerHTML = viewGoals();
    else if (v === "coach") host.innerHTML = viewCoach();
    else if (v === "export") host.innerHTML = viewExport();
    if (v === "pipeline") wirePipelineDnD();
  }

