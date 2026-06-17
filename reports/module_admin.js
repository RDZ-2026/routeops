/* ============================================================
   module_admin.js — Paramétrage catégories, natures,
                     suggestions, types par site
   ============================================================ */

let admTypesSelMission = null;
let admCatId    = null;
let admNatCatId = null;
let admNatId    = null;
let admSuggNatId = null;

function admTab(t) {
  ['types','cats','nats','suggs'].forEach(x => {
    document.getElementById('adm-'+x).style.display = x===t ? '' : 'none';
    document.getElementById('atab-'+x).className = 'admin-tab'+(x===t?' active':'');
  });
  if (t==='types') admRenderSiteTypes();
  if (t==='cats')  admRenderCats();
  if (t==='nats')  admRenderNatCats();
  if (t==='suggs') admRenderSuggCats();
}

/* ── TYPES PAR SITE ── */
function admRenderSiteTypes() {
  const ms = [...DB.missions].sort((a,b) => (a.titre||'').localeCompare(b.titre||'','fr'));
  document.getElementById('adm-types-missions').innerHTML = ms.map(m => {
    const cl = DB.clients.find(c => c.id===m.client_id);
    return `<div class="admin-item${admTypesSelMission===m.id?' active':''}" onclick="admSelMission('${m.id}')">
      <div class="admin-item-txt">
        <div class="admin-item-name">${esc(m.titre)}</div>
        <div class="admin-item-sub">${esc(cl?cl.raison_sociale:'')}</div>
      </div>
    </div>`;
  }).join('');
}

function admSelMission(id) {
  admTypesSelMission = id;
  admRenderSiteTypes();
  const cur = DB.siteTypes
    .filter(st => String(st.mission_id)===String(id) && st.actif)
    .map(st => st.report_type);
  const m = DB.missions.find(x => x.id===id) || {};
  document.getElementById('adm-types-site-title').textContent = m.titre || 'Types disponibles';
  document.getElementById('adm-types-checkboxes').innerHTML = REPORT_TYPES.map(t =>
    `<label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;padding:4px 0;">
      <input type="checkbox" id="srt-${t.id}" ${cur.includes(t.id)?'checked':''}
        style="width:16px;height:16px;cursor:pointer;accent-color:var(--red);">
      <span>${t.ico} ${t.lbl}</span>
    </label>`
  ).join('');
  document.getElementById('adm-types-form-panel').style.display = '';
}

function admSaveTypes() {
  if (!admTypesSelMission) return;
  const sel = REPORT_TYPES
    .filter(t => document.getElementById('srt-'+t.id)?.checked)
    .map(t => t.id);
  DB.siteTypes = DB.siteTypes.filter(st => String(st.mission_id)!==String(admTypesSelMission));
  sel.forEach(type => DB.siteTypes.push({mission_id:admTypesSelMission, report_type:type, actif:true}));
  try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
  if (isOnline && tok) {
    fetch(SB+'/rest/v1/site_report_types?mission_id=eq.'+admTypesSelMission, {method:'DELETE', headers:hdr(tok)})
      .then(() => {
        if (!sel.length) return;
        return fetch(SB+'/rest/v1/site_report_types', {
          method:'POST', headers:hdr(tok),
          body: JSON.stringify(sel.map(type => ({mission_id:admTypesSelMission, report_type:type, actif:true})))
        });
      })
      .then(() => showToast('Types enregistrés ✓', true))
      .catch(() => showToast('Erreur sauvegarde', false));
  } else {
    showToast('Enregistré localement ✓', true);
  }
}

/* ── CATÉGORIES ── */
function admRenderCats() {
  document.getElementById('adm-cats-list').innerHTML =
    [...DB.categories].sort((a,b)=>a.ordre-b.ordre).map(c =>
      `<div class="admin-item${admCatId===c.id?' active':''}${!c.actif?' inactive':''}" onclick="admEditCat('${c.id}')">
        <div class="admin-item-ico">${c.icone}</div>
        <div class="admin-item-txt"><div class="admin-item-name">${esc(c.label)}</div></div>
        <div class="admin-item-badge">${c.actif?'actif':'inactif'}</div>
      </div>`
    ).join('')
    + '<div class="admin-item" onclick="admNewCat()" style="color:var(--red);justify-content:center;font-size:13px;">+ Nouvelle catégorie</div>';
}

