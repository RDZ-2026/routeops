/* ============================================================
   module_wizard.js — Wizard adaptatif (5 types de rapports)
   ============================================================ */

let wzType  = null;
let wzStep  = 0;
let wzSteps = [];
let WZ      = {};
let photoContext = null;

/* ── TYPE SELECT ── */
function startNewReport() {
  wzType = null; wzStep = 0; WZ = {};
  document.getElementById('wz-type-select').style.display = '';
  document.getElementById('wz-steps').style.display = 'none';
  document.getElementById('wz-type-tiles').innerHTML = REPORT_TYPES.map(t =>
    `<div class="tile" onclick="selectRptType('${t.id}')">
      <div class="tile-ico">${t.ico}</div>
      <div class="tile-lbl">${t.lbl}</div>
      <div class="tile-sub">${t.sub}</div>
    </div>`
  ).join('');
  goPanel('wizard');
}

function selectRptType(type) {
  wzType  = type;
  wzSteps = getSteps(type);
  wzStep  = 0;
  const now = new Date();
  WZ = {
    type, date:now.toISOString().slice(0,10), heure:now.toTimeString().slice(0,5),
    agentId:null, agentName:'', clientId:null, clientName:'', missionId:null, missionName:'',
    localisation:'', chambre:'', residentName:'',
    categorieId:null, categorieLbl:'', natureId:null, natureLbl:'',
    constats:'', actions:'', cloture:null, photos:[],
    plaque:'', nDenonc:'', photoPlaqueIdx:-1, photoFeuilletIdx:-1, photoPareBriseIdx:-1,
    nbVehicules:0, infraction:false, vehicules:[],
    nbDlcc:0, nbClx:0,
  };
  const rt = REPORT_TYPES.find(t => t.id===type);
  document.getElementById('wz-type-select').style.display = 'none';
  document.getElementById('wz-steps').style.display = '';
  document.getElementById('wz-type-lbl').textContent = rt ? rt.lbl : '';
  renderWzStep();
}

function wzEditReport(r) {
  wzType  = r.type || 'intervention';
  wzSteps = getSteps(wzType);
  wzStep  = 0;
  const d = r.data || {};
  WZ = {
    type:wzType, date:r.date||'', heure:r.heure||'',
    agentId:r.agent_id, agentName:r.agent_name||'',
    clientId:r.client_id, clientName:r.client_name||'',
    missionId:r.mission_id, missionName:r.mission_name||'',
    localisation:r.localisation||'', chambre:r.localisation||'',
    residentName:r.resident_name||'',
    categorieId:r.categorie, categorieLbl:'', natureId:null, natureLbl:r.nature||'',
    constats:r.constats||'', actions:r.actions||'',
    cloture:r.statut_cloture||null, photos:r.photos||[],
    plaque:d.plaque||'', nDenonc:d.n_denonc||'',
    photoPlaqueIdx:-1, photoFeuilletIdx:-1, photoPareBriseIdx:-1,
    nbVehicules:d.nb_vehicules||0, infraction:d.infraction||false, vehicules:d.vehicules||[],
    nbDlcc:d.nb_dlcc||0, nbClx:d.nb_clx||0,
  };
  if (r.categorie) {
    const c = DB.categories.find(x => String(x.id)===String(r.categorie));
    if (c) WZ.categorieLbl = c.label;
  }
  if (r.nature) {
    const n = DB.natures.find(x => x.label===r.nature);
    if (n) WZ.natureId = n.id;
  }
  const rt = REPORT_TYPES.find(t => t.id===wzType);
  document.getElementById('wz-type-select').style.display = 'none';
  document.getElementById('wz-steps').style.display = '';
  document.getElementById('wz-type-lbl').textContent = rt ? rt.lbl : '';
  goPanel('wizard');
  renderWzStep();
}

function getSteps(type) {
  const s = {
    intervention: ['datetime','agent','client','site','categorie','nature','constats','actions','cloture','photos','recap'],
    ouverture:    ['datetime','agent','client','site','chambre','nature','resident','cloture','photos','recap'],
    denonciation: ['datetime','agent','client','site','denonc_veh','denonc_plaque','denonc_feuillet','denonc_ndenonc','denonc_pb','recap'],
    parking:      ['datetime','agent','client','site','parking_infos','parking_vehicules','recap'],
    dlcc:         ['datetime','agent','client','dlcc_comptage','photos','recap'],
  };
  return s[type] || ['datetime','agent','client','site','recap'];
}

