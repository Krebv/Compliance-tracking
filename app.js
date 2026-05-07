let complianceData = { updatedAt: null, rules: [] };
let changesData = { updatedAt: null, summary: '', changes: [] };
let alertsData = { updatedAt: null, alerts: [] };
const $ = (id) => document.getElementById(id);

async function loadData() {
  try {
    const [compliance, changes, alerts] = await Promise.all([
      fetchJson('data/compliance.json'),
      fetchJson('data/changes.json'),
      fetchJson('data/alerts.json')
    ]);
    complianceData = compliance;
    changesData = changes;
    alertsData = alerts;
    $('dataStatus').textContent = `${complianceData.rules.length} rules loaded`;
  } catch (err) {
    $('dataStatus').textContent = 'Using starter sample data';
    complianceData = starterData();
    changesData = { summary: 'No saved change log yet.', changes: [] };
    alertsData = { alerts: [] };
  }
  $('lastUpdated').textContent = complianceData.updatedAt ? new Date(complianceData.updatedAt).toLocaleString() : 'Not updated yet';
  $('changeSummary').textContent = changesData.summary || 'No change summary available.';
  initFilters();
  render();
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Missing ${path}`);
  return res.json();
}

function starterData() {
  return { updatedAt: new Date().toISOString(), rules: [
    { country:'Singapore', topic:'Additive Limits', foodCategory:'seasoning / snack', parameter:'Permitted food additives', limit:'Only permitted additives may be used; verify official schedules.', unit:'', risk:'High', sourceTitle:'SFA food additive limits', sourceUrl:'https://www.sfa.gov.sg/regulatory-standards-frameworks-guidelines/food-safety-regulatory-limits/regulatory-limits-for-food-additives', notes:'Starter record. Run GitHub Action to update.' }
  ]};
}

function initFilters() {
  const countries = [...new Set(complianceData.rules.map(r => r.country).filter(Boolean))].sort();
  $('countryFilter').innerHTML = '<option value="">All countries</option>' + countries.map(c => `<option>${escapeHtml(c)}</option>`).join('');
  ['searchInput','countryFilter','topicFilter','riskFilter'].forEach(id => $(id).addEventListener('input', render));
  $('downloadBtn').addEventListener('click', downloadJson);
  $('checkBtn').addEventListener('click', runBasicCheck);
}

function filteredRules() {
  const q = $('searchInput').value.toLowerCase().trim();
  const country = $('countryFilter').value;
  const topic = $('topicFilter').value;
  const risk = $('riskFilter').value;
  return complianceData.rules.filter(r => {
    const blob = JSON.stringify(r).toLowerCase();
    return (!q || blob.includes(q)) && (!country || r.country === country) && (!topic || r.topic === topic) && (!risk || r.risk === risk);
  });
}

function render() {
  const rules = filteredRules();
  renderSummary(rules);
  renderAlerts();
  renderRules(rules);
  renderChanges();
}

function renderSummary(rules) {
  const topics = ['Additive Limits','Microbiology Limits','Contaminant Limits','Salt / Sodium Limits','Allergen List','Labelling Requirement'];
  $('summaryGrid').innerHTML = topics.map(t => `<div class="metric"><span>${t}</span><strong>${rules.filter(r => r.topic === t).length}</strong></div>`).join('');
}

function renderAlerts() {
  const alerts = alertsData.alerts || [];
  $('alertsList').innerHTML = alerts.length ? alerts.slice(0, 12).map(a => `
    <div class="alert ${a.alertLevel === 'High' ? 'high' : ''}">
      <h3>${escapeHtml(a.title)}</h3>
      <p><strong>${escapeHtml(a.alertLevel)}</strong> · ${escapeHtml(a.actionRequired)}</p>
      <p>${escapeHtml(a.details || '')}</p>
      ${a.sourceUrl ? `<a href="${escapeAttr(a.sourceUrl)}" target="_blank" rel="noopener">Open source</a>` : ''}
    </div>`).join('') : '<p class="muted">No alerts yet. Run the GitHub Action after at least one previous snapshot exists to detect changes.</p>';
}

function renderRules(rules) {
  $('resultCount').textContent = `${rules.length} result(s)`;
  $('rulesBody').innerHTML = rules.map(r => `
    <tr>
      <td>${escapeHtml(r.country || '')}</td>
      <td>${escapeHtml(r.topic || '')}</td>
      <td>${escapeHtml(r.foodCategory || '')}</td>
      <td><strong>${escapeHtml(r.parameter || '')}</strong><br><span class="muted">${escapeHtml(r.notes || '')}</span></td>
      <td>${escapeHtml(r.limit || '')} ${escapeHtml(r.unit || '')}</td>
      <td><span class="badge ${escapeHtml(r.risk || 'Moderate')}">${escapeHtml(r.risk || 'Moderate')}</span></td>
      <td>${escapeHtml(r.effectiveDate || '')}</td>
      <td>${r.sourceUrl ? `<a href="${escapeAttr(r.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(r.sourceTitle || 'Source')}</a>` : escapeHtml(r.sourceTitle || '')}</td>
    </tr>`).join('');
}

function renderChanges() {
  const changes = changesData.changes || [];
  $('changesBody').innerHTML = changes.length ? changes.map(c => `
    <tr>
      <td><span class="badge ${escapeHtml(c.changeType)}">${escapeHtml(c.changeType)}</span></td>
      <td><span class="badge ${escapeHtml(c.severity || 'Moderate')}">${escapeHtml(c.severity || 'Moderate')}</span></td>
      <td>${escapeHtml(c.country || '')}</td>
      <td>${escapeHtml(c.topic || '')}</td>
      <td>${escapeHtml(c.parameter || '')}</td>
      <td>${escapeHtml(c.oldLimit || '')}</td>
      <td>${escapeHtml(c.newLimit || '')}</td>
      <td>${c.sourceUrl ? `<a href="${escapeAttr(c.sourceUrl)}" target="_blank" rel="noopener">Source</a>` : ''}</td>
    </tr>`).join('') : '<tr><td colspan="8" class="muted">No changes detected yet.</td></tr>';
}

function runBasicCheck() {
  const input = $('productInput').value.toLowerCase();
  const hits = complianceData.rules.filter(r => {
    const blob = JSON.stringify(r).toLowerCase();
    return blob.split(/[^a-z0-9]+/).some(token => token.length > 3 && input.includes(token)) || ['allergen','sodium','salt','additive','micro','contaminant','seasoning','snack'].some(k => input.includes(k) && blob.includes(k));
  }).slice(0, 30);
  $('checkOutput').textContent = hits.length ? hits.map(r => `- [${r.risk}] ${r.country} | ${r.topic} | ${r.parameter}: ${r.limit}\n  Source: ${r.sourceUrl || r.sourceTitle}`).join('\n') : 'No matching rule found. Add more precise product data or update sources.';
}

function downloadJson() {
  const payload = { complianceData, changesData, alertsData };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'regulatory-intelligence-data.json' });
  a.click(); URL.revokeObjectURL(url);
}

function escapeHtml(v){return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function escapeAttr(v){return escapeHtml(v).replace(/`/g,'');}
loadData();
