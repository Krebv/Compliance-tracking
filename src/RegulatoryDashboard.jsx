export default function RegulatoryDashboard() {
  const countries = [
    "Singapore",
    "Malaysia",
    "Thailand",
    "Japan",
    "South Korea",
    "China",
    "United States",
    "Indonesia",
    "Taiwan",
    "India",
    "Vietnam",
    "Philippines",
    "GCC"
  ];

  const alerts = [
    {
      country: "EU",
      category: "Additives",
      severity: "High",
      title: "Titanium Dioxide Restriction Update",
      date: "2026-05-07"
    },
    {
      country: "US",
      category: "Allergens",
      severity: "Medium",
      title: "Sesame Labelling Clarification",
      date: "2026-05-06"
    },
    {
      country: "Japan",
      category: "Contaminants",
      severity: "Low",
      title: "Heavy Metal Monitoring Guidance",
      date: "2026-05-05"
    }
  ];

  const complianceData = [
    {
      country: "Singapore",
      additives: "Pass",
      microbiology: "Pass",
      contaminants: "Pass",
      allergens: "Review",
      salt: "Pass"
    },
    {
      country: "EU",
      additives: "Fail",
      microbiology: "Pass",
      contaminants: "Review",
      allergens: "Pass",
      salt: "Pass"
    },
    {
      country: "Japan",
      additives: "Pass",
      microbiology: "Pass",
      contaminants: "Review",
      allergens: "Pass",
      salt: "Pass"
    }
  ];

  const statusColor = (status) => {
    switch (status) {
      case "Pass":
        return "bg-green-100 text-green-700";
      case "Fail":
        return "bg-red-100 text-red-700";
      case "Review":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const severityColor = (severity) => {
    switch (severity) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-slate-900 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Regulatory Intelligence Dashboard
            </h1>
            <p className="text-slate-300 mt-1">
              Food Safety & Compliance Monitoring for Seasonings and Snacks
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-medium transition">
              Run Compliance Update
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-medium transition">
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <p className="text-sm text-slate-500">Tracked Countries</p>
            <h2 className="text-4xl font-bold mt-2">{countries.length}</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6">
            <p className="text-sm text-slate-500">High Risk Alerts</p>
            <h2 className="text-4xl font-bold mt-2 text-red-600">3</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6">
            <p className="text-sm text-slate-500">Last Sync</p>
            <h2 className="text-xl font-semibold mt-2">2026-05-07</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6">
            <p className="text-sm text-slate-500">AI Engine</p>
            <h2 className="text-xl font-semibold mt-2">
              Gemini 2.5 Flash
            </h2>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Compliance Matrix</h2>

              <input
                type="text"
                placeholder="Search country or regulation..."
                className="border border-slate-200 rounded-xl px-4 py-2 w-72"
              />
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3">Country</th>
                  <th>Additives</th>
                  <th>Microbiology</th>
                  <th>Contaminants</th>
                  <th>Allergens</th>
                  <th>Salt</th>
                </tr>
              </thead>

              <tbody>
                {complianceData.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-4 font-semibold">{row.country}</td>

                    {[
                      row.additives,
                      row.microbiology,
                      row.contaminants,
                      row.allergens,
                      row.salt
                    ].map((status, idx) => (
                      <td key={idx}>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Latest Alerts</h2>
              <span className="text-sm text-slate-500">Live</span>
            </div>

            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-2xl p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-500">
                      {alert.country}
                    </span>

                    <div
                      className={`w-3 h-3 rounded-full ${severityColor(alert.severity)}`}
                    />
                  </div>

                  <h3 className="font-bold text-lg leading-tight">
                    {alert.title}
                  </h3>

                  <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                    <span>{alert.category}</span>
                    <span>{alert.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {countries.map((country, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl shadow-sm p-5 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{country}</h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>

              <p className="text-sm text-slate-500 mt-3">
                Additives, contaminants, allergens, microbiology and sodium regulations monitoring.
              </p>

              <button className="mt-4 text-blue-600 font-medium hover:underline">
                View Details →
              </button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