function admNewCat() {
  admCatId = null;
  document.getElementById('adm-cat-form').style.display = '';
  document.getElementById('adm-cat-form-title').textContent = 'Nouvelle catégorie';
  document.getElementById('cat-label').value  = '';
  document.getElementById('cat-icone').value  = '📋';
  document.getElementById('cat-couleur').value = 'r';
  document.getElementById('cat-ordre').value  = '0';
  document.getElementById('cat-actif').checked = true;
  document.getElementById('adm-cat-del').style.display = 'none';
}

function admEditCat(id) {
  const c = DB.categories.find(x => x.id===id); if (!c) return;
  admCatId = id;
  document.getElementById('adm-cat-form').style.display = '';
  document.getElementById('adm-cat-form-title').textContent = 'Modifier';
  document.getElementById('cat-label').value   = c.label  || '';
  document.getElementById('cat-icone').value   = c.icone  || '';
  document.getElementById('cat-couleur').value = c.couleur|| 'r';
  document.getElementById('cat-ordre').value   = c.ordre  || 0;
  document.getElementById('cat-actif').checked = !!c.actif;
  document.getElementById('adm-cat-del').style.display = '';
}

function admCancelCat() {
  document.getElementById('adm-cat-form').style.display = 'none';
  admCatId = null;
}

function admSaveCat() {
  const data = {
    label:   document.getElementById('cat-label').value.trim(),
    icone:   document.getElementById('cat-icone').value.trim() || '📋',
    couleur: document.getElementById('cat-couleur').value,
    ordre:   parseInt(document.getElementById('cat-ordre').value) || 0,
    actif:   document.getElementById('cat-actif').checked,
  };
  if (!data.label) { showToast('Libellé requis', false); return; }
  const h = hdr(tok);
  if (admCatId) {
    data.id = admCatId;
    const i = DB.categories.findIndex(c => c.id===admCatId);
    if (i>=0) DB.categories[i] = {...DB.categories[i], ...data};
    if (isOnline && tok) fetch(SB+'/rest/v1/ir_categories?id=eq.'+admCatId,
      {method:'PATCH', headers:Object.assign({},h,{'Prefer':'return=minimal'}), body:JSON.stringify(data)}).catch(()=>{});
  } else {
    data.id = 'cat-'+Date.now();
    DB.categories.push(data);
    if (isOnline && tok) fetch(SB+'/rest/v1/ir_categories',
      {method:'POST', headers:Object.assign({},h,{'Prefer':'return=minimal'}), body:JSON.stringify(data)}).catch(()=>{});
  }
  try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
  admCancelCat(); admRenderCats(); showToast('Catégorie enregistrée ✓', true);
}

function admDeleteCat() {
  if (!admCatId) return;
  openConfirm('Supprimer cette catégorie ?', 'Les natures et suggestions associées seront supprimées.', () => {
    const id = admCatId; closeConfirm();
    DB.categories = DB.categories.filter(c => c.id !== id);
    const nids = DB.natures.filter(n => n.category_id===id).map(n => n.id);
    DB.natures     = DB.natures.filter(n => n.category_id !== id);
    DB.suggestions = DB.suggestions.filter(s => !nids.includes(s.nature_id));
    if (isOnline && tok) fetch(SB+'/rest/v1/ir_categories?id=eq.'+id, {method:'DELETE', headers:hdr(tok)}).catch(()=>{});
    try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
    admCancelCat(); admRenderCats(); showToast('Supprimée.', true);
  });
}

/* ── NATURES ── */
function admRenderNatCats() {
  document.getElementById('adm-nats-cats').innerHTML =
    [...DB.categories].sort((a,b)=>a.ordre-b.ordre).map(c =>
      `<div class="admin-item${admNatCatId===c.id?' active':''}" onclick="admSelNatCat('${c.id}')">
        <div class="admin-item-ico">${c.icone}</div>
        <div class="admin-item-txt"><div class="admin-item-name">${esc(c.label)}</div></div>
      </div>`
    ).join('');
  if (admNatCatId) admRenderNatList();
}

function admSelNatCat(id) {
  admNatCatId = id; admNatId = null;
  document.getElementById('adm-nat-form').style.display = 'none';
  document.getElementById('adm-nat-add-btn').style.display = '';
  const c = DB.categories.find(x => x.id===id) || {};
  document.getElementById('adm-nats-title').textContent = c.label || 'Natures';
  admRenderNatCats(); admRenderNatList();
}

