import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ROOT = new URL('../', import.meta.url);
const SOURCES_FILE = new URL('../data/sources.json', import.meta.url);
const COMPLIANCE_FILE = new URL('../data/compliance.json', import.meta.url);
const CHANGES_FILE = new URL('../data/changes.json', import.meta.url);
const ALERTS_FILE = new URL('../data/alerts.json', import.meta.url);
const HISTORY_DIR = new URL('../data/history/', import.meta.url);
const MAX_TEXT_PER_URL = Number(process.env.MAX_TEXT_PER_URL || 30000);
const MAX_URLS_PER_COUNTRY = Number(process.env.MAX_URLS_PER_COUNTRY || 6);

if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY. Add it in GitHub repo Settings > Secrets and variables > Actions.');
  process.exit(1);
}

await fs.mkdir(HISTORY_DIR, { recursive: true });
const sources = JSON.parse(await fs.readFile(SOURCES_FILE, 'utf8'));
validateSources(sources);
const previous = await readJsonIfExists(COMPLIANCE_FILE, { updatedAt: null, rules: [] });
const allRules = [];
const fetchLog = [];

for (const source of sources) {
  console.log(`\n=== Updating ${source.country} ===`);
  const urls = unique(source.urls || []).slice(0, MAX_URLS_PER_COUNTRY);
  const pages = [];
  for (const url of urls) {
    try {
      console.log(`Fetching ${url}`);
      const text = await fetchText(url);
      pages.push({ url, text: text.slice(0, MAX_TEXT_PER_URL) });
      fetchLog.push({ country: source.country, url, status: 'ok', characters: text.length });
    } catch (err) {
      console.warn(`Fetch error ${url}: ${err.message}`);
      pages.push({ url, text: `FETCH_ERROR: ${err.message}` });
      fetchLog.push({ country: source.country, url, status: 'error', error: err.message });
    }
  }

  try {
    const extracted = await extractRulesWithGemini(source, pages);
    allRules.push(...extracted);
    console.log(`Extracted ${extracted.length} rule(s) for ${source.country}`);
  } catch (err) {
    console.error(`Gemini extraction failed for ${source.country}: ${err.message}`);
    allRules.push(makeFailureRule(source, urls[0], err.message));
  }
}

const newCompliance = {
  updatedAt: new Date().toISOString(),
  model: MODEL,
  warning: 'AI-assisted monitoring. Verify against official legislation before product approval, export, label declaration, or customer compliance confirmation.',
  rules: dedupeRules(allRules),
  fetchLog
};

const changes = buildChanges(previous.rules || [], newCompliance.rules || []);
const aiSummary = await summarizeChangesWithGemini(changes, newCompliance.rules);
const alerts = buildAlerts(changes, newCompliance.rules);

await fs.writeFile(COMPLIANCE_FILE, JSON.stringify(newCompliance, null, 2));
await fs.writeFile(CHANGES_FILE, JSON.stringify({ updatedAt: newCompliance.updatedAt, summary: aiSummary, changes }, null, 2));
await fs.writeFile(ALERTS_FILE, JSON.stringify({ updatedAt: newCompliance.updatedAt, alerts }, null, 2));

const stamp = new Date().toISOString().slice(0, 10);
await fs.writeFile(new URL(`../data/history/compliance-${stamp}.json`, import.meta.url), JSON.stringify(newCompliance, null, 2));

console.log(`\nWrote ${newCompliance.rules.length} rules.`);
console.log(`Detected ${changes.length} change(s).`);
console.log(`Generated ${alerts.length} alert(s).`);

function validateSources(sources) {
  if (!Array.isArray(sources)) throw new Error('data/sources.json must be a JSON array.');
  for (const [i, s] of sources.entries()) {
    if (!s.country) throw new Error(`sources[${i}] missing country`);
    if (!s.authority) throw new Error(`sources[${i}] missing authority`);
    if (!Array.isArray(s.urls) || s.urls.length === 0) throw new Error(`sources[${i}] ${s.country} missing urls[]`);
  }
}

