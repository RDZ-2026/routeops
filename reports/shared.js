/* ============================================================
   shared.js — Config, DB, Auth, Sync, Utils
   RDZ Reports — https://rdz-2026.github.io/reports/
   ============================================================ */

/* ── CONFIG ── */
const SB      = 'https://trdhtlcenmjlcvzuplid.supabase.co';
const KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZGh0bGNlbm1qbGN2enVwbGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTE2NzQsImV4cCI6MjA5MjAyNzY3NH0.8r-ITHC-w28vQ4_FKI6Hbwg4AYVqYR0i-69_oHSD5DU';
const SB_RES  = 'https://pdewmubikmotqzbxmyeq.supabase.co';
const KEY_RES = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZXdtdWJpa21vdHF6YnhteWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDU3MjgsImV4cCI6MjA5NDg4MTcyOH0.SRuhERPmB5_7a58nJ5oMg4a8mujnoLBv8dxkxvyNWao';
const SK      = 'rdz_session';
const LS_DB   = 'rdz_v6_db';
const LS_PND  = 'rdz_v6_pending';
const SEARCH_THRESHOLD = 10;
const LOGO_B64 = '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';

/* ── TYPES DE RAPPORTS ── */
const REPORT_TYPES = [
  { id:'intervention', lbl:'Intervention',       ico:'🛡️', color:'r', sub:'Alarme, sécurité, accès...' },
  { id:'ouverture',    lbl:'Ouverture chambre',  ico:'🔑', color:'p', sub:'Résidents, badges'          },
  { id:'denonciation', lbl:'Dénonciation',       ico:'🚗', color:'b', sub:'Véhicule en infraction'     },
  { id:'parking',      lbl:'Contrôle parking',  ico:'🅿️', color:'o', sub:'Présence, plaques'          },
  { id:'dlcc',         lbl:'Comptage DLCC',      ico:'📊', color:'v', sub:'David Lloyd Collex'        },
];

const CLOTURES = [
  { id:'regle',    ico:'✅', lbl:'Situation terminée', col:'sel-v' },
  { id:'action',   ico:'📅', lbl:'Action à venir',     col:'sel-o' },
  { id:'info',     ico:'ℹ️',  lbl:'Pour information',   col:'sel-b' },
  { id:'probleme', ico:'⚠️', lbl:'Problème en cours',  col:'sel'   },
];

const CATCOLOR = { r:'sel', p:'sel-p', b:'sel-b', o:'sel-o', v:'sel-v', c:'sel-c', g:'sel-g' };

/* ── ÉTAT GLOBAL ── */
let tok = null, sess = null, isOnline = navigator.onLine;

const DB = {
  reports:[], clients:[], missions:[], agents:[],
  categories:[], natures:[], suggestions:[],
  residents:[], siteTypes:[]
};

let pending = [];

/* ── CONNECTIVITY ── */
window.addEventListener('online',  () => { isOnline = true;  setSyncState('ok','En ligne'); syncPending(); });
window.addEventListener('offline', () => { isOnline = false; setSyncState('err','Hors ligne'); });

/* ── AUTH ── */
function hdr(t) {
  return { 'apikey':KEY, 'Authorization':'Bearer '+(t||KEY), 'Content-Type':'application/json', 'Prefer':'return=representation' };
}

function doLogin() {
  const email = document.getElementById('a-email').value.trim();
  const pass  = document.getElementById('a-pass').value;
  const errEl = document.getElementById('a-err');
  if (!email || !pass) { errEl.textContent = 'Champs requis.'; return; }
  errEl.textContent = '';
  fetch(SB+'/auth/v1/token?grant_type=password', {
    method:'POST',
    headers:{ 'apikey':KEY, 'Content-Type':'application/json' },
    body: JSON.stringify({ email, password:pass })
  })
  .then(r => r.json())
  .then(d => {
    if (d.access_token) {
      tok  = d.access_token;
      sess = { uid: d.user?.id, email: d.user?.email };
      try { localStorage.setItem(SK, JSON.stringify({ token:tok, exp:Date.now()+3500000, uid:sess.uid, email:sess.email })); } catch(e) {}
      document.getElementById('auth-ov').style.display = 'none';
      loadAll();
    } else {
      errEl.textContent = d.error_description || 'Identifiants incorrects.';
    }
  })
  .catch(() => { errEl.textContent = 'Erreur réseau.'; });
}

