/* ============================================================
   module_stats.js — Stats, graphiques, drill-down
   ============================================================ */

let statsPeriod = 'veille';

function setPeriod(p) {
  statsPeriod = p;
  ['veille','semaine','mois','mois_prec','annee'].forEach(x => {
    document.getElementById('pt-'+x).className = 'period-tab'+(x===p?' active':'');
  });
  closeDrill();
  renderStats();
}

function getPeriodRange(p) {
  const now = new Date();
  const [y,mo,d] = [now.getFullYear(), now.getMonth(), now.getDate()];
  const brk = new Date(y,mo,d,6,30,0);
  let from, to, label;
  if (p === 'veille') {
    const yest = new Date(brk); yest.setDate(yest.getDate()-1);
    const yend = new Date(brk); yend.setMinutes(yend.getMinutes()-1);
    from=yest; to=yend; label=`Veille : ${fmtDt(yest)} → ${fmtDt(yend)}`;
  } else if (p === 'semaine') {
    const dow = now.getDay()||7;
    from = new Date(y,mo,d-(dow-1),0,0,0); to=now; label='Semaine en cours';
  } else if (p === 'mois') {
    from = new Date(y,mo,1,0,0,0); to=now; label='Mois en cours';
  } else if (p === 'mois_prec') {
    from = new Date(y,mo-1,1,0,0,0); to=new Date(y,mo,0,23,59,59); label='Mois précédent';
  } else if (p === 'annee') {
    from = new Date(y,0,1,0,0,0); to=now; label=`Année ${y}`;
  }
  document.getElementById('period-lbl').textContent = label || '';
  return { from, to };
}

function filterByPeriod(reports, range) {
  return reports.filter(r => {
    if (!r.date) return false;
    const [yr,m,dy] = r.date.split('-').map(Number);
    const [hh,mm]   = (r.heure||'00:00').split(':').map(Number);
    const dt = new Date(yr, m-1, dy, hh, mm, 0);
    return dt >= range.from && dt <= range.to;
  });
}

function renderStats() {
  const range    = getPeriodRange(statsPeriod);
  const filtered = filterByPeriod(getAllReports(), range);

  // KPIs
  document.getElementById('sk-total').textContent = filtered.length;

  const bysite = {}; filtered.forEach(r => { const k=r.mission_name||'Inconnu'; bysite[k]=(bysite[k]||0)+1; });
  const topSite = Object.entries(bysite).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('sk-top-site').textContent = topSite ? 'Site : '+topSite[0] : '—';

  const bytype = {}; filtered.forEach(r => { const k=typeLbl(r.type||'intervention'); bytype[k]=(bytype[k]||0)+1; });
  const topType = Object.entries(bytype).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('sk-top-type-n').textContent = topType ? topType[1] : '—';
  document.getElementById('sk-top-type').textContent   = topType ? topType[0] : '—';

  const byag = {}; filtered.forEach(r => { const k=r.agent_name||'Inconnu'; byag[k]=(byag[k]||0)+1; });
  const topAg = Object.entries(byag).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('sk-top-ag-n').textContent = topAg ? topAg[1] : '—';
  document.getElementById('sk-top-ag').textContent   = topAg ? topAg[0] : '—';

  // Graphiques
  renderChart('chart-site',   bysite,  'site',   '#C8102E');
  renderChart('chart-type',   bytype,  'type',   '#1a5a8a');
  const bynature = {};
  filtered.forEach(r => { if (r.nature) { const k=r.nature.slice(0,40); bynature[k]=(bynature[k]||0)+1; }});
  renderChart('chart-nature', bynature,'nature', '#1e6b1e');
}

function renderChart(cid, counts, dim, color) {
  const el = document.getElementById(cid);
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,12);
  if (!entries.length) { el.innerHTML = '<div class="chart-empty">Aucune donnée</div>'; return; }
  const max = entries[0][1];
  el.innerHTML = entries.map(([key,val]) => {
    const pct = Math.round((val/max)*100);
    const out = pct < 20;
    return `<div class="bar-row" onclick="drillDown('${esc(key)}','${dim}')" title="${esc(key)}">
      <div class="bar-lbl" title="${esc(key)}">${esc(key)}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%;background:${color};">
          ${!out ? `<span class="bar-val">${val}</span>` : ''}
        </div>
        ${out ? `<span class="bar-val out">${val}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

function drillDown(key, dim) {
  const range    = getPeriodRange(statsPeriod);
  const filtered = filterByPeriod(getAllReports(), range);
  let matches;
  if (dim === 'site')   matches = filtered.filter(r => (r.mission_name||'Inconnu') === key);
  else if (dim === 'type')   matches = filtered.filter(r => typeLbl(r.type||'intervention') === key);
  else matches = filtered.filter(r => (r.nature||'').slice(0,40) === key);
  matches.sort((a,b) => ((b.date||'')+(b.heure||'')) > ((a.date||'')+(a.heure||'')) ? 1 : -1);

  document.getElementById('drill-title-txt').textContent = `${esc(key)} (${matches.length})`;
  document.getElementById('drill-list').innerHTML = matches.map(r =>
    `<div class="drill-row" onclick="viewReport('${r.id}')">
      <div class="drill-date">${fmtDate(r.date||'')} ${(r.heure||'').slice(0,5)}</div>
      <div class="drill-info">
        <div class="drill-name">${esc(r.client_name||'—')} · ${esc(r.mission_name||'—')}</div>
        <div class="drill-sub">${esc((r.constats||r.nature||'').slice(0,60))}</div>
      </div>
      <div style="color:var(--text3);">›</div>
    </div>`
  ).join('') || '<div style="padding:16px;text-align:center;color:var(--text3);">Aucun rapport</div>';

  document.getElementById('drill-wrap').style.display = '';
  setTimeout(() => document.getElementById('drill-wrap').scrollIntoView({behavior:'smooth',block:'nearest'}), 100);
}

function closeDrill() { document.getElementById('drill-wrap').style.display = 'none'; }