/* ── RENDER STEP ── */
function renderWzStep() {
  const total = wzSteps.length;
  document.getElementById('wz-fill').style.width = Math.round((wzStep/total)*100)+'%';
  document.getElementById('wz-step-lbl').textContent = `Étape ${wzStep+1}/${total}`;
  const s = wzSteps[wzStep];
  let body = '', hiddenNext = false;

  /* datetime */
  if (s === 'datetime') {
    body = `<div class="wz-row">
      <div class="wz-field"><label>Date</label><input class="wz-input" type="date" id="wz-date" value="${WZ.date}" oninput="WZ.date=this.value"></div>
      <div class="wz-field"><label>Heure</label><input class="wz-input" type="time" id="wz-heure" value="${WZ.heure}" oninput="WZ.heure=this.value"></div>
    </div><div class="wz-hint">Pré-rempli automatiquement.</div>`;
  }
  /* agent */
  else if (s === 'agent') {
    hiddenNext = true;
    const sorted = [...DB.agents].sort((a,b) => (a.nom||'').localeCompare(b.nom||'','fr'));
    const ns = sorted.length > SEARCH_THRESHOLD;
    const items = sorted.map(a => {
      const n   = ((a.nom||'')+' '+(a.prenom||'')).trim();
      const ini = ((a.nom||'').slice(0,1)+(a.prenom||'').slice(0,1)).toUpperCase();
      const colors = ['#C8102E','#2563eb','#16a34a','#7c3aed','#ea580c','#0891b2'];
      const bg  = colors[(a.id||'x').charCodeAt(0) % colors.length];
      const sel = String(WZ.agentId) === String(a.id);
      return `<div class="tile tile-h${sel?' sel':''}" onclick="autoNext('agent','${a.id}','${esc(n)}',this)">
        <div class="tile-av" style="background:${bg};color:white;">${ini}</div>
        <div class="tile-h-info"><div class="tile-h-name">${esc(n)}</div></div>
        <div class="tile-check">✓</div></div>`;
    }).join('');
    body = (ns?wzSrch('agt-list'):'')+'<div class="tiles-scroll"><div class="tile-grid g1" id="agt-list">'+(items||noData())+'</div></div>';
  }
  /* client */
  else if (s === 'client') {
    hiddenNext = true;
    const ns = DB.clients.length > SEARCH_THRESHOLD;
    const items = DB.clients.map(c => {
      const sel = String(WZ.clientId) === String(c.id);
      return `<div class="tile${sel?' sel':''}" onclick="autoNext('client','${c.id}','${esc(c.raison_sociale)}',this)" style="min-height:56px;">
        <div class="tile-lbl" style="font-size:13px;">${esc(c.raison_sociale)}</div></div>`;
    }).join('');
    body = (ns?wzSrch('cl-list'):'')+'<div class="tiles-scroll"><div class="tile-grid" id="cl-list">'+(items||noData())+'</div></div>';
  }
  /* site */
  else if (s === 'site') {
    hiddenNext = true;
    const sites = DB.missions.filter(m => m.client_id === WZ.clientId);
    const ns = sites.length > SEARCH_THRESHOLD;
    const items = sites.map(m => {
      const sel = String(WZ.missionId) === String(m.id);
      return `<div class="tile tile-h${sel?' sel':''}" onclick="autoNext('site','${m.id}','${esc(m.titre)}',this)">
        <div class="tile-av" style="background:#d1fae5;color:#065f46;font-size:16px;">📍</div>
        <div class="tile-h-info"><div class="tile-h-name">${esc(m.titre)}</div>${m.adresse?`<div class="tile-h-sub">${esc(m.adresse)}</div>`:''}</div>
        <div class="tile-check">✓</div></div>`;
    }).join('');
    body = `<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">Client : <strong style="color:var(--text);">${esc(WZ.clientName)}</strong></div>`
      + (ns?wzSrch('site-list'):'')
      + '<div class="tiles-scroll"><div class="tile-grid g1" id="site-list">'+(sites.length?items:naSite())+'</div></div>';
  }
  /* catégorie */
  else if (s === 'categorie') {
    hiddenNext = true;
    const cats = DB.categories.filter(c=>c.actif).sort((a,b)=>a.ordre-b.ordre);
    body = '<div class="tile-grid">'+cats.map(c => {
      const cc  = CATCOLOR[c.couleur]||'sel';
      const sel = String(WZ.categorieId) === String(c.id);
      return `<div class="tile${sel?' '+cc:''}" onclick="autoNext('cat','${c.id}','${esc(c.label)}',this)">
        <div class="tile-ico">${c.icone}</div><div class="tile-lbl">${esc(c.label)}</div></div>`;
    }).join('')+'</div>';
  }
  /* nature */
  else if (s === 'nature') {
    hiddenNext = true;
    const nats = DB.natures.filter(n=>String(n.category_id)===String(WZ.categorieId)&&n.actif).sort((a,b)=>a.ordre-b.ordre);
    const ns   = nats.length > SEARCH_THRESHOLD;
    const items = nats.map(n => {
      const sel = String(WZ.natureId) === String(n.id);
      return `<div class="tile tile-h${sel?' sel':''}" onclick="autoNext('nature','${n.id}','${esc(n.label)}',this)">
        <div class="tile-h-info"><div class="tile-h-name">${esc(n.label)}</div></div>
        <div class="tile-check">✓</div></div>`;
    }).join('');
    body = (ns?wzSrch('nat-list'):'')+'<div class="tiles-scroll"><div class="tile-grid g1" id="nat-list">'+(items||noData())+'</div></div>';
  }
  /* constats */
  else if (s === 'constats') {
    if (!WZ.natureId && WZ.natureLbl) { const nf=DB.natures.find(n=>n.label===WZ.natureLbl); if(nf) WZ.natureId=nf.id; }
    const suggs = DB.suggestions.filter(sg=>String(sg.nature_id)===String(WZ.natureId)&&sg.actif&&sg.type==='constat').sort((a,b)=>a.ordre-b.ordre);
    const chips = suggs.map(sg => {
      const sel = (WZ.constats||'').includes(sg.texte);
      return `<div class="chip${sel?' sel':''}" onclick="chipClick(this,false)">${sg.texte}</div>`;
    }).join('');
    body = (chips?`<div class="chips-label">Suggestions rapides</div><div class="chips">${chips}</div>`:'')
      + `<textarea class="wz-textarea" id="wz-constats" placeholder="Que constatez-vous ?" oninput="WZ.constats=this.value">${WZ.constats||''}</textarea>`
      + '<div class="wz-hint">Tapez sur une suggestion ou rédigez librement.</div>';
  }
  /* actions */
  else if (s === 'actions') {
    if (!WZ.natureId && WZ.natureLbl) { const nf=DB.natures.find(n=>n.label===WZ.natureLbl); if(nf) WZ.natureId=nf.id; }
    const suggs = DB.suggestions.filter(sg=>String(sg.nature_id)===String(WZ.natureId)&&sg.actif&&sg.type==='mesure').sort((a,b)=>a.ordre-b.ordre);
    const chips = suggs.map(sg => {
      const sel = (WZ.actions||'').includes(sg.texte);
      return `<div class="chip${sel?' sel':''}" onclick="chipClick(this,true)">${sg.texte}</div>`;
    }).join('');
    body = (chips?`<div class="chips-label">Suggestions rapides</div><div class="chips">${chips}</div>`:'')
      + `<textarea class="wz-textarea" id="wz-actions" placeholder="Qu'avez-vous fait ?" oninput="WZ.actions=this.value">${WZ.actions||''}</textarea>`;
  }
  /* clôture */
  else if (s === 'cloture') {
    hiddenNext = true;
    body = '<div class="tile-grid">'+CLOTURES.map(c => {
      const sel = WZ.cloture === c.id;
      return `<div class="tile${sel?' '+c.col:''}" onclick="autoNext('cloture','${c.id}','${c.lbl}',this)" style="min-height:76px;">
        <div class="tile-ico">${c.ico}</div><div class="tile-lbl">${c.lbl}</div></div>`;
    }).join('')+'</div>';
  }
  /* chambre */
  else if (s === 'chambre') {
    body = `<input class="wz-input" type="text" id="wz-chambre" value="${WZ.chambre||''}" placeholder="Ex : 214, Studio B..." oninput="WZ.chambre=this.value" autocomplete="off">
      <div class="wz-hint">N° ou nom de la chambre</div>`;
  }
  /* résident */
  else if (s === 'resident') {
    hiddenNext = true;
    let resAll = [...DB.residents];
    const q = (WZ.chambre||'').toLowerCase();
    if (q) { const cf = resAll.filter(r=>(r.room_space||'').toLowerCase().includes(q)); if(cf.length) resAll=cf; }
    resAll = resAll.slice(0,60);
    const ns    = DB.residents.length > SEARCH_THRESHOLD;
    const items = resAll.map(r => {
      const fn  = ((r.name_first||'')+' '+(r.name_last||'')).trim();
      const room = r.room_space || '';
      const sel  = WZ.residentName === fn;
      const el   = document.createElement('div');
      el.className = 'tile tile-h'+(sel?' sel':'');
      el.setAttribute('data-rname', fn);
      el.onclick = function() { autoNextResident(this); };
      el.innerHTML = `<div class="tile-av" style="background:#7c3aed;color:white;">👤</div>
        <div class="tile-h-info"><div class="tile-h-name">${esc(fn)}</div>${room?`<div class="tile-h-sub">Chambre ${esc(room)}</div>`:''}</div>
        <div class="tile-check">✓</div>`;
      return el.outerHTML;
    }).join('');
    body = (ns?wzSrch('res-list'):'')
      +'<div class="tiles-scroll"><div class="tile-grid g1" id="res-list">'
      +(items||'<div style="padding:20px;text-align:center;color:var(--text3);">Aucun résident trouvé</div>')
      +'</div></div>';
  }
  /* dénonciation — photo véhicule */
  else if (s === 'denonc_veh') {
    const hasPh = WZ.photoPlaqueIdx >= 0;
    body = '<div style="font-size:13px;color:var(--text2);margin-bottom:14px;">Prenez une photo du véhicule (plaque visible). L\'IA lit la plaque automatiquement.</div>'
      + '<div class="photo-row">'+(hasPh?`<div class="photo-thumb"><img src="${WZ.photos[WZ.photoPlaqueIdx].src}"><button class="ph-del" onclick="removePhDn('veh')">×</button></div>`:'')+  '</div>'
      + (hasPh?'':`<button class="btn-add-ph" onclick="takePhotoAI('veh')">📷 Photo véhicule + plaque</button>`)
      + (WZ.plaque?`<div class="ai-result">✓ Plaque lue : <strong>${esc(WZ.plaque)}</strong></div>`:'')
      + '<div class="wz-hint">Photo obligatoire — plaque visible.</div>';
  }
  /* dénonciation — plaque */
  else if (s === 'denonc_plaque') {
    body = `<div style="font-size:13px;color:var(--text2);margin-bottom:12px;">Vérifiez et corrigez si nécessaire.</div>
      <input class="wz-input" type="text" id="wz-plaque" value="${WZ.plaque||''}"
        placeholder="Ex : VD283931/CH" oninput="WZ.plaque=this.value.toUpperCase()"
        style="font-family:'DM Mono';font-size:18px;text-transform:uppercase;text-align:center;">
      <div class="wz-hint">Format : XX000000/CH</div>`;
  }
  /* dénonciation — photo feuillet */
  else if (s === 'denonc_feuillet') {
    const hasPh = WZ.photoFeuilletIdx >= 0;
    body = '<div style="font-size:13px;color:var(--text2);margin-bottom:14px;">Photographiez le feuillet rempli. L\'IA lit le numéro automatiquement.</div>'
      + '<div class="photo-row">'+(hasPh?`<div class="photo-thumb"><img src="${WZ.photos[WZ.photoFeuilletIdx].src}"><button class="ph-del" onclick="removePhDn('feuillet')">×</button></div>`:'')+  '</div>'
      + (hasPh?'':`<button class="btn-add-ph" onclick="takePhotoAI('feuillet')">📷 Photo feuillet</button>`)
      + (WZ.nDenonc?`<div class="ai-result">✓ N° dénonciation : <strong>${esc(WZ.nDenonc)}</strong></div>`:'');
  }
  /* dénonciation — N° */
  else if (s === 'denonc_ndenonc') {
    body = `<div style="font-size:13px;color:var(--text2);margin-bottom:12px;">Vérifiez et corrigez si nécessaire.</div>
      <input class="wz-input" type="text" id="wz-ndenonc" value="${WZ.nDenonc||''}"
        placeholder="Ex : 1757860" oninput="WZ.nDenonc=this.value"
        style="font-family:'DM Mono';font-size:18px;text-align:center;">
      <div class="wz-hint">Numéro figurant sur le feuillet.</div>`;
  }
  /* dénonciation — photo pare-brise */
  else if (s === 'denonc_pb') {
    const hasPh = WZ.photoPareBriseIdx >= 0;
    body = '<div style="font-size:13px;color:var(--text2);margin-bottom:14px;">Photographiez le pare-brise (4 coins visibles).</div>'
      + '<div class="photo-row">'+(hasPh?`<div class="photo-thumb"><img src="${WZ.photos[WZ.photoPareBriseIdx].src}"><button class="ph-del" onclick="removePhDn('pb')">×</button></div>`:'')+  '</div>'
      + (hasPh?'':`<button class="btn-add-ph" onclick="takePhotoAI('pb')">📷 Photo pare-brise</button>`)
      + '<div class="wz-hint">4 coins du pare-brise doivent être visibles.</div>';
  }
  /* parking — infos */
  else if (s === 'parking_infos') {
    body = `<div class="wz-row" style="margin-bottom:12px;">
      <div class="wz-field"><label>Localisation</label><input class="wz-input" type="text" id="wz-pk-loc" value="${esc(WZ.localisation||'')}" placeholder="Adresse..." oninput="WZ.localisation=this.value"></div>
      <div class="wz-field"><label>Nb. véhicules total</label><input class="wz-num" type="number" id="wz-pk-nb" min="0" value="${WZ.nbVehicules||0}" oninput="WZ.nbVehicules=parseInt(this.value)||0"></div>
    </div>
    <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">Véhicules en infraction ?</div>
    <div class="tile-grid">
      <div class="tile${WZ.infraction===false?' sel-v':''}" onclick="WZ.infraction=false;renderWzStep()"><div class="tile-ico">✅</div><div class="tile-lbl">Non</div></div>
      <div class="tile${WZ.infraction===true?' sel':''}" onclick="WZ.infraction=true;renderWzStep()"><div class="tile-ico">⚠️</div><div class="tile-lbl">Oui</div></div>
    </div>`;
  }
  /* parking — véhicules */
  else if (s === 'parking_vehicules') {
    const vlist = WZ.vehicules.map((v,i) =>
      `<div class="vehicle-item">
        <div class="vehicle-n">Véhicule ${i+1}</div>
        <button class="vehicle-del" onclick="removeVeh(${i})">×</button>
        <input class="wz-input" style="margin-bottom:8px;font-family:'DM Mono';" type="text"
          placeholder="Plaque Ex: GE443410/CH" value="${esc(v.plaque||'')}"
          oninput="WZ.vehicules[${i}].plaque=this.value.toUpperCase()">
        ${v.photo
          ? `<div class="photo-row"><div class="photo-thumb"><img src="${v.photo}"><button class="ph-del" onclick="removeVehPhoto(${i})">×</button></div></div>`
          : `<button class="btn-add-ph" style="padding:6px 10px;font-size:11px;" onclick="takeVehPhoto(${i})">📷 Macaron</button>`}
      </div>`
    ).join('');
    body = `<div class="vehicle-list">${vlist}</div>
      <button class="btn primary" style="margin-top:10px;width:100%;" onclick="addVeh()">+ Ajouter un véhicule</button>
      <div class="wz-hint">Plaque + photo du macaron pare-brise par véhicule.</div>`;
  }
  /* DLCC */
  else if (s === 'dlcc_comptage') {
    body = `<div style="font-size:13px;color:var(--text2);margin-bottom:14px;">Site : DAVID LLOYD — Collex</div>
      <div class="wz-row">
        <div class="wz-field"><label>Places disponibles parking DLCC</label><input class="wz-num" type="number" id="wz-dlcc" min="0" value="${WZ.nbDlcc||0}" oninput="WZ.nbDlcc=parseInt(this.value)||0"></div>
        <div class="wz-field"><label>Véhicules parking CLX</label><input class="wz-num" type="number" id="wz-clx" min="0" value="${WZ.nbClx||0}" oninput="WZ.nbClx=parseInt(this.value)||0"></div>
      </div>`;
  }
  /* photos */
  else if (s === 'photos') {
    const thumbs = WZ.photos.map((p,i) =>
      `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div class="photo-thumb"><img src="${p.src}"><button class="ph-del" onclick="removePhoto(${i})">×</button></div>
        <input style="width:80px;font-size:10px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;outline:none;text-align:center;"
          type="text" placeholder="Légende..." value="${esc(p.caption||'')}" oninput="WZ.photos[${i}].caption=this.value">
      </div>`
    ).join('');
    body = `<div class="photo-row">${thumbs}</div>
      <button class="btn-add-ph" onclick="document.getElementById('photo-input').click()">📷 Ajouter une photo</button>
      <div class="wz-hint">Optionnel · La caméra s'ouvre directement sur mobile.</div>`;
  }
  /* récap */
  else if (s === 'recap') {
    const rows = buildRecap();
    body = `<div class="recap-block">
      ${rows.map(r=>`<div class="recap-row"><span class="rl">${r.l}</span><span class="rv">${esc(r.v)}</span></div>`).join('')}
    </div><div class="wz-hint" style="text-align:center;margin-top:10px;">Vérifiez puis enregistrez.</div>`;
  }

  const isFinal = s === 'recap';
  document.getElementById('wz-container').innerHTML = `<div class="wz-card">
    <div class="wz-q">${wzIcon(s)} ${wzTitle(s)}</div>
    ${body}
    <div class="wz-nav">
      ${wzStep > 0 ? '<button class="btn-prev" onclick="wzPrev()">← Retour</button>' : '<div></div>'}
      ${!hiddenNext ? `<button class="btn-next" onclick="wzNext()">${isFinal ? '💾 Enregistrer' : 'Suivant →'}</button>` : '<div></div>'}
    </div>
  </div>`;
}

