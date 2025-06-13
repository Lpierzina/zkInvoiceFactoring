import React, { useState, useEffect } from "react";

const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";
const QB_CONNECT_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/connect";
const QB_STATUS_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/status";
const QB_SUMMARY_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/invoice-summary";

export default function App() {
  // App state
  const [inputs, setInputs] = useState({
    total_invoices: "",
    paid_invoices: "",
    threshold_percent: 90,   // Default to 90%
  });
  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);
  const [qbConnected, setQBConnected] = useState(false);

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
      fetch(QB_SUMMARY_URL)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setInputs(inputs => ({
            ...inputs,
            total_invoices: data.total,
            paid_invoices: data.paid,
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
      // Do NOT require an event param
      autoGenerateProof();
    }
    // eslint-disable-next-line
  }, [inputs.total_invoices, inputs.paid_invoices, inputs.threshold_percent, qbConnected]);

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
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_invoices: Number(inputs.total_invoices),
          paid_invoices: Number(inputs.paid_invoices),
          threshold_percent: Number(inputs.threshold_percent)
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
          <button disabled={loading} style={btnStyle}>
            {loading ? "Proving..." : "Generate Proof"}
          </button>
        </form>

        {proof && (
          <div style={{marginTop: 28, padding: 16, background: "#eef6ff", borderRadius: 12}}>
            <h3>
              {proof.isReliable
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
