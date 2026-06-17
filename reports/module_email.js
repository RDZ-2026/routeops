/* ============================================================
   module_email.js — Envoi client + Rapport ouvertures hebdo
   ============================================================ */

let emailSelected = {};

function emailTab(t) {
  document.getElementById('email-tab-send').style.display = t==='send' ? '' : 'none';
  document.getElementById('email-tab-ouv').style.display  = t==='ouv'  ? '' : 'none';
  document.getElementById('etab-send').className = 'admin-tab'+(t==='send'?' active':'');
  document.getElementById('etab-ouv').className  = 'admin-tab'+(t==='ouv' ?' active':'');
  if (t === 'ouv') initOuvReport();
}

/* ── Sélection & envoi rapports ── */
function renderEmailList() {
  const q   = (document.getElementById('email-q').value||'').toLowerCase();
  const df  = document.getElementById('email-date').value;
  const all = getAllReports().filter(r => {
    if (df && (r.date||'') !== df) return false;
    if (q) {
      const hay = [r.client_name,r.mission_name,r.nature,r.agent_name].join(' ').toLowerCase();
      return hay.includes(q);
    }
    return true;
  });
  document.getElementById('email-rpt-list').innerHTML = all.slice(0,60).map(r => {
    const chk = emailSelected[r.id] || false;
    return `<div class="email-rpt-row${chk?' checked':''}" onclick="toggleEmailSel('${r.id}')">
      <div class="email-check">${chk ? '✓' : ''}</div>
      <div class="email-rpt-info">
        <div class="email-rpt-name">${esc(r.client_name||'—')} · ${esc(r.mission_name||'—')}</div>
        <div class="email-rpt-sub">${r.date?fmtDate(r.date):'—'} ${(r.heure||'').slice(0,5)} · ${esc(typeLbl(r.type||'intervention'))}</div>
      </div>
    </div>`;
  }).join('') || '<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px;">Aucun rapport</div>';
}

function toggleEmailSel(id) { emailSelected[id] = !emailSelected[id]; renderEmailList(); genEmailPreview(); }

function emailSelectAll() {
  getAllReports().forEach(r => { emailSelected[r.id] = true; });
  renderEmailList(); genEmailPreview();
}

function genEmailPreview() {
  const selIds = Object.keys(emailSelected).filter(id => emailSelected[id]);
  document.getElementById('email-count').textContent = selIds.length+' rapport(s) sélectionné(s)';
  if (!selIds.length) {
    document.getElementById('email-preview').textContent = 'Sélectionnez des rapports pour générer le corps du mail.';
    return;
  }
  const selRpts = DB.reports.filter(r => emailSelected[r.id])
    .sort((a,b) => ((b.date||'')+(b.heure||'')) > ((a.date||'')+(a.heure||'')) ? 1 : -1);

  // Grouper par date + client
  const byGroup = {};
  selRpts.forEach(r => {
    const key = fmtDate(r.date||'')+'___'+(r.client_name||'');
    if (!byGroup[key]) byGroup[key] = { date:fmtDate(r.date||''), client:r.client_name||'', items:[] };
    const detail = (r.constats ? r.constats.split('\n')[0].slice(0,80) : r.nature) || '';
    byGroup[key].items.push({ site:r.mission_name||'', detail });
  });

  let body = 'Bonjour,\n\nVeuillez trouver ci-joint le/les rapport(s) établi(s) par notre agent concernant :\n\n';
  Object.values(byGroup).forEach(g => {
    body += `Rapport du ${g.date}${g.client ? ' — '+g.client : ''} :\n`;
    g.items.forEach(i => { body += `• ${i.site ? i.site+' : ' : ''}${i.detail}\n`; });
    body += '\n';
  });
  body += 'Meilleures salutations,\n\nRDZ Security Management SA';
  document.getElementById('email-preview').textContent = body;
}

