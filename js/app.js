"use strict";
/* Ventas OS — módulo: eventos (onClick + listeners), toast, íconos, arranque
   Generado al separar ventas-os.html. Ámbito global compartido entre <script> clásicos. */

  /* ============================================================
     EVENTOS
     ============================================================ */
  function onClick(e) {
    const t = e.target.closest("[data-act]");
    // búsqueda KB (input, no click)
    if (!t) return;
    const act = t.dataset.act;
    const id = t.dataset.id;
    switch (act) {
      case "nav": state.ui.view = t.dataset.view; scheduleSave(); render(); break;
      case "month": {
        const dir = t.dataset.dir;
        const d = parseDate(state.ui.monthCursor);
        if (dir === "0") { const n = new Date(); state.ui.monthCursor = dstr(new Date(n.getFullYear(), n.getMonth(), 1)); }
        else { d.setMonth(d.getMonth() + parseInt(dir, 10)); state.ui.monthCursor = dstr(d); }
        scheduleSave(); render(); break;
      }
      case "open-day": openDay(t.dataset.date); break;
      case "add-call": callForm(null, t.dataset.date); break;
      case "quick-call": callForm(null, todayStr()); break;
      case "edit-call": { const c = state.calls.find((x) => x.id === id); if (c) callForm(c); break; }
      case "save-call": readCallForm(id, t.dataset.prelead || null); closeModal(); render(); toast("Llamada guardada", "ok"); break;
      case "del-call": if (confirm("¿Eliminar esta llamada?")) { state.calls = state.calls.filter((x) => x.id !== id); scheduleSave(); closeModal(); render(); } break;
      case "link-lead": {
        const l = state.leads.find((x) => x.id === id); if (!l) break;
        const set = (sel, v) => { const el = $(sel); if (el && v) el.value = v; };
        set("#f_name", l.name); set("#f_company", l.company); set("#f_title", l.title); set("#f_whatsapp", l.whatsapp);
        set("#f_email", l.email); set("#f_website", l.website); set("#f_industry", l.industry); set("#f_size", l.size); set("#f_location", l.location);
        const st = $("#f_status"); if (st && l.status) st.value = l.status;
        toast("Datos del lead cargados", "ok"); break;
      }
      case "new-lead": leadForm(null); break;
      case "edit-lead": { const l = state.leads.find((x) => x.id === id); if (l) leadForm(l); break; }
      case "save-lead": if (readLeadForm(id)) { closeModal(); render(); toast("Lead guardado", "ok"); } break;
      case "del-lead": if (confirm("¿Eliminar este lead? Las llamadas registradas se conservan.")) { state.leads = state.leads.filter((x) => x.id !== id); scheduleSave(); closeModal(); render(); } break;
      case "open-lead": openLead(id); break;
      case "lead-import": importOpen(); break;
      case "lead-export": leadExport(); break;
      case "lead-dedupe-all": dedupeAll(); break;
      case "lead-sortdir": leadView.dir *= -1; refreshLeads(); break;
      case "lead-sort": { const k = t.dataset.k; if (leadView.sort === k) leadView.dir *= -1; else { leadView.sort = k; leadView.dir = k === "rating" || k === "reviews" ? -1 : 1; } refreshLeads(); break; }
      case "lead-page": { const pg = leadsFiltered(); const mx = Math.max(1, Math.ceil(pg.length / leadView.per)); leadView.page = t.dataset.p === "next" ? Math.min(mx, leadView.page + 1) : Math.max(1, leadView.page - 1); refreshLeads(); break; }
      case "lead-selall": { const list = leadsFiltered().slice((leadView.page - 1) * leadView.per, leadView.page * leadView.per); const all = list.every((l) => leadView.sel.has(l.id)); list.forEach((l) => all ? leadView.sel.delete(l.id) : leadView.sel.add(l.id)); refreshLeads(); break; }
      case "lead-sel": { if (leadView.sel.has(t.dataset.id)) leadView.sel.delete(t.dataset.id); else leadView.sel.add(t.dataset.id); refreshLeads(); break; }
      case "bulk-clear": leadView.sel.clear(); refreshLeads(); break;
      case "bulk-del": {
        if (!leadView.sel.size) break;
        if (leadView.target === "preleads") {
          if (!confirm(`¿Descartar ${leadView.sel.size} preleads seleccionados? No se borran: se ocultan y quedan marcados para no volver a llamarlos si reaparecen en una importación futura.`)) break;
          leadColl().forEach((l) => { if (leadView.sel.has(l.id)) { l.status = "Descartado"; l.updatedAt = todayStr(); pushHistory(l, "Descartado manualmente (oculto de Preleads)"); } });
          leadView.sel.clear(); scheduleSave(); refreshLeads(); toast("Preleads descartados — no se borraron, se ocultaron", "ok", 3200);
        } else {
          if (!confirm(`¿Eliminar ${leadView.sel.size} registros seleccionados?`)) break;
          state[leadView.target] = leadColl().filter((l) => !leadView.sel.has(l.id));
          leadView.sel.clear(); scheduleSave(); refreshLeads(); toast("Eliminados", "ok");
        }
        break;
      }
      case "bulk-tag": openTagPicker([...leadView.sel], "add"); break;
      case "open-tags": openTagPicker([id], "set"); break;
      case "tag-create-pick": tagCreateFromPicker(); break;
      case "tag-apply": applyTagPicker(); break;
      case "open-tagmgr": openTagManager(); break;
      case "tagdef-add": tagMgrAdd(); break;
      case "tagdef-del": tagMgrDelete(id); break;
      case "tagmgr-save": tagMgrSave(); break;
      case "open-prelead": openPrelead(id); break;
      case "edit-prelead": { const p = state.preleads.find((x) => x.id === id); if (p) preleadForm(p); break; }
      case "save-prelead": if (readPreleadForm(id)) { closeModal(); render(); toast("Prelead actualizado", "ok"); } break;
      case "del-prelead": {
        const p = state.preleads.find((x) => x.id === id); if (!p) break;
        if (!confirm(`¿Descartar "${p.company || p.name || "este prelead"}"? No se borra: se oculta de la lista y queda marcado, así si vuelve a aparecer en una importación futura lo verás como "ya descartado" en vez de nuevo.`)) break;
        p.status = "Descartado"; p.updatedAt = todayStr(); pushHistory(p, "Descartado manualmente (oculto de Preleads)");
        scheduleSave(); closeModal(); render(); toast("Prelead descartado — no se borró, se ocultó", "ok", 3200);
        break;
      }
      case "restore-prelead": { const p = state.preleads.find((x) => x.id === id); if (!p) break; p.status = "Nuevo"; p.updatedAt = todayStr(); pushHistory(p, "Restaurado a preleads activos"); scheduleSave(); closeModal(); render(); toast("Prelead restaurado", "ok"); break; }
      case "call-prelead": { const p = state.preleads.find((x) => x.id === id); if (p) openCallFromPrelead(p); break; }
      case "imp-cancel": importCancel(); break;
      case "imp-pick": { const f = $("#leadImportFile"); if (f) f.click(); break; }
      case "imp-process": importProcess(); break;
      case "imp-back": imp.step = 2; render(); break;
      case "imp-deldups": imp.processed.forEach((o) => { if (o.dupDb || o.dupFile) o.decision = "eliminar"; }); render(); toast("Duplicados marcados para eliminar", "ok"); break;
      case "imp-commit": importCommit(); break;
      case "imp-page": { const mx = Math.max(1, Math.ceil(imp.processed.length / 50)); imp.page = t.dataset.p === "next" ? Math.min(mx, imp.page + 1) : Math.max(1, imp.page - 1); render(); break; }
      case "call-lead": { const l = state.leads.find((x) => x.id === id); closeModal(); callForm(Object.assign({ date: todayStr(), time: new Date().toTimeString().slice(0, 5), score: {}, objections: [] }, l ? { name: l.name, company: l.company, title: l.title, phone: l.phone, whatsapp: l.whatsapp, email: l.email, website: l.website, industry: l.industry, size: l.size, location: l.location, status: l.status } : {})); break; }
      case "add-obj-inline": {
        const inp = $("#newObjInline"); const txt = inp ? inp.value.trim() : "";
        if (!txt) { toast("Escribe la objeción", "warn"); break; }
        if (state.objectionDefs.some((d) => d.text.toLowerCase() === txt.toLowerCase())) { toast("Esa objeción ya existe", "warn"); break; }
        const def = { id: uid(), text: txt }; state.objectionDefs.push(def); scheduleSave();
        const grid = $("#objChecklist"); if (grid) grid.insertAdjacentHTML("beforeend", objCheckHTML(def, true));
        if (inp) { inp.value = ""; inp.focus(); }
        break;
      }
      case "add-objdef": {
        const inp = $("#newObjDef"); const txt = inp ? inp.value.trim() : "";
        if (!txt) { toast("Escribe la objeción", "warn"); break; }
        if (state.objectionDefs.some((d) => d.text.toLowerCase() === txt.toLowerCase())) { toast("Esa objeción ya existe", "warn"); break; }
        state.objectionDefs.push({ id: uid(), text: txt }); scheduleSave(); render(); break;
      }
      case "del-objdef": if (confirm("¿Eliminar esta objeción del catálogo? No afectará las llamadas ya registradas.")) { state.objectionDefs = state.objectionDefs.filter((d) => d.id !== id); scheduleSave(); render(); } break;
      case "save-day": {
        const date = t.dataset.date;
        state.days[date] = { learnings: $("#dLearn").value.trim(), improvements: $("#dImprove").value.trim() };
        scheduleSave(); closeModal(); render(); toast("Reflexión guardada", "ok"); break;
      }
      case "new-deal": dealForm(null); break;
      case "edit-deal": { const d = state.deals.find((x) => x.id === id); if (d) dealForm(d); break; }
      case "save-deal": readDealForm(id); closeModal(); render(); toast("Prospecto guardado", "ok"); break;
      case "del-deal": if (confirm("¿Eliminar prospecto?")) { state.deals = state.deals.filter((x) => x.id !== id); scheduleSave(); closeModal(); render(); } break;
      case "new-meeting": meetingForm(null); break;
      case "new-meeting-lead": { closeModal(); meetingForm(null, id); break; }
      case "edit-meeting": { const m = state.meetings.find((x) => x.id === id); if (m) meetingForm(m); break; }
      case "save-meeting": if (readMeetingForm(id)) { closeModal(); render(); toast("Reunión guardada", "ok"); } break;
      case "del-meeting": if (confirm("¿Eliminar esta reunión?")) { state.meetings = state.meetings.filter((x) => x.id !== id); scheduleSave(); closeModal(); render(); } break;
      case "meet-done": { const m = state.meetings.find((x) => x.id === id); if (m) { m.status = "Realizada"; scheduleSave(); render(); toast("Reunión marcada como realizada", "ok"); } break; }
      case "new-kb": kbForm(null); break;
      case "edit-kb": { const k = state.knowledge.find((x) => x.id === id); if (k) kbForm(k); break; }
      case "save-kb": {
        const data = { title: $("#k_title").value.trim(), cat: $("#k_cat").value, content: $("#k_content").value.trim(), tags: $("#k_tags").value.trim() };
        if (!data.title) { toast("Agrega un título", "warn"); break; }
        if (id) { const k = state.knowledge.find((x) => x.id === id); Object.assign(k, data); }
        else state.knowledge.unshift(Object.assign({ id: uid() }, data));
        scheduleSave(); closeModal(); render(); break;
      }
      case "del-kb": if (confirm("¿Eliminar entrada?")) { state.knowledge = state.knowledge.filter((x) => x.id !== id); scheduleSave(); closeModal(); render(); } break;
      case "save-goals": {
        $$("[data-goal]").forEach((inp) => { state.goals[inp.dataset.goal] = num(inp.value); });
        scheduleSave(); render(); toast("Metas actualizadas", "ok"); break;
      }
      case "ai": runAI(t.dataset.mode); break;
      case "export": { const k = t.dataset.kind; if (k === "csv") exportCSV(); else if (k === "xlsx") exportXLSX(); else exportPDF(); break; }
      case "backup": exportBackup(); break;
      case "restore": { const inp = $("#restoreFile"); if (inp) inp.click(); break; }
      case "save-now": cloudPush().then(() => toast(cloudStatus === "saved" ? "Guardado en la nube" : "No se pudo guardar (revisa conexión)", cloudStatus === "saved" ? "ok" : "warn", 2600)); break;
      case "reload-cloud": cloudPull().then(() => toast(cloudStatus === "saved" ? "Datos recargados desde la nube" : "No se pudo recargar (revisa conexión)", cloudStatus === "saved" ? "ok" : "warn", 2200)); break;
      case "test-conn": testConnection(); break;
      case "wipe": if (confirm("Esto borrará TODOS tus datos de forma permanente (en este dispositivo y en la base de datos de Supabase). ¿Continuar?")) { state = defaultState(); scheduleSave(); render(); toast("Datos borrados", "ok"); } break;
      case "close-modal": if (t.classList.contains("overlay")) { if (e.target === t) closeModal(); } else closeModal(); break;
    }
  }

  // búsqueda en conocimiento (input en vivo)
  document.addEventListener("input", (e) => {
    if (!e.target) return;
    if (e.target.id === "kbSearch") {
      kbQuery = e.target.value;
      const grid = $(".kb-grid");
      if (grid) grid.innerHTML = kbGridHTML();
    } else if (e.target.id === "leadSearch") {
      leadQuery = e.target.value; leadView.page = 1; refreshLeads();
    } else if (imp && e.target.id === "impCountry") {
      imp.defaults.country = e.target.value.trim();
    } else if (imp && e.target.id === "impCity") {
      imp.defaults.city = e.target.value.trim();
    } else if (imp && e.target.id === "impInformationSource") {
      imp.defaults.informationSource = e.target.value.trim();
    } else if (e.target.id === "f_phone") {
      renderLeadMatch(e.target.value, false);
    } else if (e.target.id === "l_phone") {
      renderLeadFormMatch(e.target.value);
    }
  });

  document.addEventListener("change", (e) => {
    const t = e.target; if (!t) return;
    if (t.id === "restoreFile" && t.files && t.files[0]) { importBackup(t.files[0]); t.value = ""; }
    else if (t.id === "leadImportFile" && t.files && t.files[0]) { importReadFile(t.files[0]); t.value = ""; }
    else if (t.id === "leadStatusFilter") { leadView.status = t.value; leadView.page = 1; refreshLeads(); }
    else if (t.id === "leadCountryFilter") { leadView.country = t.value; leadView.page = 1; refreshLeads(); }
    else if (t.id === "leadCityFilter") { leadView.city = t.value; leadView.page = 1; refreshLeads(); }
    else if (t.id === "leadSourceFilter") { leadView.informationSource = t.value; leadView.page = 1; refreshLeads(); }
    else if (t.id === "leadFlagFilter") { leadView.flag = t.value; leadView.page = 1; refreshLeads(); }
    else if (t.id === "leadWebFilter") { leadView.web = t.value; leadView.page = 1; refreshLeads(); }
    else if (t.id === "leadTagFilter") { leadView.tag = t.value; leadView.page = 1; refreshLeads(); }
    else if (t.id === "leadSortSel") { leadView.sort = t.value; refreshLeads(); }
    else if (t.id === "l_country") { const city = $("#l_city"); if (city) city.innerHTML = cityOptionsHTML(t.value, ""); }
    else if (t.id === "p_country") { const city = $("#p_city"); if (city) city.innerHTML = cityOptionsHTML(t.value, ""); }
    else if (t.id === "f_prelead") { applyPreleadToForm(t.value); }
    else if (t.id === "bulkStatus" && t.value) { bulkSetStatus(t.value); }
    else if (t.dataset && t.dataset.act === "lead-status") { setLeadStatus(t.dataset.id, t.value); }
    else if (t.dataset && t.dataset.act === "imp-map") { imp.map[+t.dataset.i] = t.value; importRefreshStep2(); }
    else if (t.dataset && t.dataset.act === "imp-dec") { const o = imp.processed.find((x) => x._row == t.dataset.r); if (o) { o.decision = t.value; importRefreshStats(); } }
  });
  function importRefreshStep2() { const a = imp.map.indexOf("phone") >= 0; const b = $("[data-act='imp-process']"); if (b) b.disabled = !a; }
  function importRefreshStats() { render(); }

  /* ---------- Toast ---------- */
  function toast(msg, kind, ms) {
    const root = $("#toastRoot"); if (!root) return;
    const el = document.createElement("div");
    el.className = "toast " + (kind || "ok");
    el.innerHTML = `${kind === "warn" ? ico.shield : ico.check} <span>${esc(msg)}</span>`;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 250); }, ms || 2400);
  }

  /* ---------- Iconos (SVG inline) ---------- */
  function ico() {}
  Object.assign(ico, {
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16M4 5v4l6 3v7M20 5v4l-6 3"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="7"/><rect x="12" y="7" width="3" height="11"/><rect x="17" y="13" width="3" height="5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>',
    checkfill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    bookmini: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12c.5.5 1 1.5 1 3h6c0-1.5.5-2.5 1-3a7 7 0 0 0-4-12z"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 4-2 6-1 1.5-1 3 0 4 .8.8.5 2-.5 2.5-1 .5-2-.2-2-1.5 0 0-2 1.5-2 4 0 3 2.5 5 6 5s6-2.2 6-5.5C17.5 11 12 9 12 2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9a6 6 0 0 0 12 0V3H6zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M9 21h6M12 15v6"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/></svg>',
    percent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.9 21l1.2-6.9-5-4.9 6.9-1z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  });

  /* ---------- Init ---------- */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