/* ── HELPERS WIZARD ── */
function wzSrch(lid) {
  return `<div class="wz-search"><span class="wz-search-ico">🔍</span><input type="search" placeholder="Filtrer..." oninput="filterTiles(this,'${lid}')"></div>`;
}
function filterTiles(inp, lid) {
  const q = inp.value.toLowerCase();
  const l = document.getElementById(lid);
  if (!l) return;
  l.querySelectorAll('.tile').forEach(t => { t.style.display = t.textContent.toLowerCase().includes(q) ? '' : 'none'; });
}
function noData()  { return '<div style="padding:20px;text-align:center;color:var(--text3);">Aucune donnée</div>'; }
function naSite()  { return '<div style="padding:20px;text-align:center;color:var(--text3);border:1.5px dashed var(--border);border-radius:10px;">Aucun site configuré</div>'; }

function wzIcon(s) {
  const m = { datetime:'📅',agent:'👤',client:'🏢',site:'📍',chambre:'🚪',resident:'👤',
    categorie:'📋',nature:'🔎',constats:'👁',actions:'⚡',cloture:'🏁',photos:'📸',recap:'✅',
    denonc_veh:'📸',denonc_plaque:'🔤',denonc_feuillet:'📄',denonc_ndenonc:'🔢',denonc_pb:'🚗',
    parking_infos:'🅿️',parking_vehicules:'🚙',dlcc_comptage:'📊' };
  return m[s] || '';
}
function wzTitle(s) {
  const m = { datetime:'Date & heure',agent:'Qui intervient ?',client:'Quel client ?',site:'Quel site ?',
    chambre:'N° de chambre',resident:'Quel résident ?',categorie:"Type d'intervention",nature:'Nature précise',
    constats:'Que constatez-vous ?',actions:"Qu'avez-vous fait ?",cloture:'Statut de clôture',
    photos:'Photos (optionnel)',recap:'Récapitulatif',
    denonc_veh:'Photo du véhicule',denonc_plaque:"Plaque d'immatriculation",
    denonc_feuillet:'Photo du feuillet',denonc_ndenonc:'N° de dénonciation',denonc_pb:'Photo du pare-brise',
    parking_infos:'Informations générales',parking_vehicules:'Véhicules',dlcc_comptage:'Comptage' };
  return m[s] || s;
}