function openMailto() {
  const body     = document.getElementById('email-preview').textContent;
  const selRpts  = DB.reports.filter(r => emailSelected[r.id]);
  const clients  = [...new Set(selRpts.map(r => r.client_name||''))].filter(Boolean).join(', ');
  const subject  = 'RDZ Security — Rapport(s) d\'intervention'+(clients ? ' — '+clients : '');
  window.open('mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body));
}

function copyEmailBody() {
  navigator.clipboard.writeText(document.getElementById('email-preview').textContent)
    .then(() => showToast('Corps du mail copié ✓', true))
    .catch(() => showToast('Copie non disponible', false));
}

/* ── Rapport ouvertures hebdo ── */
function initOuvReport() {
  const sel = document.getElementById('ouv-client');
  if (sel) sel.innerHTML = '<option value="">Tous les clients</option>'
    + DB.clients.map(c => `<option value="${c.id}">${esc(c.raison_sociale)}</option>`).join('');

  const today = new Date();
  const dow   = today.getDay() || 7;
  const mon   = new Date(today); mon.setDate(today.getDate()-(dow-1));
  const sun   = new Date(mon);   sun.setDate(mon.getDate()+6);
  document.getElementById('ouv-from').value = toISO(mon);
  document.getElementById('ouv-to').value   = toISO(sun);
  genOuvReport();
}

function genOuvReport() {
  const cid     = document.getElementById('ouv-client').value;
  const fromStr = document.getElementById('ouv-from').value;
  const toStr   = document.getElementById('ouv-to').value;
  if (!fromStr || !toStr) return;

  const from = new Date(fromStr+'T00:00:00');
  const to   = new Date(toStr+'T23:59:59');

  const rows = getAllReports().filter(r => {
    if ((r.type||'intervention') !== 'ouverture') return false;
    if (cid && r.client_id !== cid) return false;
    if (!r.date) return false;
    const [yr,m,dy] = r.date.split('-').map(Number);
    const [hh,mm]   = (r.heure||'00:00').split(':').map(Number);
    const dt = new Date(yr,m-1,dy,hh,mm,0);
    return dt >= from && dt <= to;
  }).sort((a,b) => ((a.date||'')+(a.heure||'')) > ((b.date||'')+(b.heure||'')) ? 1 : -1);

  const recap = { oubliee:0, perdue:0, autre:0 };
  rows.forEach(r => {
    const n = (r.nature||'').toLowerCase();
    if (n.includes('perdue') || n.includes('badge')) recap.perdue++;
    else if (n.includes('oubli')) recap.oubliee++;
    else recap.autre++;
  });

  const wk  = getWeekNum(from);
  const cl  = cid ? DB.clients.find(c => c.id===cid) : null;
  const titre = (cl ? cl.raison_sociale+' — ' : '')+'Rapport Semaine n°'+wk+' du '+fmtDate(fromStr);

  document.getElementById('ouv-report-wrap').innerHTML = `
    <div class="ouv-page">
      <div class="ouv-hdr">
        <img src="data:image/png;base64,${LOGO_B64}" alt="RDZ">
        <div class="ouv-hdr-title">${esc(titre)}</div>
      </div>
      <div style="padding:12px 22px 6px;">
        <table class="ouv-recap">
          <tr><td>Carte oubliée</td><td style="text-align:center;font-weight:600;">${recap.oubliee}</td></tr>
          <tr><td>Carte perdue, édition nouveau badge</td><td style="text-align:center;font-weight:600;">${recap.perdue}</td></tr>
          <tr><td>Autre</td><td style="text-align:center;font-weight:600;">${recap.autre}</td></tr>
          <tr class="ouv-total"><td><strong>TOTAL</strong></td><td style="text-align:center;"><strong>${recap.oubliee+recap.perdue+recap.autre}</strong></td></tr>
        </table>
      </div>
      <div class="ouv-body">
        ${rows.length
          ? `<table class="ouv-tbl">
              <thead><tr><th>Date</th><th>Heure</th><th>Site</th><th>Localisation</th><th>Résident</th><th>Motifs</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td style="font-weight:700;">${fmtDate(r.date||'')}</td>
                <td>${(r.heure||'—').slice(0,5)}</td>
                <td>${esc(r.client_name||'—')} — ${esc(r.mission_name||'—')}</td>
                <td style="font-weight:600;color:#C8102E;">${esc(r.localisation||'—')}</td>
                <td>${esc(r.resident_name||'—')}</td>
                <td>${esc(r.nature||'—')}</td>
              </tr>`).join('')}</tbody>
            </table>`
          : '<div style="padding:24px;text-align:center;color:var(--text3);">Aucune ouverture sur cette période.</div>'
        }
      </div>
    </div>`;
}

function openOuvMailto() {
  const fromStr = document.getElementById('ouv-from').value;
  const wk      = getWeekNum(new Date(fromStr+'T00:00:00'));
  const subject = 'RDZ Security — Rapport ouvertures Semaine n°'+wk;
  const body    = `Bonjour,\n\nVeuillez trouver ci-joint le rapport des ouvertures de chambre pour la semaine n°${wk}.\n\nMeilleures salutations,\n\nRDZ Security Management SA`;
  window.open('mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body));
}
