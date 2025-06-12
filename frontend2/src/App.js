import React, { useState } from "react";

const API_URL = "https://zkinvoice-backend-f15c33da94bc.herokuapp.com/api/prove-reliability";

export default function App() {
  const [inputs, setInputs] = useState({
    total_invoices: "",
    paid_invoices: "",
    threshold_percent: ""
  });
  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
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

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f5f8fa", minHeight: "100vh" }}>
      <div style={{
        maxWidth: 460, margin: "40px auto", background: "#fff", padding: 32,
        borderRadius: 18, boxShadow: "0 4px 20px #0001"
      }}>
        <h2 style={{ textAlign: "center" }}>🔒 Invoice Reliability ZK Proof</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Total Invoices<br/>
            <input type="number" name="total_invoices" value={inputs.total_invoices}
                   onChange={handleChange} min={1} required style={inputStyle}/>
          </label>
          <label>
            Paid Invoices<br/>
            <input type="number" name="paid_invoices" value={inputs.paid_invoices}
                   onChange={handleChange} min={0} required style={inputStyle}/>
          </label>
          <label>
            Reliability Threshold (%)<br/>
            <input type="number" name="threshold_percent" value={inputs.threshold_percent}
                   onChange={handleChange} min={0} max={100} required style={inputStyle}/>
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