function buildRecap() {
  const rt = REPORT_TYPES.find(t => t.id===wzType);
  const rows = [
    { l:'Type',  v:rt?rt.lbl:wzType },
    { l:'Date',  v:fmtDate(WZ.date)+' à '+(WZ.heure||'—') },
    { l:'Agent', v:WZ.agentName||'—' },
    { l:'Client',v:WZ.clientName||'—' },
  ];
  if (WZ.missionName)   rows.push({ l:'Site',       v:WZ.missionName });
  if (wzType==='intervention') {
    if (WZ.categorieLbl) rows.push({ l:'Catégorie',  v:WZ.categorieLbl });
    if (WZ.natureLbl)    rows.push({ l:'Nature',     v:WZ.natureLbl });
    if (WZ.cloture)      rows.push({ l:'Clôture',    v:WZ.cloture });
  }
  if (wzType==='ouverture') {
    if (WZ.chambre)      rows.push({ l:'Chambre',    v:WZ.chambre });
    if (WZ.residentName) rows.push({ l:'Résident',   v:WZ.residentName });
    if (WZ.natureLbl)    rows.push({ l:'Motif',      v:WZ.natureLbl });
    if (WZ.cloture)      rows.push({ l:'Clôture',    v:WZ.cloture });
  }
  if (wzType==='denonciation') {
    if (WZ.plaque)  rows.push({ l:'Plaque',          v:WZ.plaque });
    if (WZ.nDenonc) rows.push({ l:'N° dénonciation', v:WZ.nDenonc });
  }
  if (wzType==='parking') {
    rows.push({ l:'Nb. véhicules', v:String(WZ.nbVehicules) });
    rows.push({ l:'Infractions',   v:WZ.infraction?'Oui':'Non' });
    rows.push({ l:'Plaques',       v:WZ.vehicules.map(v=>v.plaque||'?').join(', ')||'—' });
  }
  if (wzType==='dlcc') {
    rows.push({ l:'Places DLCC', v:String(WZ.nbDlcc) });
    rows.push({ l:'Véh. CLX',    v:String(WZ.nbClx) });
  }
  rows.push({ l:'Photos', v:WZ.photos.length+' photo(s)' });
  return rows;
}

