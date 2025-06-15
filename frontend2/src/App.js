import React, { useState, useEffect } from "react";

const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";
// Add your QB endpoints as needed

export default function App() {
  // Expanded state for ALL 6 ZK checks
  const [inputs, setInputs] = useState({
    total_invoices: "",
    paid_invoices: "",
    threshold_percent: 90,
    total_debt: "",
    total_income: "",
    dti_threshold_bp: 4000,             // 40.00%
    dso: "",
    dso_threshold: 45,
    ar_over60: "",
    ar_total: "",
    ar_pct_threshold_bp: 1000,          // 10.00%
    revenue12mo: "",
    revenue_threshold: 120000,          // $120,000 (12mo)
    largest_cust_sales: "",
    total_sales: "",
    concentration_threshold_bp: 5000    // 50.00%
  });

  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);

  // === Update input fields ===
  function handleChange(e) {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  // === ZK Prove button handler ===
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setProof(null);
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inputs,
          total_invoices: Number(inputs.total_invoices),
          paid_invoices: Number(inputs.paid_invoices),
          threshold_percent: Number(inputs.threshold_percent),
          total_debt: Number(inputs.total_debt),
          total_income: Number(inputs.total_income),
          dti_threshold_bp: Number(inputs.dti_threshold_bp),
          dso: Number(inputs.dso),
          dso_threshold: Number(inputs.dso_threshold),
          ar_over60: Number(inputs.ar_over60),
          ar_total: Number(inputs.ar_total),
          ar_pct_threshold_bp: Number(inputs.ar_pct_threshold_bp),
          revenue12mo: Number(inputs.revenue12mo),
          revenue_threshold: Number(inputs.revenue_threshold),
          largest_cust_sales: Number(inputs.largest_cust_sales),
          total_sales: Number(inputs.total_sales),
          concentration_threshold_bp: Number(inputs.concentration_threshold_bp)
        })
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

  // === The UI ===
  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f5f8fa", minHeight: "100vh" }}>
      <div style={{
        maxWidth: 560, margin: "40px auto", background: "#fff", padding: 32,
        borderRadius: 18, boxShadow: "0 4px 20px #0001"
      }}>
        <h2 style={{ textAlign: "center" }}>🔒 FastPass Lending Score <br /><span style={{fontSize:18, color:"#999"}}>Automated, Tamper-Proof ZK Reports</span></h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {/* These can be made smarter with labels, QuickBooks integration, etc. */}
            <label>Total Invoices<br/>
              <input name="total_invoices" value={inputs.total_invoices} onChange={handleChange} type="number" min={1} required style={inputStyle} />
            </label>
            <label>Paid Invoices<br/>
              <input name="paid_invoices" value={inputs.paid_invoices} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>Reliability Threshold (%)<br/>
              <input name="threshold_percent" value={inputs.threshold_percent} onChange={handleChange} type="number" min={50} max={100} required style={inputStyle} />
            </label>
            <label>Total Debt<br/>
              <input name="total_debt" value={inputs.total_debt} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>Total Income<br/>
              <input name="total_income" value={inputs.total_income} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>DTI Threshold (bp)<br/>
              <input name="dti_threshold_bp" value={inputs.dti_threshold_bp} onChange={handleChange} type="number" min={0} max={10000} required style={inputStyle} />
            </label>
            <label>DSO<br/>
              <input name="dso" value={inputs.dso} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>DSO Threshold<br/>
              <input name="dso_threshold" value={inputs.dso_threshold} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>AR Over 60<br/>
              <input name="ar_over60" value={inputs.ar_over60} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>AR Total<br/>
              <input name="ar_total" value={inputs.ar_total} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>AR % Threshold (bp)<br/>
              <input name="ar_pct_threshold_bp" value={inputs.ar_pct_threshold_bp} onChange={handleChange} type="number" min={0} max={10000} required style={inputStyle} />
            </label>
            <label>12mo Revenue<br/>
              <input name="revenue12mo" value={inputs.revenue12mo} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>Revenue Threshold<br/>
              <input name="revenue_threshold" value={inputs.revenue_threshold} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>Largest Cust. Sales<br/>
              <input name="largest_cust_sales" value={inputs.largest_cust_sales} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>Total Sales<br/>
              <input name="total_sales" value={inputs.total_sales} onChange={handleChange} type="number" min={0} required style={inputStyle} />
            </label>
            <label>Concentration % Threshold (bp)<br/>
              <input name="concentration_threshold_bp" value={inputs.concentration_threshold_bp} onChange={handleChange} type="number" min={0} max={10000} required style={inputStyle} />
            </label>
          </div>
          <button disabled={loading} style={btnStyle}>
            {loading ? "Proving..." : "Generate ZK Scorecard"}
          </button>
        </form>

        {/* Proof Scorecard Result */}
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

// === Styles ===
const inputStyle = {
  width: "100%", margin: "4px 0 16px 0", padding: 8,
  border: "1px solid #bbb", borderRadius: 6, fontSize: 15
};

const btnStyle = {
  marginTop: 24,
  width: "100%", padding: "14px 0", fontSize: 18,
  background: "linear-gradient(90deg,#00c6ff,#0072ff)", color: "#fff",
  border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700
};
