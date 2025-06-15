import React, { useState } from "react";
const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";

const defaultInputs = {
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
};

const testKeys = [
  { key: "reliable", label: "Invoice Reliability" },
  { key: "dti", label: "Debt-to-Income Ratio" },
  { key: "dso", label: "Days Sales Outstanding" },
  { key: "ar_aging", label: "AR Aging > 60 Days" },
  { key: "revenue", label: "12mo Revenue" },
  { key: "concentration", label: "Customer Concentration" },
];

export default function App() {
  const [qbConnected, setQBConnected] = useState(false);
  const [inputs, setInputs] = useState({ ...defaultInputs });
  const [testResults, setTestResults] = useState([1,1,1,1,1,1]); // default to "just pass"
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Map backend proof results if available
  React.useEffect(() => {
    if (proof && proof.proof) {
      setTestResults(proof.proof.map(v => v ? 1 : 0));
    }
  }, [proof]);

  function handleInputChange(e) {
    setInputs(prev => ({
      ...prev,
      [e.target.name]: Number(e.target.value)
    }));
  }

  function handleTestSlider(idx, v) {
    let newArr = [...testResults];
    newArr[idx] = Number(v);
    setTestResults(newArr);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProof(null);
    try {
      // In manual mode, send the "forced" test results as proof
      let body = { ...inputs };
      if (!qbConnected) {
        // Send to backend as "manual" proof
        body.manual_proof = testResults.map(x => !!x);
      }
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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

  function handleQBConnect() {
    // Replace with real logic
    setQBConnected(true);
    setInputs({ ...defaultInputs }); // TODO: fetch from QB backend
    setProof(null);
    setTestResults([1,1,1,1,1,1]);
  }
  function handleQBDisconnect() {
    setQBConnected(false);
    setProof(null);
    setTestResults([1,1,1,1,1,1]);
  }

  function fillExample() {
    setInputs({ ...defaultInputs });
    setTestResults([1,1,1,1,1,1]);
    setProof(null);
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f5f8fa", minHeight: "100vh" }}>
      <div style={{
        maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32,
        borderRadius: 18, boxShadow: "0 4px 20px #0001"
      }}>
        <h2 style={{ textAlign: "center" }}>🔒 FastPass Lending Score</h2>
        <div style={{textAlign: "center", color:"#888", fontSize: 16, marginBottom: 18}}>
          Automated, Tamper-Proof ZK Reports
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          {!qbConnected ? (
            <button onClick={handleQBConnect} style={connectBtnStyle}>
              Connect to QuickBooks
            </button>
          ) : (
            <button onClick={handleQBDisconnect} style={disconnectBtnStyle}>
              Disconnect QuickBooks
            </button>
          )}
          <button onClick={fillExample} style={fillBtnStyle}>
            Fill Example Data
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {testKeys.map((test, idx) => (
            <fieldset key={test.key} style={fieldsetStyle}>
              <legend style={legendStyle}>{test.label}</legend>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {/* Show variable inputs always */}
                {getFieldsForTest(test.key).map(f =>
                  <label key={f.name}>
                    {f.label}<br/>
                    <input
                      style={inputStyle}
                      name={f.name}
                      value={inputs[f.name]}
                      type="number"
                      min={f.min}
                      max={f.max}
                      onChange={handleInputChange}
                      disabled={qbConnected} // QB disables inputs, show as readonly
                    />
                  </label>
                )}
                <label>
                  <div style={{marginBottom:4,fontWeight:600}}>Pass/Fail</div>
                  {qbConnected
                    ? <input type="checkbox" checked={!!(proof && proof.proof ? proof.proof[idx] : testResults[idx])} readOnly />
                    : (
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={1}
                        value={testResults[idx]}
                        onChange={e => handleTestSlider(idx, e.target.value)}
                        style={{width:"100%"}}
                      />
                    )
                  }
                  <div style={{fontSize:12,color:"#888"}}>
                    {!qbConnected
                      ? (testResults[idx] ? "✅ Pass" : "❌ Fail")
                      : (proof && proof.criteria ? (proof.criteria[idx].pass ? "✅ Pass" : "❌ Fail") : "")
                    }
                  </div>
                </label>
              </div>
            </fieldset>
          ))}

          <button disabled={loading} style={btnStyle}>
            {loading ? "Proving..." : "Generate ZK Scorecard"}
          </button>
        </form>

        {proof && (
          <div style={{ marginTop: 32, background: "#f5fff0", borderRadius: 14, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>📋 ZK Lender Scorecard</h3>
            <ul style={{ listStyle: "none", padding: 0, fontSize: 15 }}>
              {proof.criteria.map((c, i) => (
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

// Helper to get the right variable fields for each test
function getFieldsForTest(key) {
  switch (key) {
    case "reliable":
      return [
        { name: "total_invoices", label: "Total Invoices", min: 0 },
        { name: "paid_invoices", label: "Paid Invoices", min: 0 },
        { name: "threshold_percent", label: "Reliability Threshold (%)", min: 50, max: 100 },
      ];
    case "dti":
      return [
        { name: "total_debt", label: "Total Debt", min: 0 },
        { name: "total_income", label: "Total Income", min: 0 },
        { name: "dti_threshold_bp", label: "DTI Threshold (bp)", min: 0, max: 10000 }
      ];
    case "dso":
      return [
        { name: "dso", label: "DSO", min: 0 },
        { name: "dso_threshold", label: "DSO Threshold", min: 0 }
      ];
    case "ar_aging":
      return [
        { name: "ar_over60", label: "AR Over 60", min: 0 },
        { name: "ar_total", label: "AR Total", min: 0 },
        { name: "ar_pct_threshold_bp", label: "AR % Threshold (bp)", min: 0, max: 10000 }
      ];
    case "revenue":
      return [
        { name: "revenue12mo", label: "12mo Revenue", min: 0 },
        { name: "revenue_threshold", label: "Revenue Threshold", min: 0 }
      ];
    case "concentration":
      return [
        { name: "largest_cust_sales", label: "Largest Customer Sales", min: 0 },
        { name: "total_sales", label: "Total Sales", min: 0 },
        { name: "concentration_threshold_bp", label: "Concentration % Threshold (bp)", min: 0, max: 10000 }
      ];
    default:
      return [];
  }
}

// ---- Styles ----

const fieldsetStyle = {
  marginBottom: 16, padding: 14, borderRadius: 10, border: "1px solid #e7eaf0"
};
const legendStyle = { fontWeight: 700, fontSize: 15, color: "#476cd7" };
const inputStyle = {
  width: "100%", margin: "4px 0 8px 0", padding: 8,
  border: "1px solid #bbb", borderRadius: 6, fontSize: 15
};
const btnStyle = {
  marginTop: 24, width: "100%", padding: "14px 0", fontSize: 18,
  background: "linear-gradient(90deg,#00c6ff,#0072ff)", color: "#fff",
  border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700
};
const connectBtnStyle = {
  width: "47%", padding: "10px 0", fontSize: 17,
  background: "#476cd7", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer"
};
const disconnectBtnStyle = {
  ...connectBtnStyle,
  background: "#e74c3c"
};
const fillBtnStyle = {
  width: "47%", padding: "10px 0", fontSize: 17,
  background: "#eee", color: "#222", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer"
};