/* ── INTERACTIONS ── */
function autoNext(type, id, name, el) {
  if (type==='agent')   { WZ.agentId=id;    WZ.agentName=name; }
  if (type==='client')  { WZ.clientId=id;   WZ.clientName=name; WZ.missionId=null; WZ.missionName=''; }
  if (type==='site')    { WZ.missionId=id;  WZ.missionName=name; }
  if (type==='cat')     { WZ.categorieId=id; WZ.categorieLbl=name; WZ.natureId=null; WZ.natureLbl=''; WZ.constats=''; WZ.actions=''; }
  if (type==='nature')  { WZ.natureId=id;   WZ.natureLbl=name; WZ.constats=''; WZ.actions=''; }
  if (type==='cloture') { WZ.cloture=id; }
  el.parentElement.querySelectorAll('.tile').forEach(t => {
    ['sel','sel-v','sel-b','sel-o','sel-p','sel-c','sel-g'].forEach(c => t.classList.remove(c));
  });
  el.classList.add('sel');
  setTimeout(() => { wzStep++; renderWzStep(); window.scrollTo(0,54); }, 150);
}
function autoNextResident(el) {
  WZ.residentName = el.getAttribute('data-rname');
  el.parentElement.querySelectorAll('.tile').forEach(t => t.classList.remove('sel'));
  el.classList.add('sel');
  setTimeout(() => { wzStep++; renderWzStep(); window.scrollTo(0,54); }, 150);
}