async function readJsonIfExists(fileUrl, fallback) {
  try { return JSON.parse(await fs.readFile(fileUrl, 'utf8')); }
  catch { return fallback; }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'FoodComplianceTracker/2.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const contentType = res.headers.get('content-type') || '';
  const buffer = Buffer.from(await res.arrayBuffer());
  const raw = buffer.toString('utf8');
  if (contentType.includes('text/html') || raw.includes('<html')) return stripHtml(raw);
  return raw.replace(/\s+/g, ' ').trim();
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractRulesWithGemini(source, pages) {
  const prompt = `You are a food regulatory compliance extraction assistant for seasoning and snack products.
Extract only clear rules from the provided official/regulatory source text. Do not invent numeric limits.
If the source only points to a regulation database/schedule, create a rule saying verification is required.
Focus on additive limits, microbiology limits, contaminant limits, salt/sodium limits, allergen declaration/list, and labelling warnings.
Return STRICT JSON only with this shape:
{"rules":[{"country":"","topic":"Additive Limits|Microbiology Limits|Contaminant Limits|Salt / Sodium Limits|Allergen List|Labelling Requirement","foodCategory":"","parameter":"","limit":"","unit":"","risk":"Low|Moderate|High","effectiveDate":"","sourceTitle":"","sourceUrl":"","notes":"","evidenceQuote":"short quote or phrase from the source text"}]}
Risk guide: High = legal limit/prohibition/mandatory allergen; Moderate = database/schedule must be checked or general requirement; Low = informational.
Country/region: ${source.country}
Authority: ${source.authority}
Food categories of interest: ${(source.foodCategories || []).join(', ')}

Sources:
${pages.map(p => `URL: ${p.url}\nTEXT:\n${p.text}`).join('\n\n---\n\n')}`;
  const parsed = await callGeminiJson(prompt);
  return (parsed.rules || []).map(r => normalizeRule(r, source));
}

async function summarizeChangesWithGemini(changes, rules) {
  if (!changes.length) return 'No material rule changes detected compared with the previous saved compliance snapshot.';
  const prompt = `Summarize the regulatory monitoring changes for a food seasoning/snack compliance dashboard. Be concise and practical. Mention high-risk changes first. Return JSON only: {"summary":"..."}\n\nChanges:\n${JSON.stringify(changes.slice(0, 80), null, 2)}\n\nCurrent high-risk rules:\n${JSON.stringify(rules.filter(r => r.risk === 'High').slice(0, 40), null, 2)}`;
  try {
    const parsed = await callGeminiJson(prompt);
    return parsed.summary || 'Changes detected. Review the dashboard change log.';
  } catch {
    return 'Changes detected. Review the dashboard change log.';
  }
}

async function callGeminiJson(prompt) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.05, responseMimeType: 'application/json' }
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text);
}

function normalizeRule(r, source) {
  const sourceUrl = r.sourceUrl || source.urls?.[0] || '';
  return {
    id: stableId([source.country, r.topic, r.foodCategory, r.parameter, r.limit, sourceUrl]),
    country: r.country || source.country,
    topic: normalizeTopic(r.topic),
    foodCategory: r.foodCategory || 'Not specified',
    parameter: r.parameter || 'Not specified',
    limit: r.limit || 'Check official source',
    unit: r.unit || '',
    risk: ['Low','Moderate','High'].includes(r.risk) ? r.risk : 'Moderate',
    effectiveDate: r.effectiveDate || '',
    sourceTitle: r.sourceTitle || source.authority,
    sourceUrl,
    notes: r.notes || '',
    evidenceQuote: r.evidenceQuote || ''
  };
}

function normalizeTopic(topic = '') {
  const allowed = ['Additive Limits','Microbiology Limits','Contaminant Limits','Salt / Sodium Limits','Allergen List','Labelling Requirement'];
  return allowed.includes(topic) ? topic : 'Labelling Requirement';
}

