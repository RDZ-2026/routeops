/* ============================================================
   module_liste.js — Panel liste, KPIs, filtres
   ============================================================ */

function renderList() {
  const q  = (document.getElementById('f-q').value || '').toLowerCase();
  const ft = document.getElementById('f-type').value;
  const fc = document.getElementById('f-client').value;
  const fs = document.getElementById('f-statut').value;
  const fm = document.getElementById('f-month').value;

  const all      = getAllReports();
  const filtered = all.filter(r => {
    if (ft && (r.type||'intervention') !== ft) return false;
    if (fc && r.client_id !== fc)              return false;
    if (fs && (r.statut_cloture||'draft') !== fs) return false;
    if (fm && !(r.date||'').startsWith(fm))    return false;
    if (q) {
      const hay = [r.client_name,r.mission_name,r.nature,r.agent_name,r.type,r.constats,r.resident_name].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const ym = new Date().toISOString().slice(0,7);
  document.getElementById('k-total').textContent  = all.length;
  document.getElementById('k-regle').textContent  = all.filter(r => r.statut_cloture === 'regle').length;
  document.getElementById('k-prob').textContent   = all.filter(r => r.statut_cloture === 'probleme').length;
  document.getElementById('k-action').textContent = all.filter(r => r.statut_cloture === 'action').length;
  document.getElementById('k-month').textContent  = all.filter(r => (r.date||'').startsWith(ym)).length;

  if (!filtered.length) {
    document.getElementById('tbl-body').innerHTML =
      `<div class="empty"><div style="font-size:32px;margin-bottom:10px;">📋</div>
       <div style="font-size:14px;font-weight:600;color:var(--text2);">${all.length ? 'Aucun résultat' : 'Aucun rapport'}</div></div>`;
    return;
  }

  document.getElementById('tbl-body').innerHTML = filtered.map(r => {
    const type   = r.type || 'standard';
    const catObj = DB.categories.find(c => String(c.id)===String(r.categorie));
    const wType  = catObj?.wizard_type || type;
    const d      = r.data || {};
    let excerpt  = '';
    if (wType === 'denonciation')
      excerpt = (d.plaque||'') + (d.n_denonc ? ' — N°'+d.n_denonc : '');
    else if (wType === 'parking')
      excerpt = (d.nb_vehicules||0)+' véhicule(s)'+(d.infraction ? ' — infraction' : '');
    else if (wType === 'dlcc')
      excerpt = 'DLCC: '+(d.nb_dlcc||0)+' places · CLX: '+(d.nb_clx||0)+' véh.';
    else
      excerpt = (r.constats || r.nature || '').split('\n')[0].slice(0,65);

    return `<div class="tbl-row" onclick="viewReport('${r.id}')">
      <div class="tc mono">${r.date ? fmtDate(r.date) : '—'}</div>
      <div class="tc mono">${(r.heure||'—').slice(0,5)}</div>
      <div class="tc">${typeBadge(type)}</div>
      <div class="tc wrap">
        <div style="font-size:13px;font-weight:700;color:var(--text);">
          ${esc(r.client_name||'—')}<span style="color:var(--red);margin:0 4px;">·</span>
          <span style="font-weight:600;color:var(--text2);">${esc(r.mission_name||'—')}</span>
        </div>
        ${excerpt ? `<div style="font-size:11.5px;color:var(--text3);margin-top:1px;">${esc(excerpt)}</div>` : ''}
      </div>
      <div class="tc">${clBadge(r.statut_cloture)}</div>
      <div class="tc" style="color:var(--text3);">›</div>
    </div>`;
  }).join('');
}