function initAuth() {
  try {
    const s = JSON.parse(localStorage.getItem(SK) || '{}');
    if (s.token && s.exp > Date.now()+60000) {
      tok  = s.token;
      sess = { uid:s.uid, email:s.email };
      document.getElementById('auth-ov').style.display = 'none';
      loadAll();
      return;
    }
  } catch(e) {}
  document.getElementById('auth-ov').style.display = 'flex';
}

/* ── LOAD ALL ── */
function loadAll() {
  setSyncState('', 'Chargement...');
  if (!isOnline) { loadLocal(); return; }
  const h = hdr(tok);
  Promise.all([
    fetch(SB+'/rest/v1/intervention_reports?order=date.desc,heure.desc&select=*', {headers:h}).then(r => r.ok ? r.json() : []),
    fetch(SB+'/rest/v1/crm_clients?order=raison_sociale.asc&select=id,raison_sociale',       {headers:h}).then(r => r.ok ? r.json() : []),
    fetch(SB+'/rest/v1/crm_missions?order=titre.asc&select=id,titre,client_id,adresse',      {headers:h}).then(r => r.ok ? r.json() : []),
    fetch(SB+'/rest/v1/rh_agents?select=id,nom,prenom&order=nom.asc',                        {headers:h}).then(r => r.ok ? r.json() : []),
    fetch(SB+'/rest/v1/ir_categories?order=ordre.asc&select=*',                              {headers:h}).then(r => r.ok ? r.json() : []),
    fetch(SB+'/rest/v1/ir_natures?order=ordre.asc&select=*',                                 {headers:h}).then(r => r.ok ? r.json() : []),
    fetch(SB+'/rest/v1/ir_suggestions?order=ordre.asc&select=*',                             {headers:h}).then(r => r.ok ? r.json() : []),
    fetch(SB+'/rest/v1/site_report_types?select=*',                                          {headers:h}).then(r => r.ok ? r.json() : []),
    fetch(SB_RES+'/rest/v1/residents?select=name_first,name_last,room_space,building&order=name_last.asc',
      {headers:{ 'apikey':KEY_RES, 'Authorization':'Bearer '+KEY_RES }}).then(r => r.ok ? r.json() : []).catch(() => []),
  ])
  .then(([rpts,cls,ms,ags,cats,nats,suggs,sTypes,res]) => {
    if (Array.isArray(rpts))   DB.reports     = rpts;
    if (Array.isArray(cls))    DB.clients     = cls;
    if (Array.isArray(ms))     DB.missions    = ms;
    if (Array.isArray(ags))    DB.agents      = ags;
    if (Array.isArray(cats))   DB.categories  = cats;
    if (Array.isArray(nats))   DB.natures     = nats;
    if (Array.isArray(suggs))  DB.suggestions = suggs;
    if (Array.isArray(sTypes)) DB.siteTypes   = sTypes;
    if (Array.isArray(res))    DB.residents   = res;
    try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
    try { pending = JSON.parse(localStorage.getItem(LS_PND) || '[]'); } catch(e) {}
    migrateOldReports();
    populateFilters();
    renderList();
    setSyncState('ok', 'Sync '+nowTime());
    syncPending();
  })
  .catch(e => { console.error('loadAll:', e); loadLocal(); });
}

