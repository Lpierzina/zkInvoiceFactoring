import React, { useState } from "react";
const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";

export default function App() {
  // True = simulate QB connection
  const [qbConnected, setQBConnected] = useState(false);

  // Default values set to "just passing"
  const [inputs, setInputs] = useState({
    total_invoices: 100,
    paid_invoices: 90,
    threshold_percent: 90,
    total_debt: 40000,
    total_income: 100000,
    dti_threshold_bp: 4000,          // 40.00%
    dso: 44,
    dso_threshold: 45,
    ar_over60: 9000,
    ar_total: 100000,
    ar_pct_threshold_bp: 1000,       // 10.00%
    revenue12mo: 121000,
    revenue_threshold: 120000,
    largest_cust_sales: 49999,
    total_sales: 100000,
    concentration_threshold_bp: 5000 // 50.00%
  });

  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);

  // Handle slider/input changes
  function handleChange(e) {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: Number(e.target.value)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setProof(null);
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProof(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // For demo: toggle connection (remove in prod)
  function toggleQB() { setQBConnected(x => !x); }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f5f8fa", minHeight: "100vh" }}>
      <div style={{
        maxWidth: 560, margin: "40px auto", background: "#fff", padding: 32,
        borderRadius: 18, boxShadow: "0 4px 20px #0001"
      }}>
        <h2 style={{ textAlign: "center" }}>🔒 FastPass Lending Score <br /><span style={{fontSize:18, color:"#999"}}>Automated, Tamper-Proof ZK Reports</span></h2>

        {/* Demo: toggle QB connection */}
        <button style={{float:"right",marginBottom:8}} onClick={toggleQB}>
          {qbConnected ? "Simulate Manual Mode" : "Simulate QuickBooks Connected"}
        </button>

        <form onSubmit={handleSubmit}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {Object.entries(sliderConfig).map(([key, config]) => (
              <label key={key}>{config.label}<br/>
                {qbConnected
                  ? <input
                      style={inputStyle}
                      name={key}
                      type="number"
                      value={inputs[key]}
                      readOnly
                    />
                  : <input
                      style={inputStyle}
                      name={key}
                      type="range"
                      min={config.min}
                      max={config.max}
                      value={inputs[key]}
                      onChange={handleChange}
                      step={config.step || 1}
                    />
                }
                {!qbConnected &&
                  <div style={{fontSize:12, color:"#999"}}>
                    {inputs[key]} {config.unit}
                  </div>
                }
              </label>
            ))}
          </div>
          <button disabled={loading} style={btnStyle}>
            {loading ? "Proving..." : "Generate ZK Scorecard"}
          </button>
        </form>

        {/* Scorecard */}
        {proof && (
          <div style={{ marginTop: 32, background: "#f5fff0", borderRadius: 14, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>📋 ZK Lender Scorecard</h3>
            <ul style={{ listStyle: "none", padding: 0, fontSize: 15 }}>
              {proof.criteria.map((c) => (
                <li key={c.key} style={{ marginBottom: 18, display: "flex", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, marginRight: 10 }}>{c.label}:</span>
                  {c.pass
                    ? <span style={{ color: "#14b314", fontWeight: 600, fontSize: 18, marginRight: 6 }}>✅</span>
                    : <span style={{ color: "#d31717", fontWeight: 600, fontSize: 18, marginRight: 6 }}>❌</span>
                  }
                  <span style={{ color: "#444", fontSize: 14 }}>{c.explanation}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 18, fontWeight: 600, fontSize: 16, textAlign: "center" }}>
              {proof.overallPass === true && "✅ Passes All Lender Criteria"}
              {proof.overallPass === false && "⚠️ Fails One or More Lender Checks"}
              {proof.overallPass == null && "— Not Enough Data to Score"}
            </div>
            <details style={{marginTop: 12}}>
              <summary>Show ZK Proof Output</summary>
              <pre style={{
                background: "#eee", padding: 8, borderRadius: 6, fontSize: 13, overflowX: "auto"
              }}>{proof.nargoOutput}</pre>
            </details>
          </div>
        )}
        {error && <div style={{ color: "#d31717", marginTop: 18 }}>{error}</div>}
        <div style={{ marginTop: 32, fontSize: 13, color: "#888" }}>
          <hr />
          <div style={{ textAlign: "center" }}>
            Powered by Noir ZK circuits &bull; MyLockChain.io
          </div>
        </div>
      </div>
    </div>
  );
}

// Slider configs: label, min, max, step, unit (for display)
const sliderConfig = {
  total_invoices:           { label: "Total Invoices", min: 10, max: 200, step: 1, unit: "" },
  paid_invoices:            { label: "Paid Invoices", min: 0, max: 200, step: 1, unit: "" },
  threshold_percent:        { label: "Reliability Threshold (%)", min: 50, max: 100, step: 1, unit: "%" },
  total_debt:               { label: "Total Debt", min: 0, max: 100000, step: 1000, unit: "$" },
  total_income:             { label: "Total Income", min: 0, max: 200000, step: 1000, unit: "$" },
  dti_threshold_bp:         { label: "DTI Threshold (basis points)", min: 1000, max: 10000, step: 100, unit: "bp" },
  dso:                      { label: "DSO", min: 10, max: 90, step: 1, unit: "days" },
  dso_threshold:            { label: "DSO Threshold", min: 10, max: 90, step: 1, unit: "days" },
  ar_over60:                { label: "AR Over 60", min: 0, max: 50000, step: 500, unit: "$" },
  ar_total:                 { label: "AR Total", min: 0, max: 100000, step: 1000, unit: "$" },
  ar_pct_threshold_bp:      { label: "AR % Threshold (basis points)", min: 500, max: 5000, step: 100, unit: "bp" },
  revenue12mo:              { label: "12mo Revenue", min: 0, max: 300000, step: 1000, unit: "$" },
  revenue_threshold:        { label: "Revenue Threshold", min: 10000, max: 200000, step: 1000, unit: "$" },
  largest_cust_sales:       { label: "Largest Customer Sales", min: 0, max: 150000, step: 1000, unit: "$" },
  total_sales:              { label: "Total Sales", min: 0, max: 300000, step: 1000, unit: "$" },
  concentration_threshold_bp: { label: "Concentration % Threshold (bp)", min: 1000, max: 10000, step: 100, unit: "bp" }
};

const inputStyle = {
  width: "100%", margin: "4px 0 8px 0", padding: 8,
  border: "1px solid #bbb", borderRadius: 6, fontSize: 15
};
const btnStyle = {
  marginTop: 24,
  width: "100%", padding: "14px 0", fontSize: 18,
  background: "linear-gradient(90deg,#00c6ff,#0072ff)", color: "#fff",
  border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700
};
