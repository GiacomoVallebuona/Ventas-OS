"use strict";
/* Ventas OS — módulo: formulario de llamada y scoring
   Generado al separar ventas-os.html. Ámbito global compartido entre <script> clásicos. */

  /* ---- Formulario de llamada ---- */
  function callForm(call, date, preleadId) {
    const c = call || { date: date || todayStr(), time: new Date().toTimeString().slice(0, 5), score: {}, objections: [] };
    const sc = c.score || {};
    const field = (id, label, val, type, ph) => `<label class="field"><span>${label}</span><input id="${id}" type="${type || "text"}" value="${esc(val)}" placeholder="${ph || ""}"></label>`;
    openModal(`
      <div class="modal-h"><h2>${call ? "Editar llamada" : "Registrar llamada"}</h2><button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b">
        ${!call ? `<h3 class="form-sec">Prelead</h3>
        <div class="form-grid">
          <label class="field span2"><span>Elegir de preleads (opcional)</span>
            <select id="f_prelead">
              <option value="">— Contacto nuevo / manual —</option>
              ${state.preleads.slice().sort((a, b) => (a.company || a.name || "").localeCompare(b.company || b.name || "")).map((p) => `<option value="${p.id}" ${preleadId === p.id ? "selected" : ""}>${esc(p.company || p.name || "Sin nombre")}${p.category ? " · " + esc(p.category) : ""}${p.location ? " · " + esc(p.location) : ""}</option>`).join("")}
            </select>
          </label>
        </div>` : ""}
        <h3 class="form-sec">Datos del prospecto</h3>
        <div class="form-grid">
          <label class="field span2"><span>Teléfono ${call ? "" : "(buscaremos si ya existe)"}</span><input id="f_phone" type="tel" value="${esc(c.phone)}" placeholder="Ej. +51 999 888 777"></label>
        </div>
        <div id="leadMatch" class="lead-match"></div>
        <div class="form-grid">
          ${field("f_name", "Nombre", c.name)}
          ${field("f_company", "Empresa", c.company)}
          ${field("f_title", "Cargo", c.title)}
          ${field("f_whatsapp", "WhatsApp", c.whatsapp, "tel")}
          ${field("f_email", "Correo", c.email, "email")}
          ${field("f_website", "Página web", c.website)}
          ${field("f_industry", "Industria", c.industry)}
          ${field("f_size", "Tamaño de empresa", c.size)}
          ${field("f_location", "Ubicación", c.location)}
        </div>
        <h3 class="form-sec">Estado e información de la llamada</h3>
        <div class="form-grid">
          <label class="field"><span>Estado comercial</span><select id="f_status">${CALL_STATUS.map((s) => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          <label class="field"><span>Resultado</span><select id="f_result">${["", ...CALL_RESULTS].map((s) => `<option ${c.result === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          ${field("f_date", "Fecha", c.date, "date")}
          ${field("f_time", "Hora", c.time, "time")}
          ${field("f_duration", "Duración (min)", c.duration, "number")}
        </div>
        <h3 class="form-sec">Scoring de la llamada <span class="score-live" id="scoreLive">0/100</span></h3>
        <div class="score-grid">
          ${SCORE_KEYS.map((s) => `<label class="score-field"><div class="score-top"><span>${s.label}</span><b id="sv_${s.k}">${sc[s.k] != null ? sc[s.k] : 0}</b></div>
            <input type="range" class="score-range" data-sk="${s.k}" min="0" max="100" step="5" value="${sc[s.k] != null ? sc[s.k] : 0}"></label>`).join("")}
        </div>
        <h3 class="form-sec">Objeciones encontradas</h3>
        <div id="objChecklist" class="obj-check-grid">
          ${state.objectionDefs.map((d) => objCheckHTML(d, (c.objections || []).includes(d.id))).join("")}
        </div>
        <div class="sync-code-row" style="margin-top:12px;max-width:480px">
          <input id="newObjInline" placeholder="+ Crear nueva objeción reutilizable...">
          <button class="btn btn-ghost" data-act="add-obj-inline">${ico.plus} Crear</button>
        </div>
        <label class="field" style="margin-top:14px"><span>Notas</span><textarea id="f_notes" rows="4" placeholder="Observaciones libres...">${esc(c.notes)}</textarea></label>
      </div>
      <div class="modal-f">
        ${call ? `<button class="btn btn-danger ghost" data-act="del-call" data-id="${call.id}">Eliminar</button>` : "<span></span>"}
        <div class="f-right"><button class="btn btn-ghost" data-act="close-modal">Cancelar</button>
        <button class="btn btn-primary" data-act="save-call" data-id="${call ? call.id : ""}" data-prelead="${preleadId || ""}">Guardar llamada</button></div>
      </div>
    `, "lg");
    // live scoring
    const live = $("#scoreLive");
    const recalc = () => { let t = 0; $$(".score-range").forEach((r) => (t += num(r.value))); live.textContent = Math.round(t / SCORE_KEYS.length) + "/100"; };
    $$(".score-range").forEach((r) => r.addEventListener("input", () => { $("#sv_" + r.dataset.sk).textContent = r.value; recalc(); }));
    recalc();
    renderLeadMatch(c.phone, !!call);
    if (preleadId && !call) { const sel = $("#f_prelead"); if (sel) sel.value = preleadId; applyPreleadToForm(preleadId); }
  }
  function applyPreleadToForm(preleadId) {
    const p = state.preleads.find((x) => x.id === preleadId);
    const set = (id, v) => { const el = $(id); if (el) el.value = v || ""; };
    if (!p) return;
    set("#f_phone", p.phone || "");
    set("#f_name", p.name || ""); set("#f_company", p.company || p.name || ""); set("#f_website", p.website || "");
    set("#f_whatsapp", p.whatsapp || ""); set("#f_email", p.email || ""); set("#f_industry", p.industry || p.category || "");
    set("#f_location", p.location || "");
    renderLeadMatch(p.phone, false);
    toast("Datos del prelead cargados", "ok", 1800);
  }
  function objCheckHTML(d, checked) {
    return `<label class="obj-check"><input type="checkbox" class="obj-cb" value="${d.id}" ${checked ? "checked" : ""}><span>${esc(d.text)}</span></label>`;
  }
  function renderLeadMatch(phone, editing) {
    const box = $("#leadMatch"); if (!box) return;
    const lead = leadByPhone(phone);
    if (!normPhone(phone)) { box.innerHTML = ""; box.className = "lead-match"; return; }
    if (lead) {
      box.className = "lead-match exists";
      box.innerHTML = `<div class="lm-head">${ico.users}<b>Este lead ya existe en la base de datos.</b></div>
        <div class="lm-body"><span><b>${esc(lead.company || lead.name || "Lead")}</b> ${lead.name && lead.company ? "· " + esc(lead.name) : ""}</span>
        ${lead.status ? `<span class="badge" style="--bg:${statusColor(lead.status)}">${esc(lead.status)}</span>` : ""}
        ${lead.email ? `<span class="muted sm">${esc(lead.email)}</span>` : ""}
        ${meetingsForLead(lead.id).length ? `<span class="chip dim">${meetingsForLead(lead.id).length} reuniones</span>` : ""}</div>
        ${editing ? "" : `<button class="btn btn-ghost sm" data-act="link-lead" data-id="${lead.id}">Autocompletar con sus datos</button>`}`;
    } else {
      box.className = "lead-match new";
      box.innerHTML = `<div class="lm-head">${ico.spark}<b>Contacto nuevo.</b> <span class="muted">Se creará un lead al guardar.</span></div>`;
    }
  }
  function readCallForm(id, preleadId) {
    const get = (s) => { const el = $(s); return el ? el.value.trim() : ""; };
    const score = {}; let total = 0;
    $$(".score-range").forEach((r) => { score[r.dataset.sk] = num(r.value); total += num(r.value); });
    const scoreTotal = Math.round(total / SCORE_KEYS.length);
    const objections = $$(".obj-cb").filter((cb) => cb.checked).map((cb) => cb.value);
    const data = {
      name: get("#f_name"), company: get("#f_company"), title: get("#f_title"), phone: get("#f_phone"),
      whatsapp: get("#f_whatsapp"), email: get("#f_email"), website: get("#f_website"), industry: get("#f_industry"),
      size: get("#f_size"), location: get("#f_location"), status: get("#f_status"), result: get("#f_result"),
      date: get("#f_date") || todayStr(), time: get("#f_time"), duration: get("#f_duration"),
      notes: get("#f_notes"), score: scoreTotal ? score : null, scoreTotal: scoreTotal || null, objections,
    };
    let call;
    if (id) { call = state.calls.find((x) => x.id === id); Object.assign(call, data); }
    else { call = Object.assign({ id: uid() }, data); state.calls.push(call); }
    const pSel = $("#f_prelead"); const pid = preleadId || (pSel && pSel.value) || null;
    const lead = upsertLeadFromCall(call, pid);   // crea/vincula el lead por teléfono y promueve el prelead si aplica
    if (lead) call.leadId = lead.id;
    scheduleSave();
  }

  /* ---- Formulario de prospecto ---- */
  function dealForm(deal) {
    const d = deal || { stage: "lead" };
    const field = (id, label, val, type) => `<label class="field"><span>${label}</span><input id="${id}" type="${type || "text"}" value="${esc(val)}"></label>`;
    openModal(`
      <div class="modal-h"><h2>${deal ? "Editar prospecto" : "Nuevo prospecto"}</h2><button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b"><div class="form-grid">
        ${field("d_company", "Empresa", d.company)}
        ${field("d_name", "Contacto", d.name)}
        ${field("d_title", "Cargo", d.title)}
        ${field("d_phone", "Teléfono", d.phone, "tel")}
        ${field("d_email", "Correo", d.email, "email")}
        ${field("d_industry", "Industria", d.industry)}
        ${field("d_size", "Tamaño", d.size)}
        ${field("d_location", "Ubicación", d.location)}
        <label class="field span2"><span>Etapa</span><select id="d_stage">${STAGES.map((s) => `<option value="${s.id}" ${d.stage === s.id ? "selected" : ""}>${s.label}</option>`).join("")}</select></label>
      </div></div>
      <div class="modal-f">${deal ? `<button class="btn btn-danger ghost" data-act="del-deal" data-id="${deal.id}">Eliminar</button>` : "<span></span>"}
        <div class="f-right"><button class="btn btn-ghost" data-act="close-modal">Cancelar</button>
        <button class="btn btn-primary" data-act="save-deal" data-id="${deal ? deal.id : ""}">Guardar</button></div></div>
    `, "md");
  }
  function readDealForm(id) {
    const get = (s) => { const el = $(s); return el ? el.value.trim() : ""; };
    const data = { company: get("#d_company"), name: get("#d_name"), title: get("#d_title"), phone: get("#d_phone"), email: get("#d_email"), industry: get("#d_industry"), size: get("#d_size"), location: get("#d_location"), stage: get("#d_stage") };
    if (id) { const d = state.deals.find((x) => x.id === id); Object.assign(d, data); }
    else state.deals.push(Object.assign({ id: uid(), createdAt: todayStr() }, data));
    scheduleSave();
  }

  /* ---- Formulario de lead ---- */
  function leadForm(lead) {
    const l = lead || { status: "Nuevo" };
    const field = (id, label, val, type) => `<label class="field"><span>${label}</span><input id="${id}" type="${type || "text"}" value="${esc(val)}"></label>`;
    const statusList = LEAD_STATES.concat(l.status && LEAD_STATES.indexOf(l.status) < 0 ? [l.status] : []);
    openModal(`
      <div class="modal-h"><h2>${lead ? "Editar lead" : "Nuevo lead"}</h2><button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b">
        <div class="form-grid">
          <label class="field"><span>Código de país</span><input id="l_cc" type="text" value="${esc(l.countryCode)}" placeholder="+51"></label>
          <label class="field"><span>Teléfono (identificador único)</span><input id="l_phone" type="tel" value="${esc(l.phone ? splitPhone(l.phone).num || l.phone : "")}" placeholder="987654321"></label>
        </div>
        <div id="leadFormMatch" class="lead-match"></div>
        <div class="form-grid">
          ${field("l_name", "Nombre del negocio", l.company || l.name)}
          ${field("l_email", "Correo", l.email, "email")}
          ${field("l_website", "Sitio web", l.website)}
          ${field("l_whatsapp", "WhatsApp", l.whatsapp, "tel")}
          ${field("l_address", "Dirección", l.address)}
          <label class="field"><span>País</span><select id="l_country">${countryOptionsHTML(l.country)}</select></label>
          <label class="field"><span>Ciudad</span><select id="l_city">${cityOptionsHTML(l.country, l.city)}</select></label>
          ${field("l_location", "Ubicación", l.location)}
          ${field("l_category", "Categoría", l.category)}
          ${field("l_industry", "Industria", l.industry)}
          ${field("l_hopen", "Hora apertura", l.hoursOpen)}
          ${field("l_hclose", "Hora cierre", l.hoursClose)}
          ${field("l_rating", "Calificación (★)", l.rating, "number")}
          ${field("l_reviews", "N° de reseñas", l.reviews, "number")}
          ${field("l_tags", "Etiquetas (separadas por coma)", l.tags)}
          <label class="field"><span>Fuente de información</span><input id="l_informationSource" list="leadSourceOptions" value="${esc(l.informationSource)}" placeholder="Ej. Referido, LinkedIn, Google Maps"><datalist id="leadSourceOptions">${sortedSourceDefs().map((d) => `<option value="${esc(d.name)}"></option>`).join("")}</datalist></label>
          <label class="field"><span>Estado</span><select id="l_status">${statusList.map((s) => `<option ${l.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        </div>
      </div>
      <div class="modal-f">${lead ? `<button class="btn btn-danger ghost" data-act="del-lead" data-id="${lead.id}">Eliminar</button>` : "<span></span>"}
        <div class="f-right"><button class="btn btn-ghost" data-act="close-modal">Cancelar</button>
        <button class="btn btn-primary" data-act="save-lead" data-id="${lead ? lead.id : ""}">Guardar lead</button></div></div>
    `, "lg");
  }
  function renderLeadFormMatch(phone) {
    const box = $("#leadFormMatch"); if (!box) return;
    const cc = $("#l_cc"); const full = (cc && cc.value ? cc.value : "") + phone;
    const lead = leadByPhone(full) || leadByPhone(phone);
    if (!normPhone(phone) || !lead) { box.innerHTML = ""; box.className = "lead-match"; return; }
    box.className = "lead-match exists";
    box.innerHTML = `<div class="lm-head">${ico.shield}<b>Este lead ya existe en la base de datos.</b></div>
      <div class="lm-body"><span><b>${esc(lead.company || lead.name || "Lead")}</b></span>${lead.status ? `<span class="badge" style="--bg:${leadStateColor(lead.status)}">${esc(lead.status)}</span>` : ""}<span class="muted sm">No se permiten dos leads con el mismo teléfono.</span></div>`;
  }
  function readLeadForm(id) {
    const get = (s) => { const el = $(s); return el ? el.value.trim() : ""; };
    const cc = get("#l_cc"); const num = get("#l_phone");
    const phone = (cc ? cc + " " : "") + num;
    const dup = leadByPhone(phone);
    if (num && dup && dup.id !== id) { toast("Ya existe un lead con ese teléfono. No se permiten duplicados.", "err", 5000); return false; }
    const data = { name: get("#l_name"), company: get("#l_name"), phone, countryCode: cc, whatsapp: get("#l_whatsapp"), email: get("#l_email"), website: get("#l_website"), address: get("#l_address"), country: get("#l_country"), city: get("#l_city"), location: get("#l_location"), category: get("#l_category"), industry: get("#l_industry"), hoursOpen: get("#l_hopen"), hoursClose: get("#l_hclose"), rating: get("#l_rating"), reviews: get("#l_reviews"), tags: get("#l_tags"), informationSource: rememberInformationSource(get("#l_informationSource")), status: get("#l_status"), updatedAt: todayStr() };
    if (id) { const l = state.leads.find((x) => x.id === id); Object.assign(l, data); pushHistory(l, "Editado manualmente"); }
    else { const l = Object.assign({ id: uid(), createdAt: todayStr(), history: [{ at: todayStr(), change: "Creado manualmente" }] }, data); state.leads.push(l); }
    scheduleSave();
    return true;
  }

  /* ---- Ficha de lead ---- */
  function openLead(id) {
    const l = state.leads.find((x) => x.id === id); if (!l) return;
    const mtgs = meetingsForLead(l.id).slice().sort((a, b) => b.date.localeCompare(a.date));
    const today = todayStr();
    const upcoming = mtgs.filter((m) => (m.status === "Programada" || m.status === "Reprogramada") && m.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const past = mtgs.filter((m) => !upcoming.includes(m));
    const calls = callsForLead(l).slice().sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")));
    const mRow = (m) => { const col = MEETING_STATUS_COLOR[m.status] || "#818cf8"; return `<div class="lead-mtg"><div class="meet-date sm"><b>${parseDate(m.date).getDate()}</b><span>${MONTHS[parseDate(m.date).getMonth()].slice(0, 3)}</span></div>
        <div class="lead-mtg-main"><strong>${esc(m.title)}</strong><span class="muted sm">${m.time ? esc(m.time) + " · " : ""}${esc(longDate(m.date))}</span></div>
        <span class="badge" style="--bg:${col}">${esc(m.status)}</span>
        <button class="icon-btn sm" data-act="edit-meeting" data-id="${m.id}">${ico.calendar}</button></div>`; };
    const info = (lbl, val) => val !== undefined && val !== null && val !== "" ? `<div class="lead-field"><span>${lbl}</span><b>${esc(val)}</b></div>` : "";
    const tags = (l.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    const hist = Array.isArray(l.history) ? l.history : [];
    openModal(`
      <div class="modal-h"><div style="display:flex;align-items:center;gap:12px">
        <span class="lead-avatar lg" style="--accent:${leadStateColor(l.status)}">${initials(l.company || l.name)}</span>
        <div><h2>${esc(l.company || l.name || "Lead")}</h2><span class="muted sm">${esc(l.category || l.website || "—")}</span></div>
      </div><button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
          <span class="badge" style="--bg:${leadStateColor(l.status)}">${esc(l.status || "Nuevo")}</span>
          ${l.rating ? `<span class="chip">★ ${esc(l.rating)}${l.reviews ? " · " + num(l.reviews) + " reseñas" : ""}</span>` : ""}
          <button class="btn btn-ghost sm" data-act="edit-lead" data-id="${l.id}">${ico.calendar} Editar datos</button>
          <button class="btn btn-primary sm" data-act="new-meeting-lead" data-id="${l.id}">${ico.plus} Agendar reunión</button>
          <button class="btn btn-ghost sm" data-act="call-lead" data-id="${l.id}">${ico.phone} Registrar llamada</button>
        </div>
        ${tags.length ? `<div class="tags-cell" style="margin-bottom:12px">${tags.map((t) => `<span class="tag-chip">${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="lead-fields">
          ${info("Teléfono", [l.countryCode, l.phone ? splitPhone(l.phone).num || l.phone : ""].filter(Boolean).join(" "))}
          ${info("WhatsApp", l.whatsapp)}${info("Correo", l.email)}${info("Sitio web", l.website)}
          ${info("Dirección", l.address)}${info("País", l.country)}${info("Ciudad", l.city)}${info("Ubicación", l.location)}${info("Categoría", l.category)}${info("Industria", l.industry)}${info("Fuente de información", l.informationSource)}
          ${info("Apertura", l.hoursOpen)}${info("Cierre", l.hoursClose)}${info("Creado", l.createdAt)}
        </div>
        <div class="day-section" style="margin-top:8px">
          <div class="day-sec-h"><h3>Próximas reuniones</h3><span class="count">${upcoming.length}</span></div>
          ${upcoming.length ? upcoming.map(mRow).join("") : emptyMini("Sin reuniones programadas.")}
        </div>
        <div class="day-section" style="margin-top:14px">
          <div class="day-sec-h"><h3>Historial de reuniones</h3><span class="count">${past.length}</span></div>
          ${past.length ? past.map(mRow).join("") : emptyMini("Aún no hay reuniones registradas.")}
        </div>
        <div class="day-section" style="margin-top:14px">
          <div class="day-sec-h"><h3>Llamadas</h3><span class="count">${calls.length}</span></div>
          ${calls.length ? calls.map(dayCallCard).join("") : emptyMini("Sin llamadas registradas.")}
        </div>
        ${hist.length ? `<div class="day-section" style="margin-top:14px">
          <div class="day-sec-h"><h3>Historial de cambios</h3><span class="count">${hist.length}</span></div>
          <div class="hist-list">${hist.slice(0, 15).map((h) => `<div class="hist-row"><span class="muted sm">${esc(h.at || "")}</span><span>${esc(h.change || "")}</span></div>`).join("")}</div>
        </div>` : ""}
      </div>
    `, "lg");
  }

  /* ---- Ficha de prelead ---- */
  function openPrelead(id) {
    const l = state.preleads.find((x) => x.id === id); if (!l) return;
    const info = (lbl, val) => val !== undefined && val !== null && val !== "" ? `<div class="lead-field"><span>${lbl}</span><b>${esc(val)}</b></div>` : "";
    const tags = (l.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    const hist = Array.isArray(l.history) ? l.history : [];
    openModal(`
      <div class="modal-h"><div style="display:flex;align-items:center;gap:12px">
        <span class="lead-avatar lg" style="--accent:${leadStateColor(l.status)}">${initials(l.company || l.name)}</span>
        <div><h2>${esc(l.company || l.name || "Prelead")}</h2><span class="muted sm">${esc(l.category || l.website || "—")} · <i>Sin llamadas aún</i></span></div>
      </div><button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
          ${l.status === "Descartado" ? `<span class="badge" style="--bg:${LEAD_STATE_COLOR["Descartado"]}">Descartado</span>` : ""}
          ${l.rating ? `<span class="chip">★ ${esc(l.rating)}${l.reviews ? " · " + num(l.reviews) + " reseñas" : ""}</span>` : ""}
          ${l.informationSource ? `<span class="chip dim">${ico.spark} ${esc(l.informationSource)}</span>` : ""}
          <button class="btn btn-ghost sm" data-act="edit-prelead" data-id="${l.id}">${ico.calendar} Editar datos</button>
          <button class="btn btn-primary sm" data-act="call-prelead" data-id="${l.id}">${ico.phone} Registrar llamada</button>
          ${l.status === "Descartado" ? `<button class="btn btn-ghost sm" data-act="restore-prelead" data-id="${l.id}">${ico.check} Restaurar</button>` : `<button class="btn btn-ghost sm" data-act="del-prelead" data-id="${l.id}">${ico.trash} Descartar</button>`}
        </div>
        ${tags.length ? `<div class="tags-cell" style="margin-bottom:12px">${tags.map((t) => `<span class="tag-chip">${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="lead-fields">
          ${info("Teléfono", [l.countryCode, l.phone ? splitPhone(l.phone).num || l.phone : ""].filter(Boolean).join(" "))}
          ${info("WhatsApp", l.whatsapp)}${info("Correo", l.email)}${info("Sitio web", l.website)}
          ${info("Dirección", l.address)}${info("País", l.country)}${info("Ciudad", l.city)}${info("Ubicación", l.location)}${info("Categoría", l.category)}${info("Industria", l.industry)}${info("Fuente de información", l.informationSource)}
          ${info("Apertura", l.hoursOpen)}${info("Cierre", l.hoursClose)}${info("Importado", l.createdAt)}
        </div>
        ${hist.length ? `<div class="day-section" style="margin-top:14px">
          <div class="day-sec-h"><h3>Historial</h3><span class="count">${hist.length}</span></div>
          <div class="hist-list">${hist.slice(0, 15).map((h) => `<div class="hist-row"><span class="muted sm">${esc(h.at || "")}</span><span>${esc(h.change || "")}</span></div>`).join("")}</div>
        </div>` : ""}
      </div>
    `, "lg");
  }
  function preleadForm(prelead) {
    const p = prelead || {};
    openModal(`
      <div class="modal-h"><h2>Editar prelead</h2><button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b"><div class="form-grid">
        <label class="field"><span>País</span><select id="p_country">${countryOptionsHTML(p.country)}</select></label>
        <label class="field"><span>Ciudad</span><select id="p_city">${cityOptionsHTML(p.country, p.city)}</select></label>
        <label class="field"><span>Fuente de información</span><input id="p_informationSource" list="preleadSourceOptions" value="${esc(p.informationSource)}" placeholder="Ej. Referido, LinkedIn, Google Maps"><datalist id="preleadSourceOptions">${sortedSourceDefs().map((d) => `<option value="${esc(d.name)}"></option>`).join("")}</datalist></label>
      </div></div>
      <div class="modal-f"><button class="btn btn-ghost" data-act="close-modal">Cancelar</button><span class="f-right"><button class="btn btn-primary" data-act="save-prelead" data-id="${p.id}">Guardar</button></span></div>
    `, "md");
  }
  function readPreleadForm(id) {
    const p = state.preleads.find((x) => x.id === id); if (!p) return false;
    const get = (s) => { const el = $(s); return el ? el.value.trim() : ""; };
    p.country = get("#p_country"); p.city = get("#p_city"); p.informationSource = rememberInformationSource(get("#p_informationSource"));
    p.updatedAt = todayStr(); pushHistory(p, "Datos de ubicación y fuente editados"); scheduleSave();
    return true;
  }
  function openCallFromPrelead(p) {
    closeModal();
    // Se abre como llamada NUEVA (call=null): así el botón "Guardar" queda con id vacío
    // y el prelead se precarga vía applyPreleadToForm, igual que al elegirlo del selector.
    callForm(null, todayStr(), p.id);
  }

  /* ---- Formulario de reunión ---- */
  function meetingForm(meeting, presetLeadId) {
    const m = meeting || { date: todayStr(), time: "", status: "Programada", leadId: presetLeadId || null };
    const leadOpts = `<option value="">— Sin lead —</option>` + state.leads.slice().sort((a, b) => (a.company || a.name || "").localeCompare(b.company || b.name || "")).map((l) => `<option value="${l.id}" ${m.leadId === l.id ? "selected" : ""}>${esc(l.company || l.name || l.phone || "Lead")}</option>`).join("");
    openModal(`
      <div class="modal-h"><h2>${meeting ? "Editar reunión" : "Nueva reunión"}</h2><button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b">
        <label class="field"><span>Título</span><input id="m_title" value="${esc(m.title)}" placeholder="Ej. Presentación de propuesta"></label>
        <div class="form-grid">
          <label class="field"><span>Fecha</span><input id="m_date" type="date" value="${esc(m.date)}"></label>
          <label class="field"><span>Hora</span><input id="m_time" type="time" value="${esc(m.time)}"></label>
          <label class="field"><span>Estado</span><select id="m_status">${MEETING_STATUS.map((s) => `<option ${m.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          <label class="field"><span>Lead asociado</span><select id="m_lead">${leadOpts}</select></label>
        </div>
        <label class="field"><span>Descripción</span><textarea id="m_desc" rows="4" placeholder="Agenda, objetivos, notas previas...">${esc(m.description)}</textarea></label>
      </div>
      <div class="modal-f">${meeting ? `<button class="btn btn-danger ghost" data-act="del-meeting" data-id="${meeting.id}">Eliminar</button>` : "<span></span>"}
        <div class="f-right"><button class="btn btn-ghost" data-act="close-modal">Cancelar</button>
        <button class="btn btn-primary" data-act="save-meeting" data-id="${meeting ? meeting.id : ""}">Guardar reunión</button></div></div>
    `, "md");
  }
  function readMeetingForm(id) {
    const get = (s) => { const el = $(s); return el ? el.value.trim() : ""; };
    const title = get("#m_title"); if (!title) { toast("Escribe el título de la reunión", "warn"); return false; }
    const data = { title, date: get("#m_date") || todayStr(), time: get("#m_time"), status: get("#m_status"), leadId: get("#m_lead") || null, description: get("#m_desc") };
    if (id) { const m = state.meetings.find((x) => x.id === id); Object.assign(m, data); }
    else state.meetings.push(Object.assign({ id: uid() }, data));
    scheduleSave();
    return true;
  }

  /* ---- Conocimiento ---- */
  function kbForm(item) {
    const k = item || { cat: KB_CATS[0] };
    openModal(`<div class="modal-h"><h2>${item ? "Editar entrada" : "Nueva entrada"}</h2><button class="icon-btn" data-act="close-modal">${ico.x}</button></div>
      <div class="modal-b"><div class="form-col">
        <div class="form-grid">
          <label class="field"><span>Título</span><input id="k_title" value="${esc(k.title)}" placeholder="Ej. Cierre por urgencia"></label>
          <label class="field"><span>Categoría</span><select id="k_cat">${KB_CATS.map((c) => `<option ${k.cat === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
        </div>
        <label class="field"><span>Contenido</span><textarea id="k_content" rows="6" placeholder="Script, técnica o caso...">${esc(k.content)}</textarea></label>
        <label class="field"><span>Etiquetas (separadas por coma)</span><input id="k_tags" value="${esc(k.tags)}" placeholder="precio, frío, b2b"></label>
      </div></div>
      <div class="modal-f">${item ? `<button class="btn btn-danger ghost" data-act="del-kb" data-id="${item.id}">Eliminar</button>` : "<span></span>"}
      <div class="f-right"><button class="btn btn-ghost" data-act="close-modal">Cancelar</button>
      <button class="btn btn-primary" data-act="save-kb" data-id="${item ? item.id : ""}">Guardar</button></div></div>`, "md");
  }