function admRenderNatList() {
  const nats = DB.natures.filter(n => String(n.category_id)===String(admNatCatId)).sort((a,b)=>a.ordre-b.ordre);
  document.getElementById('adm-nats-list').innerHTML = nats.map(n =>
    `<div class="admin-item${admNatId===n.id?' active':''}${!n.actif?' inactive':''}" onclick="admEditNat('${n.id}')">
      <div class="admin-item-txt"><div class="admin-item-name">${esc(n.label)}</div></div>
      <div class="admin-item-badge">${n.actif?'actif':'inactif'}</div>
    </div>`
  ).join('') || '<div style="padding:16px;text-align:center;color:var(--text3);font-size:13px;">Aucune nature</div>';
}

function admNewNat() {
  admNatId = null;
  document.getElementById('nat-label').value  = '';
  document.getElementById('nat-ordre').value  = '0';
  document.getElementById('nat-actif').checked = true;
  document.getElementById('adm-nat-del').style.display = 'none';
  document.getElementById('adm-nat-form').style.display = '';
}

function admEditNat(id) {
  const n = DB.natures.find(x => x.id===id); if (!n) return;
  admNatId = id;
  document.getElementById('nat-label').value  = n.label || '';
  document.getElementById('nat-ordre').value  = n.ordre || 0;
  document.getElementById('nat-actif').checked = !!n.actif;
  document.getElementById('adm-nat-del').style.display = '';
  document.getElementById('adm-nat-form').style.display = '';
}

function admCancelNat() {
  document.getElementById('adm-nat-form').style.display = 'none';
  admNatId = null;
}

function admSaveNat() {
  if (!admNatCatId) { showToast('Sélectionnez une catégorie', false); return; }
  const data = {
    label:       document.getElementById('nat-label').value.trim(),
    ordre:       parseInt(document.getElementById('nat-ordre').value) || 0,
    actif:       document.getElementById('nat-actif').checked,
    category_id: admNatCatId,
  };
  if (!data.label) { showToast('Libellé requis', false); return; }
  const h = hdr(tok);
  if (admNatId) {
    data.id = admNatId;
    const i = DB.natures.findIndex(n => n.id===admNatId);
    if (i>=0) DB.natures[i] = {...DB.natures[i], ...data};
    if (isOnline && tok) fetch(SB+'/rest/v1/ir_natures?id=eq.'+admNatId,
      {method:'PATCH', headers:Object.assign({},h,{'Prefer':'return=minimal'}), body:JSON.stringify(data)}).catch(()=>{});
  } else {
    data.id = 'nat-'+Date.now();
    DB.natures.push(data);
    if (isOnline && tok) fetch(SB+'/rest/v1/ir_natures',
      {method:'POST', headers:Object.assign({},h,{'Prefer':'return=minimal'}), body:JSON.stringify(data)}).catch(()=>{});
  }
  try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
  admCancelNat(); admRenderNatList(); showToast('Nature enregistrée ✓', true);
}

function admDeleteNat() {
  if (!admNatId) return;
  openConfirm('Supprimer cette nature ?', 'Les suggestions associées seront supprimées.', () => {
    const id = admNatId; closeConfirm();
    DB.natures     = DB.natures.filter(n => n.id !== id);
    DB.suggestions = DB.suggestions.filter(s => s.nature_id !== id);
    if (isOnline && tok) fetch(SB+'/rest/v1/ir_natures?id=eq.'+id, {method:'DELETE', headers:hdr(tok)}).catch(()=>{});
    try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
    admCancelNat(); admRenderNatList(); showToast('Supprimée.', true);
  });
}

/* ── SUGGESTIONS ── */
function admFillCatSel() {
  const sel = document.getElementById('sugg-cat-sel');
  if (!sel) return;
  sel.innerHTML = [...DB.categories].sort((a,b)=>a.ordre-b.ordre)
    .map(c => `<option value="${c.id}">${c.icone} ${esc(c.label)}</option>`).join('');
}

function admRenderSuggCats() {
  admFillCatSel();
  admLoadSuggNats();
}

function admLoadSuggNats() {
  const cid  = document.getElementById('sugg-cat-sel').value;
  const nats = DB.natures.filter(n => String(n.category_id)===String(cid)).sort((a,b)=>a.ordre-b.ordre);
  document.getElementById('adm-sugg-nats').innerHTML = nats.map(n =>
    `<div class="admin-item${admSuggNatId===n.id?' active':''}" onclick="admSelSuggNat('${n.id}')">
      <div class="admin-item-txt"><div class="admin-item-name">${esc(n.label)}</div></div>
    </div>`
  ).join('') || '<div style="padding:16px;text-align:center;color:var(--text3);font-size:13px;">Aucune nature</div>';
  if (admSuggNatId && !nats.find(n => n.id===admSuggNatId)) admSuggNatId = null;
  if (admSuggNatId) admRenderSuggContent();
}