function wzNext() {
  const s = wzSteps[wzStep];
  const collect = { constats:'wz-constats', actions:'wz-actions', chambre:'wz-chambre', denonc_plaque:'wz-plaque', denonc_ndenonc:'wz-ndenonc' };
  const wzMap   = { constats:'constats', actions:'actions', chambre:'chambre', denonc_plaque:'plaque', denonc_ndenonc:'nDenonc' };
  if (collect[s]) { const el=document.getElementById(collect[s]); if(el) WZ[wzMap[s]]=el.value; }
  if (s==='parking_infos') {
    const l=document.getElementById('wz-pk-loc'); const n=document.getElementById('wz-pk-nb');
    if(l) WZ.localisation=l.value; if(n) WZ.nbVehicules=parseInt(n.value)||0;
  }
  if (s==='dlcc_comptage') {
    const d=document.getElementById('wz-dlcc'); const c=document.getElementById('wz-clx');
    if(d) WZ.nbDlcc=parseInt(d.value)||0; if(c) WZ.nbClx=parseInt(c.value)||0;
  }
  if (s === 'recap') { doSaveReport(); return; }
  if (wzStep < wzSteps.length-1) { wzStep++; renderWzStep(); window.scrollTo(0,54); }
}
function wzPrev() { if (wzStep>0) { wzStep--; renderWzStep(); window.scrollTo(0,54); } }

