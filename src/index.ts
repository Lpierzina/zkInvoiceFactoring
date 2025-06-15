import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import apiTestRouter from "./routes/apiTest";
import quickbooksRouter from "./routes/quickbooks";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Load routers here
app.use("/api/quickbooks", quickbooksRouter);
app.use("/api", apiTestRouter);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const RELIABILITY_DIR = path.join(PROJECT_ROOT, "invoice_reliability");
const NARGO_BIN = path.join(PROJECT_ROOT, "bin", "nargo");

// Helper to fill default values
function fill(x: any, def: any) {
  return (typeof x !== "undefined" && x !== "" && x !== null) ? x : def;
}

app.post('/api/prove-reliability', (req, res) => {
  const {
    total_invoices, paid_invoices, threshold_percent,
    total_debt, total_income, dti_threshold_bp,
    dso, dso_threshold,
    ar_over60, ar_total, ar_pct_threshold_bp,
    revenue12mo, revenue_threshold,
    largest_cust_sales, total_sales, concentration_threshold_bp
  } = req.body;

  // Detect manual mode: if certain fields are missing, assume manual form
  const isManual =
    !req.body.dso &&
    !req.body.ar_total &&
    !req.body.largest_cust_sales &&
    !req.body.revenue12mo &&
    !req.body.total_sales;

  // Fill defaults for "pass" for unused fields if manual mode.
  // These values should guarantee each check passes unless the user is actually filling them in.
  // For passing: thresholds are set so check always passes, and numerators/denominators are non-failing.
  const toml = `
total_invoices = ${fill(total_invoices, 1)}
paid_invoices = ${fill(paid_invoices, 1)}
threshold_percent = ${fill(threshold_percent, 0)}
total_debt = ${fill(total_debt, 0)}
total_income = ${fill(total_income, 1)}
dti_threshold_bp = ${fill(dti_threshold_bp, 10000)}        # 100.00% DTI passes
dso = ${fill(dso, 0)}
dso_threshold = ${fill(dso_threshold, isManual ? 0 : 45)}  # 0 disables DSO check
ar_over60 = ${fill(ar_over60, 0)}
ar_total = ${fill(ar_total, 1)}
ar_pct_threshold_bp = ${fill(ar_pct_threshold_bp, isManual ? 0 : 1000)}
revenue12mo = ${fill(revenue12mo, isManual ? 999999999 : 0)}
revenue_threshold = ${fill(revenue_threshold, isManual ? 0 : 120000)}
largest_cust_sales = ${fill(largest_cust_sales, 0)}
total_sales = ${fill(total_sales, 1)}
concentration_threshold_bp = ${fill(concentration_threshold_bp, isManual ? 10000 : 5000)}
`;

  const proverPath = path.join(RELIABILITY_DIR, "Prover.toml");
  fs.writeFileSync(proverPath, toml);

  try {
  const result = execSync(`${NARGO_BIN} execute`, {
    cwd: RELIABILITY_DIR
  }).toString();

  // --- PATCHED: Parse Field(1) correctly ---
  const fieldMatches = [...result.matchAll(/Field\((\d)\)/g)];
  const bools = fieldMatches.map(m => m[1] === "1");
  while (bools.length < 6) bools.push(false); // always fill to 6

  let criteria;
  let overallPass;
  if (isManual) {
    criteria = [
      { key: "reliable", label: "Invoice Reliability", pass: bools[0], explanation: bools[0] ? "Paid invoices meet threshold." : "Paid invoices below threshold." },
      { key: "dti", label: "Debt-to-Income", pass: bools[1], explanation: bools[1] ? "DTI ratio is within safe bounds." : "DTI ratio is too high." }
    ];
    overallPass = bools[0] && bools[1];
  } else {
    criteria = [
      { key: "reliable", label: "Invoice Reliability", pass: bools[0], explanation: bools[0] ? "Paid invoices meet threshold." : "Paid invoices below threshold." },
      { key: "dti", label: "Debt-to-Income", pass: bools[1], explanation: bools[1] ? "DTI ratio is within safe bounds." : "DTI ratio is too high." },
      { key: "dso", label: "DSO", pass: bools[2], explanation: bools[2] ? "DSO is within range." : "DSO is too high." },
      { key: "ar_aging", label: "AR > 60 Days", pass: bools[3], explanation: bools[3] ? "AR aging is acceptable." : "AR aging is too high." },
      { key: "revenue", label: "12mo Revenue", pass: bools[4], explanation: bools[4] ? "Revenue meets threshold." : "Revenue below threshold." },
      { key: "concentration", label: "Customer Concentration", pass: bools[5], explanation: bools[5] ? "Customer concentration is safe." : "Customer concentration too high." }
    ];
    overallPass = bools.every(Boolean);
  }

  res.json({
    proof: bools,
    nargoOutput: result,
    criteria,
    overallPass
  });
} catch (e) {
    let msg = "Unknown error";
    let nargoOutput = undefined;
    if (e instanceof Error) {
      msg = e.message;
      nargoOutput = (e as any).stdout?.toString();
    } else if (typeof e === "string") {
      msg = e;
    }
    res.status(500).json({ error: msg, nargoOutput });
  }
});

// Fallback
app.use((req, res) => {
  console.log("Fallback handler triggered:", req.method, req.url);
  res.status(404).send("Not found from fallback");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