function loadLocal() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_DB) || '{}');
    DB.reports     = d.reports     || [];
    DB.clients     = d.clients     || [];
    DB.missions    = d.missions    || [];
    DB.agents      = d.agents      || [];
    DB.categories  = d.categories  || [];
    DB.natures     = d.natures     || [];
    DB.suggestions = d.suggestions || [];
    DB.siteTypes   = d.siteTypes   || [];
    DB.residents   = d.residents   || [];
  } catch(e) {}
  try { pending = JSON.parse(localStorage.getItem(LS_PND) || '[]'); } catch(e) {}
  migrateOldReports();
  populateFilters();
  renderList();
  setSyncState('err', 'Hors ligne');
}

function migrateOldReports() {
  const oldKeys = ['rdz_ir_db','rdz_ir3_db','rdz_ir4_db','rdz_ir5_db'];
  let migrated = 0;
  oldKeys.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const d = JSON.parse(raw);
      (d.reports || []).forEach(r => {
        if (!DB.reports.find(x => x.id === r.id)) {
          if (!r.type) r.type = 'intervention';
          DB.reports.push(r);
          migrated++;
        }
      });
    } catch(e) {}
  });
  if (migrated > 0) {
    try { localStorage.setItem(LS_DB, JSON.stringify(DB)); } catch(e) {}
    showToast(migrated+' rapport(s) récupéré(s) des versions précédentes', true);
    if (isOnline && tok) syncAllReports();
  }
}

function populateFilters() {
  // Liste
  const sel = document.getElementById('f-client');
  if (sel) sel.innerHTML = '<option value="">Tous clients</option>'
    + DB.clients.map(c => `<option value="${c.id}">${esc(c.raison_sociale)}</option>`).join('');
  // Ouvertures
  const sel2 = document.getElementById('ouv-client');
  if (sel2) sel2.innerHTML = '<option value="">Tous les clients</option>'
    + DB.clients.map(c => `<option value="${c.id}">${esc(c.raison_sociale)}</option>`).join('');
  // Suggestions admin
  const sel3 = document.getElementById('sugg-cat-sel');
  if (sel3) admFillCatSel();
}

/* ── SYNC ── */
function savePending() { try { localStorage.setItem(LS_PND, JSON.stringify(pending)); } catch(e) {} }
function addPending(op) { pending.push(op); savePending(); }

function cleanForSupa(r) {
  const allowed = ['id','type','date','heure','agent_id','agent_name','client_id','client_name',
    'mission_id','mission_name','localisation','resident_name','categorie','nature',
    'constats','actions','statut_cloture','photos','data','created_at','updated_at','created_by'];
  const clean = {};
  allowed.forEach(k => { if (r[k] !== undefined && r[k] !== null) clean[k] = r[k]; });
  return clean;
}