function makeFailureRule(source, sourceUrl, message) {
  return normalizeRule({
    topic: 'Labelling Requirement',
    foodCategory: 'Monitoring source',
    parameter: 'Source fetch / extraction issue',
    limit: 'Manual review required',
    risk: 'High',
    sourceUrl,
    notes: `Automated extraction failed: ${message}`
  }, source);
}

function buildChanges(oldRules, newRules) {
  const oldMap = new Map(oldRules.map(r => [ruleKey(r), r]));
  const newMap = new Map(newRules.map(r => [ruleKey(r), r]));
  const changes = [];
  for (const [key, nr] of newMap) {
    const or = oldMap.get(key);
    if (!or) {
      changes.push({ changeType: 'Added', severity: nr.risk || 'Moderate', country: nr.country, topic: nr.topic, parameter: nr.parameter, oldLimit: '', newLimit: nr.limit, sourceUrl: nr.sourceUrl, notes: nr.notes });
    } else {
      const diffs = [];
      for (const field of ['limit','unit','risk','effectiveDate','notes']) {
        if (String(or[field] || '') !== String(nr[field] || '')) diffs.push(field);
      }
      if (diffs.length) {
        changes.push({ changeType: 'Modified', severity: higherRisk(or.risk, nr.risk), country: nr.country, topic: nr.topic, parameter: nr.parameter, changedFields: diffs, oldLimit: or.limit || '', newLimit: nr.limit || '', sourceUrl: nr.sourceUrl, notes: nr.notes });
      }
    }
  }
  for (const [key, or] of oldMap) {
    if (!newMap.has(key)) {
      changes.push({ changeType: 'Removed', severity: 'Moderate', country: or.country, topic: or.topic, parameter: or.parameter, oldLimit: or.limit, newLimit: '', sourceUrl: or.sourceUrl, notes: 'Rule no longer appeared in the latest extraction. Verify whether source changed or extraction missed it.' });
    }
  }
  return changes.sort((a,b) => riskRank(b.severity)-riskRank(a.severity) || `${a.country}${a.topic}`.localeCompare(`${b.country}${b.topic}`));
}

function buildAlerts(changes, rules) {
  return changes
    .filter(c => c.severity === 'High' || ['Modified','Added','Removed'].includes(c.changeType))
    .slice(0, 80)
    .map(c => ({
      alertLevel: c.severity === 'High' ? 'High' : 'Moderate',
      title: `${c.changeType}: ${c.country} ${c.topic} - ${c.parameter}`,
      country: c.country,
      topic: c.topic,
      actionRequired: c.severity === 'High' ? 'Review impacted seasoning/snack formulations, labels, COAs and export approvals.' : 'Regulatory/QA review recommended.',
      sourceUrl: c.sourceUrl,
      details: `${c.oldLimit ? `Old: ${c.oldLimit}. ` : ''}${c.newLimit ? `New: ${c.newLimit}. ` : ''}${c.notes || ''}`
    }));
}

function ruleKey(r) {
  return [r.country, r.topic, r.foodCategory, r.parameter, r.sourceUrl].map(v => String(v || '').trim().toLowerCase()).join('|');
}
function stableId(parts) { return crypto.createHash('sha1').update(parts.join('|').toLowerCase()).digest('hex').slice(0, 16); }
function dedupeRules(rules) {
  const seen = new Set();
  return rules.filter(r => {
    const key = ruleKey(r) + '|' + String(r.limit || '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).sort((a,b) => `${a.country}${a.topic}${a.parameter}`.localeCompare(`${b.country}${b.topic}${b.parameter}`));
}
function unique(arr) { return [...new Set(arr.filter(Boolean))]; }
function riskRank(r) { return ({ Low: 1, Moderate: 2, High: 3 })[r] || 2; }
function higherRisk(a, b) { return riskRank(a) >= riskRank(b) ? (a || 'Moderate') : (b || 'Moderate'); }
