import React, { useState } from "react";
const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";

export default function App() {
  // Change this to real QB connection logic as needed
  const [qbConnected, setQBConnected] = useState(false);

  // All form state
  const [inputs, setInputs] = useState({
    total_invoices: 100,
    paid_invoices: 90,
    threshold_percent: 90,
    total_debt: 40000,
    total_income: 100000,
    dti_threshold_bp: 4000,
    dso: 44,
    dso_threshold: 45,
    ar_over60: 9000,
    ar_total: 100000,
    ar_pct_threshold_bp: 1000,
    revenue12mo: 121000,
    revenue_threshold: 120000,
    largest_cust_sales: 49999,
    total_sales: 100000,
    concentration_threshold_bp: 5000
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

  // Example QuickBooks connect simulation
  function handleQBConnect() {
    // TODO: Replace with real QB connect flow
    setQBConnected(true);
  }

  // Example: simulate disconnect
  function handleQBDisconnect() {
    setQBConnected(false);
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f5f8fa", minHeight: "100vh" }}>
      <div style={{
        maxWidth: 620, margin: "40px auto", background: "#fff", padding: 32,
        borderRadius: 18, boxShadow: "0 4px 20px #0001"
      }}>
        <h2 style={{ textAlign: "center" }}>🔒 FastPass Lending Score</h2>
        <div style={{textAlign: "center", color:"#888", fontSize: 16, marginBottom: 18}}>
          Automated, Tamper-Proof ZK Reports
        </div>
        {!qbConnected ? (
          <button onClick={handleQBConnect} style={connectBtnStyle}>
            Connect to QuickBooks
          </button>
        ) : (
          <button onClick={handleQBDisconnect} style={disconnectBtnStyle}>
            Disconnect QuickBooks
          </button>
        )}

        <form onSubmit={handleSubmit} style={{marginTop: 24}}>
          <Section title="1. Invoice Reliability">
            <SliderOrInput {...sliderConfig.total_invoices} qbConnected={qbConnected} value={inputs.total_invoices} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.paid_invoices} qbConnected={qbConnected} value={inputs.paid_invoices} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.threshold_percent} qbConnected={qbConnected} value={inputs.threshold_percent} onChange={handleChange}/>
          </Section>
          <Section title="2. Debt-to-Income Ratio">
            <SliderOrInput {...sliderConfig.total_debt} qbConnected={qbConnected} value={inputs.total_debt} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.total_income} qbConnected={qbConnected} value={inputs.total_income} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.dti_threshold_bp} qbConnected={qbConnected} value={inputs.dti_threshold_bp} onChange={handleChange}/>
          </Section>
          <Section title="3. Days Sales Outstanding (DSO)">
            <SliderOrInput {...sliderConfig.dso} qbConnected={qbConnected} value={inputs.dso} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.dso_threshold} qbConnected={qbConnected} value={inputs.dso_threshold} onChange={handleChange}/>
          </Section>
          <Section title="4. AR Aging Over 60 Days">
            <SliderOrInput {...sliderConfig.ar_over60} qbConnected={qbConnected} value={inputs.ar_over60} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.ar_total} qbConnected={qbConnected} value={inputs.ar_total} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.ar_pct_threshold_bp} qbConnected={qbConnected} value={inputs.ar_pct_threshold_bp} onChange={handleChange}/>
          </Section>
          <Section title="5. Revenue (12 months)">
            <SliderOrInput {...sliderConfig.revenue12mo} qbConnected={qbConnected} value={inputs.revenue12mo} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.revenue_threshold} qbConnected={qbConnected} value={inputs.revenue_threshold} onChange={handleChange}/>
          </Section>
          <Section title="6. Customer Concentration">
            <SliderOrInput {...sliderConfig.largest_cust_sales} qbConnected={qbConnected} value={inputs.largest_cust_sales} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.total_sales} qbConnected={qbConnected} value={inputs.total_sales} onChange={handleChange}/>
            <SliderOrInput {...sliderConfig.concentration_threshold_bp} qbConnected={qbConnected} value={inputs.concentration_threshold_bp} onChange={handleChange}/>
          </Section>

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