function syncPending() {
  if (!isOnline || !tok || !pending.length) return;
  const ops = [...pending]; pending = []; savePending();
  ops.forEach(op => {
    if (op.type === 'upsert') {
      fetch(SB+'/rest/v1/intervention_reports', {
        method:'POST',
        headers: Object.assign({}, hdr(tok), { 'Prefer':'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify(cleanForSupa(op.data))
      })
      .then(r => { if (!r.ok) r.json().then(err => { console.error('[sync]', err); addPending(op); }).catch(() => addPending(op)); })
      .catch(() => addPending(op));
    } else if (op.type === 'delete') {
      fetch(SB+'/rest/v1/intervention_reports?id=eq.'+op.id, { method:'DELETE', headers:hdr(tok) })
        .catch(() => addPending(op));
    }
  });
  setSyncState('ok', 'Sync '+nowTime());
}

function syncAllReports() {
  if (!isOnline || !tok) return;
  const btn = document.getElementById('btn-sync-all');
  if (btn) { btn.disabled = true; btn.textContent = 'Sync...'; }
  const h = Object.assign({}, hdr(tok), { 'Prefer':'resolution=merge-duplicates,return=minimal' });
  const total = DB.reports.length;
  let done = 0, errors = 0;
  if (!total) {
    if (btn) { btn.disabled = false; btn.textContent = '☁️ Sync'; }
    showToast('Aucun rapport à synchroniser', true);
    return;
  }
  function next(i) {
    if (i >= total) {
      if (btn) { btn.disabled = false; btn.textContent = '☁️ Sync'; }
      syncPending();
      showToast('Sync: '+done+' rapport(s)'+(errors?' ('+errors+' err.)':'')+' ✓', errors === 0);
      setSyncState('ok', 'Sync '+nowTime());
      return;
    }
    fetch(SB+'/rest/v1/intervention_reports', { method:'POST', headers:h, body:JSON.stringify(cleanForSupa(DB.reports[i])) })
      .then(r => { if (r.ok) done++; else errors++; next(i+1); })
      .catch(() => { errors++; next(i+1); });
  }
  next(0);
}

/* ── NAVIGATION ── */
function goPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  document.querySelectorAll('.tb-btn').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('nav-'+id);
  if (nb) nb.classList.add('active');
  if (id === 'list')  renderList();
  if (id === 'stats') renderStats();
  if (id === 'email') { renderEmailList(); initOuvReport(); }
  if (id === 'admin') admTab('types');
}

/* ── CONFIRM ── */
let _confirmCb = null;
function openConfirm(title, msg, cb) {
  document.getElementById('confirm-t').textContent   = title;
  document.getElementById('confirm-msg').textContent = msg;
  _confirmCb = cb;
  document.getElementById('confirm-ov').classList.add('open');
  document.getElementById('btn-confirm-ok').onclick = () => { if (_confirmCb) _confirmCb(); };
}
function closeConfirm() {
  document.getElementById('confirm-ov').classList.remove('open');
  _confirmCb = null;
}

/* ── UTILS ── */
function getAllReports() {
  let all = [...DB.reports];
  pending.filter(o => o.type === 'upsert').forEach(o => {
    const i = all.findIndex(r => r.id === o.data.id);
    if (i >= 0) all[i] = {...o.data}; else all.unshift({...o.data});
  });
  pending.filter(o => o.type === 'delete').forEach(o => { all = all.filter(r => r.id !== o.id); });
  all.sort((a,b) => ((b.date||'')+(b.heure||'')) > ((a.date||'')+(a.heure||'')) ? 1 : -1);
  return all;
}

function typeLbl(t) {
  const m = { intervention:'Intervention', ouverture:'Ouverture', denonciation:'Dénonciation', parking:'Parking', dlcc:'DLCC' };
  return m[t] || t || '?';
}

function typeBadge(t) {
  const cls = { intervention:'tb-int', ouverture:'tb-ouv', denonciation:'tb-den', parking:'tb-park', dlcc:'tb-dlcc' };
  return `<span class="${cls[t]||'tb-int'}">${typeLbl(t)}</span>`;
}

function clBadge(s) {
  const m = { regle:['b-regle','✔'], action:['b-action','📅'], info:['b-info','ℹ️'], probleme:['b-probleme','⚠️'] };
  if (m[s]) return `<span class="badge ${m[s][0]}">${m[s][1]}</span>`;
  return '<span class="badge b-draft">—</span>';
}

function genId()   { return 'rpt_'+Date.now()+'_'+Math.random().toString(36).slice(2,5); }
function fmtDate(s) { if (!s) return '—'; const p = s.split('-'); return p[2]+'.'+p[1]+'.'+p[0]; }
function fmtDt(d)  { return fmtDate(d.toISOString().slice(0,10))+' '+String(d.getHours()).padStart(2,'0')+'h'+String(d.getMinutes()).padStart(2,'0'); }
function toISO(d)  { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function nowTime() { return new Date().toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}); }
function esc(s)    { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function getWeekNum(d) {
  const dt  = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const ys  = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil((((dt - ys) / 86400000) + 1) / 7);
}

let _tt = null;
function showToast(msg, ok) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show '+(ok ? 'ok' : 'err');
  clearTimeout(_tt);
  _tt = setTimeout(() => { t.className = 'toast'; }, 3200);
}

function setSyncState(cls, txt) {
  const p = document.getElementById('sync-pill');
  p.className = 'sync-pill'+(cls ? ' '+cls : '');
  document.getElementById('sync-txt').textContent = txt;
}
