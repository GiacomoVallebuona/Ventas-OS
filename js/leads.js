"use strict";
/* Ventas OS — módulo: módulo leads/preleads: filtros, tabla, importador, etiquetas
   Generado al separar ventas-os.html. Ámbito global compartido entre <script> clásicos. */

  /* ---------- TAREAS ---------- */
  /* ---------- LEADS ---------- */
  let leadQuery = "";
  let leadView = { target: "leads", status: "", flag: "", web: "", tag: "", country: "", city: "", informationSource: "", sort: "updatedAt", dir: -1, page: 1, per: 50, sel: new Set() };
  let imp = null;
  const leadStateColor = (s) => LEAD_STATE_COLOR[s] || statusColor(s);
  const dupKeyOf = (l) => normPhone(l.phone);
  const leadColl = () => state[leadView.target];

  /* ---------- Etiquetas (catálogo state.tagDefs + utilidades) ---------- */
  const hasWebsite = (l) => !!String(l && l.website || "").trim();
  const recordTagList = (l) => String(l && l.tags || "").split(",").map((s) => s.trim()).filter(Boolean);
  function setRecordTags(l, names) {
    const seen = new Set(), out = [];
    names.map((s) => String(s).trim()).filter(Boolean).forEach((n) => { const k = n.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(n); } });
    l.tags = out.join(", ");
  }
  const tagDefByName = (name) => state.tagDefs.find((d) => (d.name || "").toLowerCase() === String(name || "").trim().toLowerCase()) || null;
  const tagColorByName = (name) => { const d = tagDefByName(name); return d ? d.color : "var(--accent)"; };
  function addTagDef(name, color) {
    name = String(name || "").trim(); if (!name) return null;
    let d = tagDefByName(name);
    if (!d) { d = { id: uid(), name, color: color || TAG_COLORS[state.tagDefs.length % TAG_COLORS.length] }; state.tagDefs.push(d); }
    else if (color) d.color = color;
    return d;
  }
  const sortedTagDefs = () => state.tagDefs.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const sortedInformationSources = () => Array.from(new Map((state.sourceDefs || []).concat(state.leads || [], state.preleads || [])
    .map((x) => [String(x && (x.name || x.informationSource) || "").trim().toLowerCase(), String(x && (x.name || x.informationSource) || "").trim()])
    .filter((x) => x[0])).values()).sort((a, b) => a.localeCompare(b, "es"));

  function dbDupSet(coll) {
    const seen = {}, dup = {};
    (coll || leadColl()).forEach((l) => { const k = dupKeyOf(l); if (!k) return; if (seen[k]) dup[k] = true; else seen[k] = true; });
    return dup;
  }
  function leadsFiltered() {
    const q = leadQuery.trim().toLowerCase();
    const dup = leadView.flag === "dups" ? dbDupSet() : null;
    let list = leadColl().slice();
    // Los preleads "Descartado" no se borran (se conservan para detectar duplicados al reimportar),
    // solo se ocultan de la vista normal. Si el usuario filtra explícitamente por ese estado, sí se ven.
    if (leadView.target === "preleads" && !leadView.status) list = list.filter((l) => l.status !== "Descartado");
    if (q) list = list.filter((l) => [l.name, l.company, l.phone, l.countryCode, l.email, l.website, l.category, l.location, l.address, l.industry, l.status, l.tags, l.country, l.city, l.informationSource].some((v) => String(v || "").toLowerCase().includes(q)));
    if (leadView.status) list = list.filter((l) => (l.status || "") === leadView.status);
    if (leadView.country) list = list.filter((l) => (l.country || "") === leadView.country);
    if (leadView.city) list = list.filter((l) => (l.city || "") === leadView.city);
    if (leadView.informationSource) list = list.filter((l) => String(l.informationSource || "").toLowerCase() === leadView.informationSource.toLowerCase());
    if (leadView.web === "has") list = list.filter(hasWebsite);
    else if (leadView.web === "none") list = list.filter((l) => !hasWebsite(l));
    if (leadView.tag) list = list.filter((l) => recordTagList(l).some((t) => t.toLowerCase() === leadView.tag.toLowerCase()));
    if (leadView.flag === "dups") list = list.filter((l) => dup[dupKeyOf(l)]);
    else if (leadView.flag === "incomplete") list = list.filter((l) => !leadComplete(l));
    else if (leadView.flag === "nophone") list = list.filter((l) => !normPhone(l.phone));
    const k = leadView.sort, d = leadView.dir;
    list.sort((a, b) => {
      let va = a[k], vb = b[k];
      if (k === "rating" || k === "reviews") { va = num(va); vb = num(vb); return (va - vb) * d; }
      return String(va || "").localeCompare(String(vb || "")) * d;
    });
    return list;
  }
  function leadStats() {
    const coll = leadView.target === "preleads" ? leadColl().filter((l) => l.status !== "Descartado") : leadColl();
    const total = coll.length;
    const dup = dbDupSet(coll);
    const dupCount = coll.filter((l) => dup[dupKeyOf(l)]).length;
    const incompl = coll.filter((l) => !leadComplete(l)).length;
    const withWeb = coll.filter(hasWebsite).length;
    return { total, valid: total - incompl, incompl, dupCount, withWeb, noWeb: total - withWeb };
  }
  function viewLeads() { leadView.target = "leads"; return leadsModuleHTML({ title: "leads", importBtn: true, newBtn: true, dedupeBtn: true }); }
  function viewPreleads() { leadView.target = "preleads"; return leadsModuleHTML({ title: "preleads", importBtn: true, newBtn: false, dedupeBtn: true, preleadMode: true }); }
  function leadsModuleHTML(opts) {
    if (imp) return importWizardHTML();
    const st = leadStats();
    const sortOpt = (k, l) => `<option value="${k}" ${leadView.sort === k ? "selected" : ""}>${l}</option>`;
    return `
      ${opts.preleadMode ? `<div class="card" style="margin-bottom:14px"><p class="muted sm" style="margin:0">${ico.spark} Aquí llegan los contactos importados que <b>aún no han recibido una llamada</b>. Al registrar la primera llamada, selecciona el prelead para autocompletar sus datos: pasará automáticamente a la lista de <b>Leads</b>.</p></div>` : ""}
      <div class="lead-toolbar">
        <div class="search"><span>${ico.search}</span><input id="leadSearch" placeholder="Buscar negocio, teléfono, categoría, ubicación..." value="${esc(leadQuery)}"></div>
        <select id="leadStatusFilter" class="mini-select"><option value="">Todos los estados</option>${LEAD_STATES.map((s) => `<option ${leadView.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>
        <select id="leadCountryFilter" class="mini-select" title="Filtrar por país"><option value="">Todos los países</option>${geoCountryNames().map((c) => `<option value="${esc(c)}" ${leadView.country === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
        <select id="leadCityFilter" class="mini-select" title="Filtrar por ciudad"><option value="">Todas las ciudades</option>${Array.from(new Set(leadColl().map((l) => l.city).filter(Boolean).concat(geoCountryNames().flatMap(geoCitiesFor)))).sort((a, b) => a.localeCompare(b, "es")).map((c) => `<option value="${esc(c)}" ${leadView.city === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
        <select id="leadSourceFilter" class="mini-select" title="Filtrar por fuente"><option value="">Todas las fuentes</option>${sortedInformationSources().map((name) => `<option value="${esc(name)}" ${leadView.informationSource.toLowerCase() === name.toLowerCase() ? "selected" : ""}>${esc(name)}</option>`).join("")}</select>
        <select id="leadWebFilter" class="mini-select" title="Filtrar por sitio web">
          <option value="">Web: todos</option>
          <option value="has" ${leadView.web === "has" ? "selected" : ""}>Con sitio web</option>
          <option value="none" ${leadView.web === "none" ? "selected" : ""}>Sin sitio web</option>
        </select>
        <select id="leadTagFilter" class="mini-select" title="Filtrar por etiqueta">
          <option value="">Todas las etiquetas</option>
          ${sortedTagDefs().map((d) => `<option value="${esc(d.name)}" ${leadView.tag.toLowerCase() === d.name.toLowerCase() ? "selected" : ""}>${esc(d.name)}</option>`).join("")}
        </select>
        <select id="leadFlagFilter" class="mini-select">
          <option value="">Todos</option>
          <option value="dups" ${leadView.flag === "dups" ? "selected" : ""}>Solo duplicados</option>
          <option value="incomplete" ${leadView.flag === "incomplete" ? "selected" : ""}>Incompletos</option>
          <option value="nophone" ${leadView.flag === "nophone" ? "selected" : ""}>Sin teléfono</option>
        </select>
        <select id="leadSortSel" class="mini-select">${sortOpt("updatedAt", "Recientes")}${sortOpt("name", "Nombre")}${sortOpt("rating", "Calificación")}${sortOpt("reviews", "Reseñas")}${sortOpt("status", "Estado")}${sortOpt("category", "Categoría")}</select>
        <button class="icon-btn" data-act="lead-sortdir" title="Invertir orden">${leadView.dir === -1 ? "▼" : "▲"}</button>
        <span style="flex:1"></span>
        <button class="btn btn-ghost sm" data-act="open-tagmgr" title="Crear y administrar etiquetas">${ico.tag} Etiquetas</button>
        <button class="btn btn-ghost sm" data-act="lead-export">${ico.download} Exportar</button>
        ${opts.dedupeBtn ? `<button class="btn btn-ghost sm" data-act="lead-dedupe-all" title="Quitar duplicados">${ico.shield} Quitar duplicados</button>` : ""}
        ${opts.importBtn ? `<button class="btn btn-primary sm" data-act="lead-import">${ico.download} Importar</button>` : ""}
        ${opts.newBtn ? `<button class="btn btn-primary sm" data-act="new-lead">${ico.plus} Nuevo</button>` : ""}
      </div>
      <div class="lead-stats">
        ${leadStat("Total", st.total, "")}${leadStat("Con web", st.withWeb, "good")}${leadStat("Sin web", st.noWeb, st.noWeb ? "warn" : "")}${leadStat("Válidos", st.valid, "good")}${leadStat("Incompletos", st.incompl, st.incompl ? "warn" : "")}${leadStat("Duplicados", st.dupCount, st.dupCount ? "bad" : "")}
      </div>
      <div id="leadBody">${leadsBodyHTML()}</div>`;
  }
  function leadStat(l, n, tone) { return `<div class="lstat ${tone}"><b>${n}</b><span>${l}</span></div>`; }
  function refreshLeads() { const b = $("#leadBody"); if (b) b.innerHTML = leadsBodyHTML(); }

  function leadsBodyHTML() {
    const isPre = leadView.target === "preleads";
    const list = leadsFiltered();
    const dup = dbDupSet();
    const pages = Math.max(1, Math.ceil(list.length / leadView.per));
    if (leadView.page > pages) leadView.page = pages;
    const start = (leadView.page - 1) * leadView.per;
    const pageRows = list.slice(start, start + leadView.per);
    if (!list.length) return `<div class="empty-state">${ico.users}<p>${leadQuery || leadView.status || leadView.country || leadView.city || leadView.informationSource || leadView.flag ? "Sin resultados con esos filtros." : (isPre ? "Aún no hay preleads. Importa un archivo CSV/XLSX para empezar a prospectar." : "Aún no hay leads. Se crean automáticamente al registrar la primera llamada a un prelead o contacto nuevo.")}</p></div>`;
    const selCount = leadView.sel.size;
    const bulk = selCount ? `<div class="bulk-bar">
        <span><b>${selCount}</b> seleccionados</span>
        ${isPre ? "" : `<select id="bulkStatus" class="mini-select"><option value="">Cambiar estado…</option>${LEAD_STATES.map((s) => `<option>${s}</option>`).join("")}</select>`}
        <button class="btn btn-ghost sm" data-act="bulk-tag">${ico.tag} Etiquetar</button>
        <button class="btn btn-ghost sm" data-act="bulk-del">${ico.trash} Eliminar</button>
        <button class="btn btn-ghost sm" data-act="bulk-clear">Limpiar selección</button>
      </div>` : "";
    const allChecked = pageRows.length && pageRows.every((l) => leadView.sel.has(l.id));
    const th = (k, l) => `<th class="sortable" data-act="lead-sort" data-k="${k}">${l}${leadView.sort === k ? (leadView.dir === -1 ? " ▼" : " ▲") : ""}</th>`;
    return bulk + `<div class="lead-table-wrap"><table class="lead-table adv">
      <thead><tr>
        <th class="chk"><input type="checkbox" data-act="lead-selall" ${allChecked ? "checked" : ""}></th>
        ${th("name", "Negocio")}<th>Teléfono</th>${th("category", "Categoría")}${th("location", "Ubicación")}${th("city", "Ciudad")}${th("country", "País")}${th("rating", "★")}${th("reviews", "Reseñas")}${isPre ? "" : th("status", "Estado")}<th>Fuente de información</th><th>Etiquetas</th><th></th>
      </tr></thead><tbody>
      ${pageRows.map((l) => {
        const isDup = dup[dupKeyOf(l)];
        const incomplete = !leadComplete(l);
        return `<tr class="${isDup ? "row-dup" : ""} ${incomplete ? "row-incompl" : ""}" data-id="${l.id}">
          <td class="chk"><input type="checkbox" data-act="lead-sel" data-id="${l.id}" ${leadView.sel.has(l.id) ? "checked" : ""}></td>
          <td data-act="${isPre ? "open-prelead" : "open-lead"}" data-id="${l.id}" class="lead-name-cell"><div class="lead-id"><span class="lead-avatar" style="--accent:${leadStateColor(l.status)}">${initials(l.company || l.name)}</span>
            <div><b>${esc(l.company || l.name || "Sin nombre")}</b><span class="muted sm">${esc(l.website || l.email || "—")}</span></div></div>
            ${isDup ? `<span class="dup-flag" title="Teléfono duplicado">dup</span>` : ""}</td>
          <td class="ph">${l.countryCode ? `<span class="cc">${esc(l.countryCode)}</span> ` : ""}${esc(l.phone ? splitPhone(l.phone).num || l.phone : "—")}</td>
          <td>${esc(l.category || "—")}</td>
          <td>${esc(l.location || "—")}</td>
          <td>${esc(l.city || "—")}</td>
          <td>${esc(l.country || "—")}</td>
          <td>${l.rating != null && l.rating !== "" ? `<span class="rating">${(+l.rating).toFixed(1)}</span>` : "—"}</td>
          <td>${l.reviews != null && l.reviews !== "" ? num(l.reviews) : "—"}</td>
          ${isPre ? "" : `<td><select class="row-status mini-select" data-act="lead-status" data-id="${l.id}">${LEAD_STATES.concat(l.status && LEAD_STATES.indexOf(l.status) < 0 ? [l.status] : []).map((s) => `<option ${l.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></td>`}
          <td class="muted sm">${esc(l.informationSource || "—")}</td>
          <td class="tags-cell" data-act="open-tags" data-id="${l.id}" title="Asignar etiquetas">${recordTagList(l).map((t) => `<span class="tag-chip" style="--tagc:${tagColorByName(t)}">${esc(t)}</span>`).join("") || `<span class="tag-add">${ico.plus} etiqueta</span>`}</td>
          <td class="lead-go-cell">${isPre ? `<button class="btn btn-primary xs" data-act="call-prelead" data-id="${l.id}" title="Registrar llamada">${ico.phone}</button>` : ""}${isPre && l.status === "Descartado" ? `<button class="btn btn-ghost xs" data-act="restore-prelead" data-id="${l.id}" title="Restaurar a preleads activos">Restaurar</button>` : `<span class="lead-go" data-act="${isPre ? "del-prelead" : "del-lead"}" data-id="${l.id}" title="${isPre ? "Descartar (no se borra: se oculta y queda marcado para no volver a llamar si reaparece en una importación)" : "Eliminar"}">${ico.trash}</span>`}</td>
        </tr>`;
      }).join("")}
      </tbody></table></div>
      <div class="pager">
        <button class="btn btn-ghost sm" data-act="lead-page" data-p="prev" ${leadView.page <= 1 ? "disabled" : ""}>← Anterior</button>
        <span class="muted sm">Página ${leadView.page} de ${pages} · ${list.length} ${isPre ? "preleads" : "leads"}</span>
        <button class="btn btn-ghost sm" data-act="lead-page" data-p="next" ${leadView.page >= pages ? "disabled" : ""}>Siguiente →</button>
      </div>`;
  }

  /* ============ ETIQUETAS — selector y gestor ============ */
  let tagPick = null; // { ids:[], mode:'set'|'add' }
  function openTagPicker(ids, mode) {
    ids = (ids || []).filter(Boolean);
    if (!ids.length) { toast("No hay registros seleccionados", "warn"); return; }
    tagPick = { ids, mode: mode || "set" };
    renderTagPicker();
  }
  function renderTagPicker() {
    const recs = leadColl().filter((l) => tagPick.ids.indexOf(l.id) >= 0);
    const single = recs.length === 1;
    const isOn = (name) => tagPick.mode === "set" && recs.length && recs.every((l) => recordTagList(l).some((t) => t.toLowerCase() === name.toLowerCase()));
    const defs = sortedTagDefs();
    const body = `<div class="tag-pick">
        ${defs.length ? `<div class="tag-pick-list" id="tagPickList">
          ${defs.map((d) => `<label class="tag-pick-row"><input type="checkbox" value="${esc(d.name)}" ${isOn(d.name) ? "checked" : ""}><span class="tag-chip" style="--tagc:${d.color}">${esc(d.name)}</span></label>`).join("")}
        </div>` : `<p class="muted sm">Aún no hay etiquetas. Crea la primera abajo.</p>`}
        <div class="tag-create">
          <input id="newTagPick" class="field-inline" placeholder="Nueva etiqueta…" maxlength="32">
          <input id="newTagPickColor" type="color" value="${TAG_COLORS[state.tagDefs.length % TAG_COLORS.length]}" title="Color">
          <button class="btn btn-ghost sm" data-act="tag-create-pick">${ico.plus} Crear</button>
        </div>
      </div>`;
    openModal(`<div class="modal-h">${ico.tag}<div><h3>${tagPick.mode === "add" ? "Agregar etiquetas" : "Etiquetas del negocio"}</h3>
        <span class="muted">${tagPick.mode === "add" ? recs.length + " seleccionados — se añaden las marcadas" : (single ? esc(recs[0].company || recs[0].name || "Sin nombre") : recs.length + " registros")}</span></div>
        <button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b">${body}</div>
      <div class="modal-f"><button class="btn btn-ghost" data-act="close-modal">Cancelar</button>
        <span class="f-right"><button class="btn btn-primary" data-act="tag-apply">Aplicar</button></span></div>`, "md");
  }
  function tagCreateFromPicker() {
    const inp = $("#newTagPick"); const name = inp ? inp.value.trim() : "";
    if (!name) { toast("Escribe el nombre de la etiqueta", "warn"); return; }
    if (tagDefByName(name)) { toast("Esa etiqueta ya existe", "warn"); return; }
    addTagDef(name, ($("#newTagPickColor") || {}).value); scheduleSave();
    renderTagPicker();
    const cb = $$("#tagPickList input").find((c) => c.value.toLowerCase() === name.toLowerCase());
    if (cb) cb.checked = true;
  }
  function applyTagPicker() {
    if (!tagPick) { closeModal(); return; }
    const checked = $$("#tagPickList input[type=checkbox]").filter((c) => c.checked).map((c) => c.value);
    let n = 0;
    leadColl().forEach((l) => {
      if (tagPick.ids.indexOf(l.id) < 0) return;
      setRecordTags(l, tagPick.mode === "add" ? recordTagList(l).concat(checked) : checked);
      pushHistory(l, "Etiquetas actualizadas"); n++;
    });
    scheduleSave(); tagPick = null; leadView.sel.clear(); closeModal(); render();
    toast(`Etiquetas aplicadas a ${n} ${n === 1 ? "registro" : "registros"}`, "ok");
  }

  function openTagManager() {
    const defs = sortedTagDefs();
    const usage = (name) => state.leads.concat(state.preleads).filter((l) => recordTagList(l).some((t) => t.toLowerCase() === name.toLowerCase())).length;
    const rows = defs.length ? defs.map((d) => `<div class="tagmgr-row" data-id="${d.id}">
        <input type="color" class="tagmgr-color" value="${d.color}" data-id="${d.id}" title="Color">
        <input class="tagmgr-name field-inline" value="${esc(d.name)}" data-id="${d.id}" maxlength="32">
        <span class="muted sm tagmgr-use">${usage(d.name)} uso(s)</span>
        <button class="icon-btn" data-act="tagdef-del" data-id="${d.id}" title="Eliminar etiqueta">${ico.trash}</button>
      </div>`).join("") : `<p class="muted sm">Aún no has creado etiquetas. Crea la primera abajo.</p>`;
    openModal(`<div class="modal-h">${ico.tag}<div><h3>Administrar etiquetas</h3><span class="muted">Crear, renombrar, color o eliminar</span></div>
        <button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b">
        <div class="tagmgr-list">${rows}</div>
        <div class="tag-create" style="margin-top:14px">
          <input id="tagmgrNew" class="field-inline" placeholder="Nueva etiqueta…" maxlength="32">
          <input id="tagmgrNewColor" type="color" value="${TAG_COLORS[state.tagDefs.length % TAG_COLORS.length]}">
          <button class="btn btn-ghost sm" data-act="tagdef-add">${ico.plus} Crear</button>
        </div>
      </div>
      <div class="modal-f"><span class="muted sm">Renombrar afecta a todos los negocios con esa etiqueta.</span>
        <span class="f-right"><button class="btn btn-primary" data-act="tagmgr-save">Guardar cambios</button></span></div>`, "md");
  }
  function tagMgrAdd() {
    const inp = $("#tagmgrNew"); const name = inp ? inp.value.trim() : "";
    if (!name) { toast("Escribe el nombre", "warn"); return; }
    if (tagDefByName(name)) { toast("Esa etiqueta ya existe", "warn"); return; }
    addTagDef(name, ($("#tagmgrNewColor") || {}).value); scheduleSave(); openTagManager();
  }
  function tagMgrDelete(id) {
    const d = state.tagDefs.find((x) => x.id === id); if (!d) return;
    if (!confirm(`¿Eliminar la etiqueta "${d.name}"? Se quitará de todos los negocios que la tengan.`)) return;
    state.tagDefs = state.tagDefs.filter((x) => x.id !== id);
    state.leads.concat(state.preleads).forEach((l) => { const list = recordTagList(l); const nl = list.filter((t) => t.toLowerCase() !== d.name.toLowerCase()); if (nl.length !== list.length) setRecordTags(l, nl); });
    if ((leadView.tag || "").toLowerCase() === d.name.toLowerCase()) leadView.tag = "";
    scheduleSave(); openTagManager(); refreshLeads();
  }
  function tagMgrSave() {
    $$(".tagmgr-row").forEach((row) => {
      const d = state.tagDefs.find((x) => x.id === row.dataset.id); if (!d) return;
      const nameInp = row.querySelector(".tagmgr-name"); const colorInp = row.querySelector(".tagmgr-color");
      if (colorInp && colorInp.value) d.color = colorInp.value;
      const newName = (nameInp ? nameInp.value : d.name).trim();
      if (!newName || newName.toLowerCase() === d.name.toLowerCase()) { if (newName) d.name = newName; return; }
      const clash = state.tagDefs.find((x) => x.id !== d.id && (x.name || "").toLowerCase() === newName.toLowerCase());
      if (clash) { toast(`"${newName}" ya existe; se omitió ese renombrado`, "warn", 3000); return; }
      const old = d.name; d.name = newName;
      state.leads.concat(state.preleads).forEach((l) => { const list = recordTagList(l); let ch = false; const nl = list.map((t) => { if (t.toLowerCase() === old.toLowerCase()) { ch = true; return newName; } return t; }); if (ch) setRecordTags(l, nl); });
      if ((leadView.tag || "").toLowerCase() === old.toLowerCase()) leadView.tag = newName;
    });
    scheduleSave(); closeModal(); render(); toast("Etiquetas actualizadas", "ok");
  }

  /* ============ IMPORTADOR ============ */
  function importOpen() { imp = { step: 1, fileName: "", headers: [], rows: [], map: [], processed: [], page: 1, defaults: { country: "", city: "", informationSource: "" } }; render(); }
  function importCancel() { imp = null; render(); }
  function importReadFile(file) {
    if (!file) return;
    if (typeof XLSX === "undefined") { toast("Librería de lectura no disponible", "err"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
        if (!aoa.length) { toast("El archivo está vacío", "warn"); return; }
        imp.headers = (aoa[0] || []).map((h) => String(h).trim());
        imp.rows = aoa.slice(1).filter((r) => r.some((c) => String(c).trim() !== ""));
        imp.map = imp.headers.map((h) => autoDetectField(h));
        imp.fileName = file.name;
        imp.step = 2;
        render();
        toast(imp.rows.length + " filas leídas", "ok");
      } catch (e) { toast("No se pudo leer el archivo: " + e.message, "err", 5000); }
    };
    reader.onerror = () => toast("Error al leer el archivo", "err");
    reader.readAsArrayBuffer(file);
  }
  function importProcess() {
    const map = imp.map;
    const idx = {}; FIELD_KEYS.forEach((f) => { const i = map.indexOf(f); if (i >= 0) idx[f] = i; });
    const dbPhones = {}; leadColl().forEach((l) => { const k = dupKeyOf(l); if (k) dbPhones[k] = l; });
    const seenInFile = {};
    imp.processed = imp.rows.map((r, ri) => {
      const o = { _row: ri };
      FIELD_KEYS.forEach((f) => { if (idx[f] != null) o[f] = String(r[idx[f]] == null ? "" : r[idx[f]]).trim(); });
      o.country = o.country || imp.defaults.country || "";
      o.city = o.city || imp.defaults.city || "";
      o.informationSource = imp.defaults.informationSource || "";
      const sp = splitPhone(o.phone || "");
      o.countryCode = sp.cc; o.phoneNum = sp.num; o.phone = (sp.cc ? sp.cc + " " : "") + sp.num;
      const key = normPhone(o.phone);
      o.key = key;
      o.complete = !!(key && o.name);
      const match = key ? dbPhones[key] : null;
      o.dupDb = match ? match.id : null;
      o.dupDbDiscarded = !!(match && match.status === "Descartado"); // ya lo habías descartado antes
      o.dupFile = false;
      if (key) { if (seenInFile[key]) o.dupFile = true; else seenInFile[key] = true; }
      o.cleaned = !!sp.cc || (o.phone && idx.phone != null && /\D/.test((imp.rows[ri][idx.phone] || "") + ""));
      o.decision = o.dupDb ? "fusionar" : (o.dupFile ? "eliminar" : "mantener");
      return o;
    });
    imp.step = 3; imp.page = 1; render();
  }
  function importStats() {
    const p = imp.processed;
    const dup = p.filter((o) => o.dupDb || o.dupFile).length;
    const incompl = p.filter((o) => !o.complete).length;
    const touched = p.filter((o) => o.cleaned || o.dupDb || o.dupFile).length;
    const keep = p.filter((o) => o.decision === "mantener" || o.decision === "fusionar").length;
    return { total: p.length, dup, valid: p.length - incompl, incompl,
      cleanPct: Math.round((touched / (p.length || 1)) * 100), willImport: keep };
  }
  function importCommit() {
    let added = 0, merged = 0;
    const coll = leadColl();
    imp.processed.forEach((o) => {
      if (o.decision === "eliminar" || o.decision === "ignorar") return;
      if (o.decision === "fusionar" && o.dupDb) {
        const l = coll.find((x) => x.id === o.dupDb); if (!l) return;
        ["name", "company", "website", "email", "address", "hoursOpen", "hoursClose", "category", "location", "country", "city", "industry", "countryCode"].forEach((f) => { if (o[f] && !l[f]) l[f] = o[f]; });
        if (o.informationSource && !l.informationSource) l.informationSource = rememberInformationSource(o.informationSource);
        if (o.phone && !normPhone(l.phone)) l.phone = o.phone;
        if (o.rating && l.rating == null) l.rating = o.rating;
        if (o.reviews && l.reviews == null) l.reviews = o.reviews;
        l.updatedAt = todayStr(); pushHistory(l, "Fusionado desde importación");
        merged++;
      } else {
        const l = { id: uid(), name: o.name || o.company || "", company: o.name || "", phone: o.phone || "", countryCode: o.countryCode || "", country: o.country || "", city: o.city || "", informationSource: rememberInformationSource(o.informationSource),
          website: o.website || "", email: o.email || "", address: o.address || "", hoursOpen: o.hoursOpen || "", hoursClose: o.hoursClose || "",
          rating: o.rating || "", reviews: o.reviews || "", category: o.category || "", location: o.location || "", industry: o.industry || "",
          status: "Nuevo", tags: "", history: [{ at: todayStr(), change: "Importado de " + (imp.fileName || "archivo") }], createdAt: todayStr(), updatedAt: todayStr() };
        if (leadView.target === "preleads") l.importedFrom = imp.fileName || "archivo";
        coll.push(l); added++;
      }
    });
    scheduleSave();
    imp = null; leadView.page = 1; render();
    toast(`Importación completa: ${added} nuevos, ${merged} fusionados`, "ok", 4500);
  }
  function pushHistory(l, change) { if (!Array.isArray(l.history)) l.history = []; l.history.unshift({ at: todayStr(), change }); if (l.history.length > 25) l.history.length = 25; }

  function importCountryOptions() {
    const used = state.leads.concat(state.preleads).map((l) => l.country).filter(Boolean);
    return Array.from(new Set(geoCountryNames().concat(used))).sort((a, b) => a.localeCompare(b, "es"));
  }
  function importCityOptions() {
    const used = state.leads.concat(state.preleads).map((l) => l.city).filter(Boolean);
    return Array.from(new Set(geoCountryNames().flatMap(geoCitiesFor).concat(used))).sort((a, b) => a.localeCompare(b, "es"));
  }
  function importDefaultsHTML() {
    const d = imp.defaults || (imp.defaults = { country: "", city: "", informationSource: "" });
    return `<div class="card" style="margin-bottom:14px"><p class="muted sm" style="margin:0 0 10px">Valores manuales para esta importación. Si el archivo trae País o Ciudad, esos datos se usarán por fila. La Fuente de información siempre se escribe aquí y no se importa desde el archivo.</p>
      <div class="form-grid">
        <label class="field"><span>País</span><input id="impCountry" list="impCountryOptions" value="${esc(d.country)}" placeholder="Escribe o elige un país"><datalist id="impCountryOptions">${importCountryOptions().map((x) => `<option value="${esc(x)}"></option>`).join("")}</datalist></label>
        <label class="field"><span>Ciudad</span><input id="impCity" list="impCityOptions" value="${esc(d.city)}" placeholder="Escribe o elige una ciudad"><datalist id="impCityOptions">${importCityOptions().map((x) => `<option value="${esc(x)}"></option>`).join("")}</datalist></label>
        <label class="field"><span>Fuente de información</span><input id="impInformationSource" list="impSourceOptions" value="${esc(d.informationSource)}" placeholder="Ej. Referido, LinkedIn, Google Maps"><datalist id="impSourceOptions">${sortedInformationSources().map((x) => `<option value="${esc(x)}"></option>`).join("")}</datalist></label>
      </div></div>`;
  }

  function importWizardHTML() {
    const head = `<div class="imp-head"><div><h2>Importar ${leadView.target === "preleads" ? "preleads" : "leads"}</h2><span class="muted sm">${imp.fileName ? esc(imp.fileName) + " · " : ""}Paso ${imp.step} de 3</span></div>
      <button class="btn btn-ghost sm" data-act="imp-cancel">${ico.x} Cancelar</button></div>`;
    if (imp.step === 1) return `${head}
      <div class="imp-drop">
        <div class="imp-drop-ico">${ico.download}</div>
        <h3>Sube tu archivo</h3>
        <p class="muted">Formatos: CSV, XLSX, o exportaciones de Excel / Google Sheets. Soporta miles de registros.</p>
        <button class="btn btn-primary" data-act="imp-pick">Seleccionar archivo</button>
        <input type="file" id="leadImportFile" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none">
      </div>`;
    if (imp.step === 2) {
      const sample = imp.rows.slice(0, 3);
      return `${head}
      ${importDefaultsHTML()}
      <div class="card" style="margin-bottom:14px"><p class="muted sm" style="margin:0">Detectamos las columnas automáticamente. Revisa y elige a qué campo corresponde cada una; marca <b>Descartar</b> las que no sirvan para prospección. (${imp.rows.length} filas, ${imp.headers.length} columnas)</p></div>
      <div class="lead-table-wrap"><table class="lead-table map-table"><thead><tr><th>Columna del archivo</th><th>Ejemplo</th><th>Asignar a</th></tr></thead><tbody>
        ${imp.headers.map((h, i) => `<tr>
          <td><b>${esc(h || "(sin título)")}</b></td>
          <td class="muted sm">${esc(sample.map((r) => r[i]).filter((v) => String(v).trim() !== "")[0] || "—").slice(0, 40)}</td>
          <td><select class="mini-select" data-act="imp-map" data-i="${i}">
            <option value="">— Descartar —</option>
            ${FIELD_KEYS.map((f) => `<option value="${f}" ${imp.map[i] === f ? "selected" : ""}>${FIELD_LABEL[f]}</option>`).join("")}
          </select></td></tr>`).join("")}
      </tbody></table></div>
      <div class="imp-foot">
        <span class="muted sm">${imp.map.filter((m) => m).length} columnas asignadas</span>
        <button class="btn btn-primary" data-act="imp-process" ${imp.map.indexOf("phone") < 0 ? "disabled title='Asigna la columna de Teléfono'" : ""}>Procesar y revisar →</button>
      </div>
      ${imp.map.indexOf("phone") < 0 ? `<p class="muted sm" style="text-align:right;margin-top:6px;color:var(--warn)">Asigna al menos la columna de <b>Teléfono</b> para continuar.</p>` : ""}`;
    }
    // step 3: preview + dedupe
    const s = importStats();
    const pages = Math.max(1, Math.ceil(imp.processed.length / 50));
    if (imp.page > pages) imp.page = pages;
    const rows = imp.processed.slice((imp.page - 1) * 50, imp.page * 50);
    const decSel = (o) => `<select class="mini-select" data-act="imp-dec" data-r="${o._row}">
      ${[["mantener", "Mantener"], ["fusionar", "Fusionar"], ["ignorar", "Ignorar"], ["eliminar", "Eliminar"]].map(([v, l]) => `<option value="${v}" ${o.decision === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    return `${head}
      <div class="lead-stats imp-stats">
        ${leadStat("Total", s.total, "")}${leadStat("Válidos", s.valid, "good")}${leadStat("Incompletos", s.incompl, s.incompl ? "warn" : "")}${leadStat("Duplicados", s.dup, s.dup ? "bad" : "")}${leadStat("Limpieza", s.cleanPct + "%", "good")}${leadStat("A importar", s.willImport, "good")}
      </div>
      <div class="imp-actions">
        <button class="btn btn-ghost sm" data-act="imp-deldups">${ico.trash} Eliminar todos los duplicados</button>
        <span style="flex:1"></span>
        <button class="btn btn-ghost sm" data-act="imp-back">← Volver al mapeo</button>
        <button class="btn btn-primary sm" data-act="imp-commit">Importar ${s.willImport} leads ✓</button>
      </div>
      <div class="lead-table-wrap"><table class="lead-table adv"><thead><tr>
            <th>Negocio</th><th>Cód.</th><th>Teléfono</th><th>País</th><th>Ciudad</th><th>Fuente</th><th>Categoría</th><th>Ubicación</th><th>★</th><th>Estado fila</th><th>Acción</th>
      </tr></thead><tbody>
      ${rows.map((o) => `<tr class="${o.dupDb || o.dupFile ? "row-dup" : ""} ${!o.complete ? "row-incompl" : ""}">
        <td><b>${esc(o.name || "—")}</b></td>
        <td class="cc">${esc(o.countryCode || "")}</td>
        <td class="ph">${esc(o.phoneNum || "—")}</td>
            <td>${esc(o.country || "—")}</td>
            <td>${esc(o.city || "—")}</td>
            <td>${esc(o.informationSource || "—")}</td>
        <td>${esc(o.category || "—")}</td>
        <td>${esc(o.location || "—")}</td>
        <td>${o.rating ? esc(o.rating) : "—"}</td>
        <td>${o.dupDbDiscarded ? `<span class="dup-flag" title="Ya lo habías descartado antes — no llamar de nuevo">⛔ ya descartado</span>` : o.dupDb ? `<span class="dup-flag">dup base</span>` : o.dupFile ? `<span class="dup-flag">dup archivo</span>` : !o.complete ? `<span class="incompl-flag">incompleto</span>` : `<span class="ok-flag">ok</span>`}</td>
        <td>${decSel(o)}</td>
      </tr>`).join("")}
      </tbody></table></div>
      <div class="pager">
        <button class="btn btn-ghost sm" data-act="imp-page" data-p="prev" ${imp.page <= 1 ? "disabled" : ""}>← Anterior</button>
        <span class="muted sm">Página ${imp.page} de ${pages}</span>
        <button class="btn btn-ghost sm" data-act="imp-page" data-p="next" ${imp.page >= pages ? "disabled" : ""}>Siguiente →</button>
      </div>`;
  }

  function setLeadStatus(id, status) { const l = leadColl().find((x) => x.id === id); if (!l || l.status === status) return; l.status = status; l.updatedAt = todayStr(); pushHistory(l, "Estado → " + status); scheduleSave(); refreshLeads(); }
  function bulkSetStatus(status) { let n = 0; leadColl().forEach((l) => { if (leadView.sel.has(l.id)) { l.status = status; l.updatedAt = todayStr(); pushHistory(l, "Estado → " + status); n++; } }); scheduleSave(); refreshLeads(); toast(`${n} registros → ${status}`, "ok"); }
  function dedupeAll() {
    const coll = leadColl();
    const groups = {};
    coll.forEach((l) => { const k = dupKeyOf(l); if (!k) return; (groups[k] || (groups[k] = [])).push(l); });
    let removed = 0; const keepIds = new Set();
    Object.values(groups).forEach((g) => {
      if (g.length < 2) return;
      g.sort((a, b) => { const sa = (leadComplete(a) ? 1 : 0), sb = (leadComplete(b) ? 1 : 0); if (sa !== sb) return sb - sa; return (b.updatedAt || "").localeCompare(a.updatedAt || ""); });
      const keep = g[0]; keepIds.add(keep.id);
      g.slice(1).forEach((dupL) => { ["website", "email", "address", "hoursOpen", "hoursClose", "category", "location", "industry", "countryCode"].forEach((f) => { if (dupL[f] && !keep[f]) keep[f] = dupL[f]; }); removed++; });
    });
    if (!removed) { toast("No se encontraron duplicados por teléfono", "ok"); return; }
    if (!confirm(`Se encontraron ${removed} registros duplicados (mismo teléfono). Se conservará el más completo de cada grupo y se fusionarán los datos. ¿Continuar?`)) return;
    const dupPhones = Object.keys(groups).filter((k) => groups[k].length > 1);
    const filtered = coll.filter((l) => { const k = dupKeyOf(l); if (k && dupPhones.indexOf(k) >= 0 && !keepIds.has(l.id)) return false; return true; });
    state[leadView.target] = filtered;
    scheduleSave(); leadView.sel.clear(); render(); toast(`${removed} duplicados eliminados`, "ok", 3500);
  }
  function leadExport() {
    const list = leadsFiltered();
    const name = leadView.target === "preleads" ? "preleads" : "leads";
    if (!list.length) { toast("No hay registros para exportar", "warn"); return; }
    const cols = [["Negocio", "company", "name"], ["CodigoPais", "countryCode"], ["Telefono", "phone"], ["Sitio", "website"], ["Correo", "email"], ["Direccion", "address"], ["Pais", "country"], ["Ciudad", "city"], ["Apertura", "hoursOpen"], ["Cierre", "hoursClose"], ["Calificacion", "rating"], ["Reseñas", "reviews"], ["Categoria", "category"], ["Ubicacion", "location"], ["FuenteInformacion", "informationSource"], ["Estado", "status"], ["Etiquetas", "tags"]];
    const rows = list.map((l) => cols.map((c) => { let v = l[c[1]]; if ((v == null || v === "") && c[2]) v = l[c[2]]; if (c[0] === "Telefono") v = splitPhone(l.phone || "").num || l.phone || ""; return v == null ? "" : v; }));
    if (typeof XLSX !== "undefined") {
      const wb = XLSX.utils.book_new();
      const aoa = [cols.map((c) => c[0]), ...rows];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name === "preleads" ? "Preleads" : "Leads");
      XLSX.writeFile(wb, name + ".xlsx"); toast((name === "preleads" ? "Preleads" : "Leads") + " exportados (XLSX)", "ok");
    } else {
      const csv = [cols.map((c) => c[0]), ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      download(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), name + ".csv"); toast((name === "preleads" ? "Preleads" : "Leads") + " exportados (CSV)", "ok");
    }
  }