function chipClick(el, isAction) {
  const txt = el.textContent || '';
  if (!isAction) {
    if ((WZ.constats||'').includes(txt)) { WZ.constats=(WZ.constats||'').replace('\n'+txt,'').replace(txt,'').trim(); el.classList.remove('sel'); }
    else { WZ.constats=(WZ.constats?WZ.constats+'\n':'')+txt; el.classList.add('sel'); }
    const ta=document.getElementById('wz-constats'); if(ta) ta.value=WZ.constats;
  } else {
    if ((WZ.actions||'').includes(txt)) { WZ.actions=(WZ.actions||'').replace('\n'+txt,'').replace(txt,'').trim(); el.classList.remove('sel'); }
    else { WZ.actions=(WZ.actions?WZ.actions+'\n':'')+txt; el.classList.add('sel'); }
    const ta=document.getElementById('wz-actions'); if(ta) ta.value=WZ.actions;
  }
}

/* ── PHOTOS ── */
function handlePhotoFile(inp) {
  const f = inp.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = e => { WZ.photos.push({src:e.target.result,caption:''}); renderWzStep(); };
  rd.readAsDataURL(f); inp.value='';
}
function handlePhotoAI(inp) {
  const f = inp.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = e => {
    const src = e.target.result;
    const ctx = photoContext;
    if (ctx==='veh')      { const idx=WZ.photos.length; WZ.photos.push({src,caption:'Véhicule'});  WZ.photoPlaqueIdx=idx;     renderWzStep(); readPlateAI(src); }
    else if (ctx==='feuillet') { const idx=WZ.photos.length; WZ.photos.push({src,caption:'Feuillet'}); WZ.photoFeuilletIdx=idx; renderWzStep(); readDenoncAI(src); }
    else if (ctx==='pb')  { const idx=WZ.photos.length; WZ.photos.push({src,caption:'Pare-brise'}); WZ.photoPareBriseIdx=idx; renderWzStep(); }
    else if (ctx && ctx.startsWith('veh_')) {
      const i = parseInt(ctx.split('_')[1]);
      if (!isNaN(i) && WZ.vehicules[i]) { WZ.vehicules[i].photo=src; renderWzStep(); }
    }
  };
  rd.readAsDataURL(f); inp.value='';
}
function takePhotoAI(ctx)  { photoContext=ctx; document.getElementById('photo-input-ai').click(); }
function takeVehPhoto(i)   { photoContext='veh_'+i; document.getElementById('photo-input-ai').click(); }
function removePhDn(ctx) {
  if (ctx==='veh'     && WZ.photoPlaqueIdx>=0)     { WZ.photos.splice(WZ.photoPlaqueIdx,1);     WZ.photoPlaqueIdx=-1;     WZ.plaque=''; }
  if (ctx==='feuillet'&& WZ.photoFeuilletIdx>=0)   { WZ.photos.splice(WZ.photoFeuilletIdx,1);   WZ.photoFeuilletIdx=-1;   WZ.nDenonc=''; }
  if (ctx==='pb'      && WZ.photoPareBriseIdx>=0)  { WZ.photos.splice(WZ.photoPareBriseIdx,1);  WZ.photoPareBriseIdx=-1; }
  renderWzStep();
}
function removePhoto(i) { WZ.photos.splice(i,1); renderWzStep(); }
function addVeh()         { WZ.vehicules.push({plaque:'',photo:null}); renderWzStep(); }
function removeVeh(i)     { WZ.vehicules.splice(i,1); renderWzStep(); }
function removeVehPhoto(i){ WZ.vehicules[i].photo=null; renderWzStep(); }