// --- Helpers ---

function Section({ title, children }) {
  return (
    <fieldset style={{ marginBottom: 18, padding: 14, borderRadius: 10, border: "1px solid #e7eaf0" }}>
      <legend style={{fontWeight:700, fontSize:15, color:"#476cd7"}}>{title}</legend>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
        {children}
      </div>
    </fieldset>
  );
}

function SliderOrInput({ label, min, max, step, unit, qbConnected, value, onChange, name }) {
  // Find field name by reverse-mapping label to sliderConfig key
  if (!name) {
    name = Object.entries(sliderConfig).find(([k, v]) => v.label === label)?.[0];
  }
  return (
    <label>
      {label}<br/>
      {qbConnected
        ? <input
            style={inputStyle}
            name={name}
            type="number"
            value={value}
            readOnly
          />
        : <input
            style={inputStyle}
            name={name}
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={onChange}
            step={step || 1}
          />
      }
      {!qbConnected &&
        <div style={{fontSize:12, color:"#999"}}>{value} {unit}</div>
      }
    </label>
  );
}

// --- Field Config ---

const sliderConfig = {
  total_invoices:           { label: "Total Invoices", min: 10, max: 200, step: 1, unit: "", name:"total_invoices" },
  paid_invoices:            { label: "Paid Invoices", min: 0, max: 200, step: 1, unit: "", name:"paid_invoices" },
  threshold_percent:        { label: "Reliability Threshold (%)", min: 50, max: 100, step: 1, unit: "%", name:"threshold_percent" },
  total_debt:               { label: "Total Debt", min: 0, max: 100000, step: 1000, unit: "$", name:"total_debt" },
  total_income:             { label: "Total Income", min: 0, max: 200000, step: 1000, unit: "$", name:"total_income" },
  dti_threshold_bp:         { label: "DTI Threshold (basis points)", min: 1000, max: 10000, step: 100, unit: "bp", name:"dti_threshold_bp" },
  dso:                      { label: "DSO", min: 10, max: 90, step: 1, unit: "days", name:"dso" },
  dso_threshold:            { label: "DSO Threshold", min: 10, max: 90, step: 1, unit: "days", name:"dso_threshold" },
  ar_over60:                { label: "AR Over 60", min: 0, max: 50000, step: 500, unit: "$", name:"ar_over60" },
  ar_total:                 { label: "AR Total", min: 0, max: 100000, step: 1000, unit: "$", name:"ar_total" },
  ar_pct_threshold_bp:      { label: "AR % Threshold (basis points)", min: 500, max: 5000, step: 100, unit: "bp", name:"ar_pct_threshold_bp" },
  revenue12mo:              { label: "12mo Revenue", min: 0, max: 300000, step: 1000, unit: "$", name:"revenue12mo" },
  revenue_threshold:        { label: "Revenue Threshold", min: 10000, max: 200000, step: 1000, unit: "$", name:"revenue_threshold" },
  largest_cust_sales:       { label: "Largest Customer Sales", min: 0, max: 150000, step: 1000, unit: "$", name:"largest_cust_sales" },
  total_sales:              { label: "Total Sales", min: 0, max: 300000, step: 1000, unit: "$", name:"total_sales" },
  concentration_threshold_bp: { label: "Concentration % Threshold (bp)", min: 1000, max: 10000, step: 100, unit: "bp", name:"concentration_threshold_bp" }
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

const connectBtnStyle = {
  width: "100%", padding: "10px 0", marginBottom: "14px", fontSize: 17,
  background: "#476cd7", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer"
};

const disconnectBtnStyle = {
  ...connectBtnStyle,
  background: "#e74c3c"
};
