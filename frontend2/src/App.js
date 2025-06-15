import React, { useState} from "react";

const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";



export default function App() {
  const [inputs, setInputs] = useState({
    total_invoices: "",
    paid_invoices: "",
    threshold_percent: 90,
    total_debt: "",
    total_income: "",
    dti_threshold_bp: 4000,
    dso: "",
    dso_threshold: 45,
    ar_over60: "",
    ar_total: "",
    ar_pct_threshold_bp: 1000,
    revenue12mo: "",
    revenue_threshold: 120000,
    largest_cust_sales: "",
    total_sales: "",
    concentration_threshold_bp: 5000
  });

  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);
  const [manualMode, setManualMode] = useState(true);

  // Update input fields
  function handleChange(e) {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  // Manual logic for lender score
  function calculateManualScorecard(values) {
    const total_invoices = Number(values.total_invoices);
    const paid_invoices = Number(values.paid_invoices);
    const threshold_percent = Number(values.threshold_percent);
    const total_debt = Number(values.total_debt);
    const total_income = Number(values.total_income);
    const dti_threshold_bp = Number(values.dti_threshold_bp);
    const dso = Number(values.dso);
    const dso_threshold = Number(values.dso_threshold);
    const ar_over60 = Number(values.ar_over60);
    const ar_total = Number(values.ar_total);
    const ar_pct_threshold_bp = Number(values.ar_pct_threshold_bp);
    const revenue12mo = Number(values.revenue12mo);
    const revenue_threshold = Number(values.revenue_threshold);
    const largest_cust_sales = Number(values.largest_cust_sales);
    const total_sales = Number(values.total_sales);
    const concentration_threshold_bp = Number(values.concentration_threshold_bp);

    // Checks
    const pctPaid = total_invoices > 0 ? (paid_invoices / total_invoices) * 100 : 0;
    const reliable = pctPaid >= threshold_percent;
    const dti = total_income > 0 ? (total_debt / total_income) * 10000 : 0; // basis points
    const dtiPass = dti <= dti_threshold_bp;
    const dsoPass = dso <= dso_threshold;
    const ar_pct = ar_total > 0 ? (ar_over60 / ar_total) * 10000 : 0;
    const arAgingPass = ar_pct <= ar_pct_threshold_bp;
    const revenuePass = revenue12mo >= revenue_threshold;
    const concentration = total_sales > 0 ? (largest_cust_sales / total_sales) * 10000 : 0;
    const concentrationPass = concentration <= concentration_threshold_bp;

    // Explanation
    const criteria = [
      {
        key: "reliable",
        label: "Invoice Reliability",
        pass: reliable,
        explanation: reliable
          ? "Paid invoices meet threshold."
          : "Paid invoices below threshold."
      },
      {
        key: "dti",
        label: "Debt-to-Income",
        pass: dtiPass,
        explanation: dtiPass
          ? "DTI ratio is within safe bounds."
          : "DTI ratio is too high."
      },
      {
        key: "dso",
        label: "DSO",
        pass: dsoPass,
        explanation: dsoPass
          ? "DSO is within range."
          : "DSO is too high."
      },
      {
        key: "ar_aging",
        label: "AR > 60 Days",
        pass: arAgingPass,
        explanation: arAgingPass
          ? "AR aging is acceptable."
          : "AR aging is too high."
      },
      {
        key: "revenue",
        label: "12mo Revenue",
        pass: revenuePass,
        explanation: revenuePass
          ? "Revenue meets threshold."
          : "Revenue below threshold."
      },
      {
        key: "concentration",
        label: "Customer Concentration",
        pass: concentrationPass,
        explanation: concentrationPass
          ? "Customer concentration is safe."
          : "Customer concentration too high."
      }
    ];
    const overallPass = criteria.every((c) => c.pass === true);

    return { proof: criteria.map(c => !!c.pass), criteria, overallPass };
  }

  // Form handler
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setProof(null);

    if (manualMode) {
      // Local score, no backend call!
      const localScore = calculateManualScorecard(inputs);
      setProof({ ...localScore, nargoOutput: "Local JS calculation (no ZK proof)" });
      setLoading(false);
      return;
    }

    // Call backend for ZK/connected mode
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
        
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
          <label style={{fontSize:14}}>
            <input
              type="checkbox"
              checked={!manualMode}
              onChange={e => setManualMode(!e.target.checked)}
              style={{marginRight:7}}
            />
            Connect to QuickBooks (ZK Proof)
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {/* Input fields */}
            {Object.entries(inputs).map(([key, value]) => (
              <label key={key}>
                {fieldLabels[key] || key}
                <br />
                <input
                  name={key}
                  value={value}
                  onChange={handleChange}
                  type="number"
                  min={0}
                  required
                  style={inputStyle}
                />
              </label>
            ))}
          </div>
          <button disabled={loading} style={btnStyle}>
            {loading ? "Scoring..." : manualMode ? "Score (Free)" : "Generate ZK Scorecard"}
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
              <summary>Show Score Output</summary>
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

// --- Field Labels ---
const fieldLabels = {
  total_invoices: "Total Invoices",
  paid_invoices: "Paid Invoices",
  threshold_percent: "Reliability Threshold (%)",
  total_debt: "Total Debt",
  total_income: "Total Income",
  dti_threshold_bp: "DTI Threshold (bp)",
  dso: "DSO",
  dso_threshold: "DSO Threshold",
  ar_over60: "AR Over 60",
  ar_total: "AR Total",
  ar_pct_threshold_bp: "AR % Threshold (bp)",
  revenue12mo: "12mo Revenue",
  revenue_threshold: "Revenue Threshold",
  largest_cust_sales: "Largest Cust. Sales",
  total_sales: "Total Sales",
  concentration_threshold_bp: "Concentration % Threshold (bp)"
};

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
