import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Database,
  FileSearch,
  Globe2,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  XCircle
} from "lucide-react";

const countries = [
  { name: "Singapore", region: "ASEAN", status: "Pass", risk: "Low", updated: "Today", sources: 3 },
  { name: "Thailand", region: "ASEAN", status: "Review", risk: "Medium", updated: "Today", sources: 1 },
  { name: "South Korea", region: "Asia", status: "Review", risk: "Medium", updated: "Today", sources: 2 },
  { name: "Japan", region: "Asia", status: "Pass", risk: "Low", updated: "Today", sources: 2 },
  { name: "India", region: "Asia", status: "Review", risk: "Medium", updated: "Today", sources: 2 },
  { name: "United States", region: "Americas", status: "Pass", risk: "Low", updated: "Today", sources: 4 },
  { name: "China", region: "Asia", status: "Review", risk: "High", updated: "Today", sources: 2 },
  { name: "Indonesia", region: "ASEAN", status: "Review", risk: "Medium", updated: "Today", sources: 2 },
  { name: "Taiwan", region: "Asia", status: "Pass", risk: "Low", updated: "Today", sources: 3 },
  { name: "Philippines", region: "ASEAN", status: "Pass", risk: "Low", updated: "Today", sources: 3 },
  { name: "Vietnam", region: "ASEAN", status: "Review", risk: "Medium", updated: "Today", sources: 2 },
  { name: "GCC", region: "Middle East", status: "Review", risk: "Medium", updated: "Today", sources: 2 }
];

const alerts = [
  {
    title: "Possible additive limit update detected",
    country: "China",
    category: "Additives",
    severity: "High",
    detail: "AI detected possible revision or source change. Human verification required before use."
  },
  {
    title: "Microbiological criteria source checked",
    country: "Philippines",
    category: "Microbiology",
    severity: "Medium",
    detail: "Circular source available. Confirm product category mapping for snacks and seasonings."
  },
  {
    title: "Allergen labelling source verified",
    country: "Taiwan",
    category: "Allergens",
    severity: "Low",
    detail: "Allergen source is reachable and included in daily monitoring."
  }
];

const categories = [
  { label: "Additives", count: 42, status: "Active" },
  { label: "Microbiology", count: 18, status: "Active" },
  { label: "Contaminants", count: 27, status: "Active" },
  { label: "Allergens", count: 14, status: "Active" },
  { label: "Salt / Sodium", count: 9, status: "Review" }
];

function StatusBadge({ value }) {
  return <span className={`badge ${value.toLowerCase()}`}>{value}</span>;
}

function RiskPill({ value }) {
  return <span className={`risk ${value.toLowerCase()}`}>{value}</span>;
}

function SeverityIcon({ value }) {
  if (value === "High") return <XCircle className="severity high" />;
  if (value === "Medium") return <AlertTriangle className="severity medium" />;
  return <CheckCircle2 className="severity low" />;
}

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={24} /></div>
          <div>
            <strong>FoodReg AI</strong>
            <span>Compliance Monitor</span>
          </div>
        </div>

        <nav className="nav">
          <a className="active"><LayoutDashboard size={18} /> Dashboard</a>
          <a><Globe2 size={18} /> Countries</a>
          <a><Database size={18} /> Regulations</a>
          <a><Bell size={18} /> Alerts</a>
          <a><FileSearch size={18} /> Source Review</a>
        </nav>

        <div className="sidebar-card">
          <p>AI Engine</p>
          <strong>Gemini 2.5 Flash</strong>
          <span>Daily regulatory monitoring enabled</span>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Regulatory Intelligence</p>
            <h1>Food Safety Compliance Dashboard</h1>
            <p className="subtitle">Track additive limits, microbiology limits, contaminants, allergens and sodium requirements across export markets.</p>
          </div>

          <div className="topbar-actions">
            <button className="ghost"><CalendarClock size={17} /> Last updated today</button>
            <button className="primary"><RefreshCw size={17} /> Run update</button>
          </div>
        </header>

        <section className="metrics">
          <div className="metric-card accent-blue">
            <span>Tracked Markets</span>
            <strong>{countries.length}</strong>
            <small>Active country sources</small>
          </div>
          <div className="metric-card accent-red">
            <span>High Risk Items</span>
            <strong>1</strong>
            <small>Require verification</small>
          </div>
          <div className="metric-card accent-amber">
            <span>Review Required</span>
            <strong>7</strong>
            <small>Category mapping needed</small>
          </div>
          <div className="metric-card accent-green">
            <span>Verified Sources</span>
            <strong>31</strong>
            <small>Official / regulatory links</small>
          </div>
        </section>

        <section className="category-strip">
          {categories.map((item) => (
            <div className="category-card" key={item.label}>
              <div>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
              <StatusBadge value={item.status} />
            </div>
          ))}
        </section>

        <section className="main-grid">
          <div className="panel large-panel">
            <div className="panel-head">
              <div>
                <h2>Country Compliance Matrix</h2>
                <p>Operational view for seasoning, snack seasoning and ready-to-eat snack regulatory checks.</p>
              </div>
              <div className="filter-box">
                <Search size={17} />
                <input placeholder="Search country, region or status" />
                <SlidersHorizontal size={17} />
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Country / Market</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>Sources</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country) => (
                    <tr key={country.name}>
                      <td><strong>{country.name}</strong></td>
                      <td>{country.region}</td>
                      <td><StatusBadge value={country.status} /></td>
                      <td><RiskPill value={country.risk} /></td>
                      <td>{country.sources} links</td>
                      <td>{country.updated}</td>
                      <td><ChevronRight size={18} className="chevron" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel alert-panel">
            <div className="panel-head compact">
              <div>
                <h2>Latest AI Alerts</h2>
                <p>Changes detected from official sources.</p>
              </div>
            </div>

            <div className="alert-list">
              {alerts.map((alert) => (
                <article className="alert-card" key={alert.title}>
                  <div className="alert-title-row">
                    <SeverityIcon value={alert.severity} />
                    <div>
                      <h3>{alert.title}</h3>
                      <span>{alert.country} · {alert.category}</span>
                    </div>
                  </div>
                  <p>{alert.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel source-panel">
          <div className="panel-head">
            <div>
              <h2>Recommended Review Workflow</h2>
              <p>Use AI for monitoring and extraction, but keep final approval under QA / Regulatory review.</p>
            </div>
          </div>

          <div className="workflow-grid">
            <div><span>01</span><strong>Daily source scan</strong><p>Official regulator pages and PDFs are checked by GitHub Actions.</p></div>
            <div><span>02</span><strong>AI extraction</strong><p>Gemini extracts limits, allergens, contaminants and microbiology rules.</p></div>
            <div><span>03</span><strong>Change detection</strong><p>New, removed and modified clauses are compared against previous snapshots.</p></div>
            <div><span>04</span><strong>Human approval</strong><p>High-risk items should be verified before use for customer or export decisions.</p></div>
          </div>
        </section>
      </main>
    </div>
  );
}
