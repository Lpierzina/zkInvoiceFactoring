import React, { useState, useEffect } from "react";
// Add these PayPal SDK imports
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";
const QB_CONNECT_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/connect";
const QB_STATUS_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/status";
const QB_SUMMARY_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/invoice-summary";
const QB_FINANCIAL_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/financial-summary";

// === Add this line for subscription state ===
const PAYPAL_CLIENT_ID = "YOUR_PAYPAL_CLIENT_ID"; // TODO: put your real client ID
const PAYPAL_PLAN_ID = "YOUR_PAYPAL_PLAN_ID";     // TODO: put your real Plan ID

export default function App() {
  // App state
  const [inputs, setInputs] = useState({
    total_invoices: "",
    paid_invoices: "",
    threshold_percent: 90,
  });
  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);
  const [qbConnected, setQBConnected] = useState(false);
  const [scorecard, setScorecard] = useState(null);

  // DTI state
  const [dti, setDti] = useState(null);
  const [dtiPassed, setDtiPassed] = useState(null);

  // === NEW: Subscription state ===
  const [subscribed, setSubscribed] = useState(
    () => !!localStorage.getItem("subscribed")
  );

  // Sync subscription status with localStorage
  useEffect(() => {
    if (subscribed) localStorage.setItem("subscribed", "1");
    else localStorage.removeItem("subscribed");
  }, [subscribed]);

  // Check QuickBooks connection when app loads and after OAuth popup
  useEffect(() => {
    if (!subscribed) return;
    checkQBConnection();
    const handler = (event) => {
      if (event.data === "quickbooks_connected") {
        checkQBConnection();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line
  }, [subscribed]);

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
    if (subscribed && qbConnected) {
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
  }, [subscribed, qbConnected]);

  // Fetch DTI when connected
  useEffect(() => {
    if (subscribed && qbConnected) {
      fetch(QB_FINANCIAL_URL)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          const dtiRatio = data.totalIncome > 0 ? data.totalDebt / data.totalIncome : null;
          setDti(dtiRatio);
          setDtiPassed(dtiRatio !== null ? dtiRatio <= 0.4 : null); // Pass if 40% or less
        })
        .catch(err => setError(err.message));
    }
  }, [subscribed, qbConnected]);

  // Auto-generate proof when numbers or threshold change and connected
  useEffect(() => {
    if (
      (!subscribed || qbConnected) &&
      inputs.total_invoices &&
      inputs.paid_invoices &&
      inputs.threshold_percent
    ) {
      autoGenerateProof();
    }
    // eslint-disable-next-line
  }, [inputs.total_invoices, inputs.paid_invoices, inputs.threshold_percent, qbConnected, subscribed]);

  useEffect(() => {
    if (subscribed && qbConnected) {
      setScorecard(null);
      fetch("https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/quickbooks/lender-scorecard")
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setScorecard(data);
        })
        .catch(err => setError(err.message));
    }
  }, [subscribed, qbConnected]);

  // QuickBooks Connect: Popup handler
  function handleQuickBooksConnect() {
    if (!subscribed) return; // Extra safety
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

  // Manual change: only allowed if NOT connected to QuickBooks (and if not subscribed, always enabled)
  function handleChange(e) {
    if (subscribed && qbConnected) return;
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

  // === UI RENDER ===
  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f5f8fa", minHeight: "100vh" }}>
      <div style={{
        maxWidth: 460, margin: "40px auto", background: "#fff", padding: 32,
        borderRadius: 18, boxShadow: "0 4px 20px #0001"
      }}>
        <h2 style={{ textAlign: "center" }}>🔒 Invoice Reliability ZK Proof</h2>

        {/* Subscription Gate */}
        {!subscribed ? (
          <div style={{
            background: "#e3f0fb", borderRadius: 10, padding: 16, marginBottom: 20, textAlign: "center"
          }}>
            <b>Upgrade to unlock full QuickBooks integration &amp; proof export</b>
            <div style={{ margin: "14px 0" }}>
              <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID }}>
                <PayPalButtons
                  style={{ layout: "horizontal" }}
                  createSubscription={(data, actions) => {
                    return actions.subscription.create({
                      plan_id: PAYPAL_PLAN_ID
                    });
                  }}
                  onApprove={(data, actions) => {
                    setSubscribed(true);
                  }}
                />
              </PayPalScriptProvider>
            </div>
            <span style={{ fontSize: 13 }}>
              <b>Just $10/month.</b> Cancel anytime. Need a custom site? <a href="mailto:sales@yourdomain.com">Contact us</a>.
            </span>
          </div>
        ) : (
          <div style={{
            background: "#d5f6c7", borderRadius: 10, padding: 14, marginBottom: 20, textAlign: "center"
          }}>
            <b>✅ Subscription Active! QuickBooks integration enabled.</b>
          </div>
        )}

        {/* Divider */}
        <hr style={{ margin: "24px 0" }} />

        {/* Free vs Paid Feature Gating */}
        {!subscribed ? (
          <>
            {/* Free mode: Manual input only, no QuickBooks */}
            <form onSubmit={handleSubmit}>
              <label>
                Total Invoices<br />
                <input
                  type="number"
                  name="total_invoices"
                  value={inputs.total_invoices}
                  onChange={handleChange}
                  min={1}
                  required
                  style={inputStyle}
                />
              </label>
              <label>
                Paid Invoices<br />
                <input
                  type="number"
                  name="paid_invoices"
                  value={inputs.paid_invoices}
                  onChange={handleChange}
                  min={0}
                  required
                  style={inputStyle}
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
            <div style={{ marginTop: 14, color: "#888", fontSize: 14, textAlign: "center" }}>
              <b>Demo Mode:</b> Enter your invoice counts to see how ZK proofs work.<br />
              <b>Upgrade</b> for real data and full lender scorecard!
            </div>
          </>
        ) : (
          <>
            {/* Paid mode: QuickBooks Connect and fetch */}
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
              disabled={qbConnected}
            >
              {qbConnected ? "✅ QuickBooks Connected" : "Connect QuickBooks"}
            </button>
            <form onSubmit={handleSubmit}>
              <label>
                Total Invoices<br />
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
                Paid Invoices<br />
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
          </>
        )}

        {/* Proof result */}
        {proof && (
          <div style={{ marginTop: 28, padding: 16, background: "#eef6ff", borderRadius: 12 }}>
            <h3>
              {proof.isReliable
                ? <span style={{ color: "#14b314" }}>✅ Reliable</span>
                : <span style={{ color: "#d31717" }}>❌ Not Reliable</span>}
            </h3>
            <details style={{ marginTop: 8 }}>
              <summary>Show ZK Proof Output</summary>
              <pre style={{
                background: "#eee", padding: 8, borderRadius: 6, fontSize: 13, overflowX: "auto"
              }}>{proof.nargoOutput}</pre>
            </details>
          </div>
        )}

        {/* Lender Scorecard (only if paid and QuickBooks connected) */}
        {subscribed && qbConnected && scorecard && (
          <div style={{ marginTop: 32, background: "#f5fff0", borderRadius: 14, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>📋 Lender Scorecard</h3>
            <ul style={{ listStyle: "none", padding: 0, fontSize: 15 }}>
              {scorecard.criteria.map((c, i) => (
                <li key={c.key} style={{ marginBottom: 18, display: "flex", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, marginRight: 10 }}>{c.label}:</span>
                  {c.pass === null ? <span style={{ fontWeight: 600, marginRight: 6 }}>—</span>
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

        {/* Safety Explanation Section */}
        <div style={{ background: "#fffbe7", borderRadius: 10, padding: 16, margin: "24px 0" }}>
          <b>🔒 Why is this Safe?</b>
          <ul style={{ paddingLeft: 22, fontSize: 14 }}>
            <li>Your QuickBooks data is <b>never stored</b> or shared.</li>
            <li>All connections use bank-grade OAuth security.</li>
            <li>Proofs are generated in-memory—no sensitive data leaves your browser.</li>
            <li>ZK proofs let you prove reliability <b>without revealing raw financials</b>.</li>
          </ul>
          <span style={{ fontSize: 13, color: "#888" }}>
            Trusted by lenders and business brokers. Your privacy, guaranteed.
          </span>
        </div>

        {/* Error */}
        {error && <div style={{ color: "#d31717", marginTop: 16 }}>{error}</div>}
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

const inputStyle = {
  width: "100%", margin: "4px 0 16px 0", padding: 8,
  border: "1px solid #bbb", borderRadius: 6, fontSize: 15
};

const btnStyle = {
  width: "100%", padding: "10px 0", fontSize: 16,
  background: "linear-gradient(90deg,#00c6ff,#0072ff)", color: "#fff",
  border: "none", borderRadius: 8, cursor: "pointer"
};