/* ── IA LECTURE PLAQUE ── */
function readPlateAI(imgSrc) {
  const b64 = imgSrc.split(',')[1];
  fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:60,
      messages:[{role:'user', content:[
        {type:'image', source:{type:'base64', media_type:'image/jpeg', data:b64}},
        {type:'text',  text:"Lis la plaque d'immatriculation. Réponds UNIQUEMENT avec la plaque (ex: VD283931/CH). Si illisible, réponds ILLISIBLE."}
      ]}]
    })
  })
  .then(r => r.json())
  .then(d => {
    const txt = (d.content?.[0]?.text || '').trim().toUpperCase();
    if (txt && txt !== 'ILLISIBLE') { WZ.plaque = txt; showToast('Plaque lue : '+txt, true); }
    else showToast('Plaque non lisible — saisissez manuellement', false);
    renderWzStep();
  })
  .catch(() => { showToast('IA indisponible', false); renderWzStep(); });
}

/* ── IA LECTURE N° DÉNONCIATION ── */
function readDenoncAI(imgSrc) {
  const b64 = imgSrc.split(',')[1];
  fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:60,
      messages:[{role:'user', content:[
        {type:'image', source:{type:'base64', media_type:'image/jpeg', data:b64}},
        {type:'text',  text:"Cherche un numéro de dénonciation (précédé de D ou DÉNONCIATION, 4-8 chiffres). Réponds UNIQUEMENT avec les chiffres. Si introuvable, réponds INTROUVABLE."}
      ]}]
    })
  })
  .then(r => r.json())
  .then(d => {
    const num = (d.content?.[0]?.text || '').trim().replace(/[^0-9]/g,'');
    if (num.length >= 4) { WZ.nDenonc = num; showToast('N° dénonciation : '+num, true); }
    else showToast('N° non trouvé — saisissez manuellement', false);
    renderWzStep();
  })
  .catch(() => { showToast('IA indisponible', false); renderWzStep(); });
}

/* ── SAVE ── */
function doSaveReport() {
  const id  = currentReportId || genId();
  const rpt = {
    id, type:wzType, date:WZ.date, heure:WZ.heure,
    agent_id:WZ.agentId, agent_name:WZ.agentName,
    client_id:WZ.clientId, client_name:WZ.clientName,
    mission_id:WZ.missionId, mission_name:WZ.missionName,
    localisation:WZ.chambre||WZ.localisation||'',
    resident_name:WZ.residentName||null,
    categorie:WZ.categorieId||null,
    nature:WZ.natureLbl||WZ.plaque||'',
    constats:WZ.constats||'', actions:WZ.actions||'',
    statut_cloture:WZ.cloture||'draft',
    photos:WZ.photos,
    data:buildDataJson(),
    updated_at:new Date().toISOString(),
    created_by:sess?.uid||null,
  };
  if (!currentReportId) rpt.created_at = rpt.updated_at;
  const i = DB.reports.findIndex(r => r.id===id);
  if (i>=0) DB.reports[i]=rpt; else DB.reports.unshift(rpt);
  try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
  currentReportId = id;
  if (!isOnline || !tok) {
    addPending({type:'upsert', data:rpt});
    showToast('Sauvegardé localement ✓', true);
  } else {
    fetch(SB+'/rest/v1/intervention_reports', {
      method:'POST',
      headers: Object.assign({}, hdr(tok), {'Prefer':'resolution=merge-duplicates,return=minimal'}),
      body: JSON.stringify(cleanForSupa(rpt))
    })
    .then(r => {
      if (r.ok) { showToast('Rapport enregistré ✓', true); setSyncState('ok','Sync '+nowTime()); }
      else r.json().then(err => { console.error('[save]',err); showToast('Erreur: '+(err.message||err.hint), false); addPending({type:'upsert',data:rpt}); });
    })
    .catch(() => { addPending({type:'upsert',data:rpt}); showToast('Sauvegardé localement ✓', true); });
  }
  loadReportView(rpt);
}

function buildDataJson() {
  if (wzType==='denonciation') return { plaque:WZ.plaque, n_denonc:WZ.nDenonc };
  if (wzType==='parking')      return { nb_vehicules:WZ.nbVehicules, infraction:WZ.infraction, vehicules:WZ.vehicules };
  if (wzType==='dlcc')         return { nb_dlcc:WZ.nbDlcc, nb_clx:WZ.nbClx };
  return {};
}
