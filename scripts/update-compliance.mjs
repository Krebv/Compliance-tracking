import fs from 'node:fs/promises';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const SOURCES_FILE = new URL('../data/sources.json', import.meta.url);
const OUTPUT_FILE = new URL('../data/compliance.json', import.meta.url);

if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY. Add it in GitHub repo Settings > Secrets and variables > Actions.');
  process.exit(1);
}

const sources = JSON.parse(await fs.readFile(SOURCES_FILE, 'utf8'));
const allRules = [];

for (const source of sources) {
  console.log(`Updating ${source.country}...`);
  const pages = [];
  for (const url of source.urls) {
    try {
      const text = await fetchText(url);
      pages.push({ url, text: text.slice(0, 45000) });
    } catch (err) {
      pages.push({ url, text: `FETCH_ERROR: ${err.message}` });
    }
  }
  const extracted = await extractRulesWithGemini(source, pages);
  allRules.push(...extracted);
}

const output = {
  updatedAt: new Date().toISOString(),
  model: MODEL,
  warning: 'AI-assisted extraction. Verify against official legislation before product approval, export, or customer declaration.',
  rules: dedupeRules(allRules)
};

await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`Wrote ${output.rules.length} rules to data/compliance.json`);

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'FoodComplianceTracker/1.0' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const contentType = res.headers.get('content-type') || '';
  const raw = await res.text();
  if (contentType.includes('text/html')) return stripHtml(raw);
  return raw.replace(/\s+/g, ' ').trim();
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractRulesWithGemini(source, pages) {
  const prompt = `You are a food regulatory compliance extraction assistant for seasoning and snack products.
Extract only clear rules from the provided official/regulatory source text. Do not invent numeric limits.
If a source only states that a database/schedule must be checked, create a rule saying verification is required.
Focus on: additive limits, microbiology limits, contaminant limits, salt/sodium limits, allergen list/labeling.
Return STRICT JSON only with this shape:
{"rules":[{"country":"","topic":"Additive Limits|Microbiology Limits|Contaminant Limits|Salt / Sodium Limits|Allergen List","foodCategory":"","parameter":"","limit":"","unit":"","risk":"Low|Moderate|High","sourceTitle":"","sourceUrl":"","notes":""}]}
Country/region: ${source.country}
Authority: ${source.authority}
Food categories of interest: ${source.foodCategories.join(', ')}

Sources:
${pages.map(p => `URL: ${p.url}\nTEXT:\n${p.text}`).join('\n\n---\n\n')}`;

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
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '{"rules":[]}';
  const parsed = JSON.parse(text);
  return (parsed.rules || []).map(r => ({
    country: r.country || source.country,
    topic: normalizeTopic(r.topic),
    foodCategory: r.foodCategory || 'Not specified',
    parameter: r.parameter || 'Not specified',
    limit: r.limit || 'Check official source',
    unit: r.unit || '',
    risk: ['Low','Moderate','High'].includes(r.risk) ? r.risk : 'Moderate',
    sourceTitle: r.sourceTitle || source.authority,
    sourceUrl: r.sourceUrl || source.urls[0],
    notes: r.notes || ''
  }));
}

function normalizeTopic(topic = '') {
  const allowed = ['Additive Limits','Microbiology Limits','Contaminant Limits','Salt / Sodium Limits','Allergen List'];
  return allowed.includes(topic) ? topic : 'Additive Limits';
}

function dedupeRules(rules) {
  const seen = new Set();
  return rules.filter(r => {
    const key = [r.country, r.topic, r.foodCategory, r.parameter, r.limit].join('|').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a,b) => `${a.country}${a.topic}${a.parameter}`.localeCompare(`${b.country}${b.topic}${b.parameter}`));
}
