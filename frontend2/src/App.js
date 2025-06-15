import React, { useState, useEffect } from "react";

const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";
const QB_CONNECT_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/connect";
const QB_STATUS_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/status";
const QB_SUMMARY_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/invoice-summary";
const QB_FINANCIAL_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/financial-summary";

export default function App() {
  // App state
 const [inputs, setInputs] = useState({
  total_invoices: "",
  paid_invoices: "",
  threshold_percent: 90,   // 1. Reliability

  total_debt: "",
  total_income: "",
  dti_threshold_bp: 4000,  // 2. DTI (default 40.00%)

  dso: "",
  dso_threshold: 45,       // 3. DSO (default 45)

  ar_over60: "",
  ar_total: "",
  ar_pct_threshold_bp: 1000, // 4. AR Aging (default 10%)

  revenue12mo: "",
  revenue_threshold: 120000, // 5. Revenue (default $120k)

  largest_cust_sales: "",
  total_sales: "",
  concentration_threshold_bp: 5000 // 6. Concentration (default 50%)
});

  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);
  const [qbConnected, setQBConnected] = useState(false);
  const [scorecard, setScorecard] = useState(null);


  // DTI state
  const [dti, setDti] = useState(null);
  const [dtiPassed, setDtiPassed] = useState(null);

  // Check QuickBooks connection when app loads and after OAuth popup
  useEffect(() => {
    checkQBConnection();
    const handler = (event) => {
      if (event.data === "quickbooks_connected") {
        checkQBConnection();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line
  }, []);

  async function checkQBConnection() {
    try {
      const res = await fetch(QB_STATUS_URL);
      const data = await res.json();
      setQBConnected(!!data.connected);
    } catch {
      setQBConnected(false);
    }
  }

  // Fetch invoice summary automatically when connected
 useEffect(() => {
  if (qbConnected) {
    setLoading(true);
    fetch(QB_SUMMARY_URL)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setInputs(inputs => ({
          ...inputs,
          total_invoices: data.total,
          paid_invoices: data.paid,
          dso: data.dso,
          ar_over60: data.ar_over60,
          ar_total: data.ar_total,
          revenue12mo: data.revenue12mo,
          largest_cust_sales: data.largest_cust_sales,
          total_sales: data.total_sales
          // ...add the rest as available from QB API
        }));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
      
    fetch(QB_FINANCIAL_URL)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setInputs(inputs => ({
          ...inputs,
          total_debt: data.totalDebt,
          total_income: data.totalIncome
        }));
      })
      .catch(err => setError(err.message));
  }
}, [qbConnected]);

  // Auto-generate proof when numbers or threshold change and connected
  useEffect(() => {
    if (
      qbConnected &&
      inputs.total_invoices &&
      inputs.paid_invoices &&
      inputs.threshold_percent
    ) {
      autoGenerateProof();
    }
    // eslint-disable-next-line
  }, [inputs.total_invoices, inputs.paid_invoices, inputs.threshold_percent, qbConnected]);


  useEffect(() => {
  if (qbConnected) {
    setScorecard(null); // Reset before fetching
    fetch("https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/lender-scorecard")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setScorecard(data);
      })
      .catch(err => setError(err.message));
  }
}, [qbConnected]);



  // QuickBooks Connect: Popup handler
  function handleQuickBooksConnect() {
    const w = 600, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      QB_CONNECT_URL,
      "QuickBooksConnect",
      `width=${w},height=${h},left=${left},top=${top},resizable,scrollbars`
    );
    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        checkQBConnection();
      }
    }, 700);
  }

  // Manual change: only allowed if NOT connected to QuickBooks
  function handleChange(e) {
    if (qbConnected) return; // Lock editing if connected
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  // Threshold slider: always enabled
  function handleThresholdChange(e) {
    setInputs(inputs => ({
      ...inputs,
      threshold_percent: Number(e.target.value),
    }));
  }

  // This runs auto (no event param!)
  async function autoGenerateProof() {
  setLoading(true);
  setProof(null);
  setError(null);

  try {
    // If QuickBooks is connected, send all fields for scorecard
    const payload = qbConnected
      ? {
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
        }
      : {
          total_invoices: Number(inputs.total_invoices),
          paid_invoices: Number(inputs.paid_invoices),
          threshold_percent: Number(inputs.threshold_percent),
          dti_threshold_bp: Number(inputs.dti_threshold_bp)   // 👈 ADD THIS

        };
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setProof(data);
    if (qbConnected) setScorecard(data.scorecard);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}



  // Manual submit (form)
  async function handleSubmit(e) {
    e.preventDefault();
    autoGenerateProof();
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f5f8fa", minHeight: "100vh" }}>
      <div style={{
        maxWidth: 460, margin: "40px auto", background: "#fff", padding: 32,
        borderRadius: 18, boxShadow: "0 4px 20px #0001"
      }}>
        <h2 style={{ textAlign: "center" }}>🔒 Invoice Reliability ZK Proof</h2>

        {/* QuickBooks Connect as Popup */}
        <button
          type="button"
          onClick={handleQuickBooksConnect}
          style={{
            display: "block",
            margin: "0 auto 24px auto",
            padding: "12px 0",
            width: "100%",
            background: qbConnected ? "#00c853" : "#2ca01c",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            textAlign: "center",
            fontSize: 18,
            border: "none",
            cursor: "pointer"
          }}
        >
          {qbConnected ? "✅ QuickBooks Connected" : "Connect QuickBooks"}
        </button>

        {/* Divider */}
        <hr style={{ margin: "24px 0" }} />

        {/* Manual Form Entry */}
        <form onSubmit={handleSubmit}>
  <label>
    Total Invoices<br/>
    <input
      type="number"
      name="total_invoices"
      value={inputs.total_invoices}
      onChange={handleChange}
      min={1}
      required
      style={inputStyle}
      disabled={qbConnected}
    />
  </label>
  <label>
    Paid Invoices<br/>
    <input
      type="number"
      name="paid_invoices"
      value={inputs.paid_invoices}
      onChange={handleChange}
      min={0}
      required
      style={inputStyle}
      disabled={qbConnected}
    />
  </label>
  <label>
    Reliability Threshold ({inputs.threshold_percent}%)
    <input
      type="range"
      name="threshold_percent"
      min={50}
      max={100}
      value={inputs.threshold_percent}
      onChange={handleThresholdChange}
      style={{ width: "100%", marginBottom: 16 }}
    />
  </label>
  {/* Only show DTI manual entry if NOT connected */}
  {!qbConnected && (
    <>
      <label>
        Total Debt<br/>
        <input
          type="number"
          name="total_debt"
          value={inputs.total_debt}
          onChange={handleChange}
          min={0}
          style={inputStyle}
        />
      </label>
      <label>
        Total Income<br/>
        <input
          type="number"
          name="total_income"
          value={inputs.total_income}
          onChange={handleChange}
          min={0}
          style={inputStyle}
        />
      </label>
    </>
  )}
  <button disabled={loading} style={btnStyle}>
    {loading ? "Proving..." : "Generate Proof"}
  </button>
</form>

        {/* Proof result */}
  {proof && (
  <div style={{marginTop: 28, padding: 16, background: "#eef6ff", borderRadius: 12}}>
    <h3>
      {proof.proof && proof.proof[0]
        ? <span style={{color: "#14b314"}}>✅ Reliable</span>
        : <span style={{color: "#d31717"}}>❌ Not Reliable</span>}
    </h3>
    <details style={{marginTop: 8}}>
      <summary>Show ZK Proof Output</summary>
      <pre style={{
        background: "#eee", padding: 8, borderRadius: 6, fontSize: 13, overflowX: "auto"
      }}>{proof.nargoOutput}</pre>
    </details>
  </div>
)}



{/* DTI manual display for manual entry */}
{!qbConnected && inputs.total_debt && inputs.total_income && (
  <div style={{marginTop: 18, padding: 12, background: "#ffe", borderRadius: 10}}>
    <b>Debt-to-Income Ratio:</b>{" "}
    {(inputs.total_income > 0 ? (inputs.total_debt / inputs.total_income) * 100 : 0).toFixed(1)}%
    <div>
      {inputs.total_income > 0
        ? (inputs.total_debt / inputs.total_income) <= 0.4
          ? <span style={{color: "#14b314"}}>✅ Pass</span>
          : <span style={{color: "#d31717"}}>❌ Fail</span>
        : "—"
      }
    </div>
  </div>
)}

{/* Combined results for connected mode... */}


        {/* Combined results */}
        {proof && dti !== null && (
          <div style={{marginTop: 22, padding: 14, background: "#f9f5e7", borderRadius: 12, textAlign: "center"}}>
            <h3 style={{margin: 0}}>
              {proof.isReliable && dtiPassed
                ? <span style={{color: "#14b314"}}>✅ Passes Both Reliability & DTI</span>
                : !proof.isReliable && !dtiPassed
                  ? <span style={{color: "#d31717"}}>❌ Fails Both</span>
                  : proof.isReliable
                    ? <span style={{color: "#e67e22"}}>🟧 Passes Reliability Only</span>
                    : <span style={{color: "#e67e22"}}>🟧 Passes DTI Only</span>
              }
            </h3>
          </div>
        )}
{scorecard && (
  <div style={{ marginTop: 32, background: "#f5fff0", borderRadius: 14, padding: 20 }}>
    <h3 style={{ marginTop: 0 }}>📋 Lender Scorecard</h3>
    <ul style={{ listStyle: "none", padding: 0, fontSize: 15 }}>
      {scorecard.criteria.map((c, i) => (
        <li key={c.key} style={{ marginBottom: 18, display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 600, marginRight: 10 }}>{c.label}:</span>
          {c.pass === null ? <span style={{fontWeight:600,marginRight:6}}>—</span>
            : c.pass
              ? <span style={{ color: "#14b314", fontWeight: 600, fontSize: 18, marginRight: 6 }}>✅</span>
              : <span style={{ color: "#d31717", fontWeight: 600, fontSize: 18, marginRight: 6 }}>❌</span>
          }
          <span style={{ color: "#444", fontSize: 14 }}>{c.explanation}</span>
        </li>
      ))}
    </ul>
    <div style={{ marginTop: 18, fontWeight: 600, fontSize: 16, textAlign: "center" }}>
      {scorecard.overallPass === true && "✅ Passes All Lender Criteria"}
      {scorecard.overallPass === false && "⚠️ Fails One or More Lender Checks"}
      {scorecard.overallPass === null && "— Not Enough Data to Score"}
    </div>
  </div>
)}


        {/* Error */}
        {error && <div style={{ color: "#d31717", marginTop: 16 }}>{error}</div>}
        <div style={{ marginTop: 32, fontSize: 13, color: "#888" }}>
          <hr />
          <div style={{textAlign: "center"}}>
            Powered by Noir ZK circuits &bull; MyLockChain.io
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", margin: "4px 0 16px 0", padding: 8,
  border: "1px solid #bbb", borderRadius: 6, fontSize: 15
};

const btnStyle = {
  width: "100%", padding: "10px 0", fontSize: 16,
  background: "linear-gradient(90deg,#00c6ff,#0072ff)", color: "#fff",
  border: "none", borderRadius: 8, cursor: "pointer"
};