function admSelSuggNat(id) { admSuggNatId = id; admLoadSuggNats(); admRenderSuggContent(); }

function admRenderSuggContent() {
  if (!admSuggNatId) {
    document.getElementById('adm-sugg-content').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);">Sélectionnez une nature</div>';
    return;
  }
  const nat     = DB.natures.find(n => n.id===admSuggNatId) || {};
  const constats = DB.suggestions.filter(s => String(s.nature_id)===String(admSuggNatId) && s.type==='constat').sort((a,b)=>a.ordre-b.ordre);
  const mesures  = DB.suggestions.filter(s => String(s.nature_id)===String(admSuggNatId) && s.type==='mesure').sort((a,b)=>a.ordre-b.ordre);
  document.getElementById('adm-sugg-title').textContent = esc(nat.label||'Suggestions');

  const msSel = `<select class="admin-select" id="sugg-site-sel" style="margin-bottom:8px;">
    <option value="">Global (tous les sites)</option>
    ${[...DB.missions].sort((a,b)=>(a.titre||'').localeCompare(b.titre||'','fr'))
      .map(m=>`<option value="${m.id}">${esc(m.titre)}</option>`).join('')}
  </select>`;

  const sr = s => {
    const mis = s.mission_id
      ? (DB.missions.find(m => String(m.id)===String(s.mission_id))||{}).titre || 'Site spécifique'
      : 'Global';
    return `<div class="sugg-row" style="opacity:${s.actif?1:.4}">
      <div class="sugg-txt">${esc(s.texte)}</div>
      <span class="sugg-site">${esc(mis)}</span>
      <button class="sugg-btn" onclick="admToggleSugg('${s.id}')">${s.actif?'Désact.':'Activer'}</button>
      <button class="sugg-btn del" onclick="admDelSugg('${s.id}')">×</button>
    </div>`;
  };

  document.getElementById('adm-sugg-content').innerHTML =
    `<div style="margin-bottom:10px;">
      <label style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:5px;">Spécifique à un site (optionnel)</label>
      ${msSel}
    </div>
    <div class="sugg-section">
      <div class="sugg-section-title">👁 Que constatez-vous ? (constats)</div>
      <div class="sugg-list">${constats.map(sr).join('')}</div>
      <button class="sugg-add" onclick="admAddSugg('constat')">+ Ajouter un constat</button>
    </div>
    <div class="sugg-section">
      <div class="sugg-section-title">⚡ Qu'avez-vous fait ? (mesures)</div>
      <div class="sugg-list">${mesures.map(sr).join('')}</div>
      <button class="sugg-add" onclick="admAddSugg('mesure')">+ Ajouter une mesure</button>
    </div>`;
}

function admAddSugg(type) {
  const txt = prompt(type==='constat' ? 'Nouveau constat (1ère personne) :' : 'Nouvelle mesure (1ère personne) :');
  if (!txt || !txt.trim()) return;
  const mid  = document.getElementById('sugg-site-sel')?.value || null;
  const data = { id:'sg-'+Date.now(), nature_id:admSuggNatId, type, texte:txt.trim(), actif:true, ordre:999, mission_id:mid||null };
  DB.suggestions.push(data);
  if (isOnline && tok) fetch(SB+'/rest/v1/ir_suggestions',
    {method:'POST', headers:Object.assign({},hdr(tok),{'Prefer':'return=minimal'}), body:JSON.stringify(data)}).catch(()=>{});
  try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
  admRenderSuggContent(); showToast('Suggestion ajoutée ✓', true);
}

function admToggleSugg(id) {
  const s = DB.suggestions.find(x => x.id===id); if (!s) return;
  s.actif = !s.actif;
  if (isOnline && tok) fetch(SB+'/rest/v1/ir_suggestions?id=eq.'+id,
    {method:'PATCH', headers:Object.assign({},hdr(tok),{'Prefer':'return=minimal'}), body:JSON.stringify({actif:s.actif})}).catch(()=>{});
  try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
  admRenderSuggContent();
}

function admDelSugg(id) {
  DB.suggestions = DB.suggestions.filter(s => s.id!==id);
  if (isOnline && tok) fetch(SB+'/rest/v1/ir_suggestions?id=eq.'+id, {method:'DELETE', headers:hdr(tok)}).catch(()=>{});
  try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
  admRenderSuggContent(); showToast('Supprimée.', true);
}
