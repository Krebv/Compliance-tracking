let complianceData = { updatedAt: null, rules: [] };
const $ = (id) => document.getElementById(id);

async function loadData() {
  try {
    const res = await fetch('data/compliance.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Missing data/compliance.json');
    complianceData = await res.json();
    $('dataStatus').textContent = `${complianceData.rules.length} rules loaded`;
  } catch (err) {
    $('dataStatus').textContent = 'Using starter sample data';
    complianceData = starterData();
  }
  $('lastUpdated').textContent = complianceData.updatedAt ? new Date(complianceData.updatedAt).toLocaleString() : 'Not available';
  initFilters();
  render();
}

function starterData() {
  return {
    updatedAt: new Date().toISOString(),
    rules: [
      { country:'Singapore', topic:'Additive Limits', foodCategory:'seasoning / snack', parameter:'Permitted food additives', limit:'Only SFA-assessed additives permitted; verify against Food Regulations schedules.', unit:'', risk:'High', sourceTitle:'SFA food additive limits', sourceUrl:'https://www.sfa.gov.sg/regulatory-standards-frameworks-guidelines/food-safety-regulatory-limits/regulatory-limits-for-food-additives', notes:'Starter record. Run GitHub Action to update.' },
      { country:'Singapore', topic:'Contaminant Limits', foodCategory:'food sold in Singapore', parameter:'Contaminants / incidental constituents', limit:'Must comply with SFA regulatory limits.', unit:'', risk:'High', sourceTitle:'SFA contaminant limits', sourceUrl:'https://www.sfa.gov.sg/regulatory-standards-frameworks-guidelines/food-safety-regulatory-limits/regulatory-limits-for-contaminants-in-food', notes:'Starter record. Run GitHub Action to update.' },
      { country:'Codex', topic:'Additive Limits', foodCategory:'Codex categories', parameter:'GSFA additive provisions', limit:'Search by additive, functional class, or food category.', unit:'', risk:'Moderate', sourceTitle:'Codex GSFA Online', sourceUrl:'https://www.fao.org/fao-who-codexalimentarius/codex-texts/dbs/gsfa/en/', notes:'Use as international reference where local law is silent.' }
    ]
  };
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
  $('rulesBody').innerHTML = rules.map(r => `
    <tr>
      <td>${escapeHtml(r.country || '')}</td>
      <td>${escapeHtml(r.topic || '')}</td>
      <td>${escapeHtml(r.foodCategory || '')}</td>
      <td><strong>${escapeHtml(r.parameter || '')}</strong><br><span class="muted">${escapeHtml(r.notes || '')}</span></td>
      <td>${escapeHtml(r.limit || '')} ${escapeHtml(r.unit || '')}</td>
      <td><span class="badge ${escapeHtml(r.risk || 'Moderate')}">${escapeHtml(r.risk || 'Moderate')}</span></td>
      <td>${r.sourceUrl ? `<a href="${escapeAttr(r.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(r.sourceTitle || 'Source')}</a>` : escapeHtml(r.sourceTitle || '')}</td>
    </tr>`).join('');
}

function renderSummary(rules) {
  const topics = ['Additive Limits','Microbiology Limits','Contaminant Limits','Salt / Sodium Limits','Allergen List'];
  $('summaryGrid').innerHTML = topics.map(t => `<div class="metric"><span>${t}</span><strong>${rules.filter(r => r.topic === t).length}</strong></div>`).join('');
}

function runBasicCheck() {
  const input = $('productInput').value.toLowerCase();
  const countryMatch = complianceData.rules.filter(r => input.includes(String(r.country || '').toLowerCase()));
  const hits = (countryMatch.length ? countryMatch : complianceData.rules).filter(r => {
    const p = String(r.parameter || '').toLowerCase();
    const cat = String(r.foodCategory || '').toLowerCase();
    return input.includes(p) || input.includes(cat) || ['allergen','sodium','salt','additive','micro','contaminant'].some(k => input.includes(k) && JSON.stringify(r).toLowerCase().includes(k));
  }).slice(0, 20);
  $('checkOutput').textContent = hits.length ? hits.map(r => `- [${r.risk}] ${r.country} | ${r.topic} | ${r.parameter}: ${r.limit}\n  Source: ${r.sourceUrl || r.sourceTitle}`).join('\n') : 'No matching rule found. Add more precise product data or update sources.';
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(complianceData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'compliance.json' });
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(v){return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function escapeAttr(v){return escapeHtml(v).replace(/`/g,'');}
loadData();
