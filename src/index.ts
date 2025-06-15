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
app.use("/api/quickbooks", quickbooksRouter); // 👈 AND THIS
app.use("/api", apiTestRouter);




// Find project root from dist/index.js
const PROJECT_ROOT = path.resolve(__dirname, "..");
const RELIABILITY_DIR = path.join(PROJECT_ROOT, "invoice_reliability");
const NARGO_BIN = path.join(PROJECT_ROOT, "bin", "nargo");

app.post('/api/prove-reliability', (req, res) => {
  const {
    total_invoices, paid_invoices, threshold_percent,
    total_debt, total_income, dti_threshold_bp,
    dso, dso_threshold,
    ar_over60, ar_total, ar_pct_threshold_bp,
    revenue12mo, revenue_threshold,
    largest_cust_sales, total_sales, concentration_threshold_bp
  } = req.body;

  const toml = `
total_invoices = ${Number(total_invoices) || 0}
paid_invoices = ${Number(paid_invoices) || 0}
threshold_percent = ${Number(threshold_percent) || 0}
total_debt = ${Number(total_debt) || 0}
total_income = ${Number(total_income) || 0}
dti_threshold_bp = ${Number(dti_threshold_bp) || 0}
dso = ${Number(dso) || 0}
dso_threshold = ${Number(dso_threshold) || 0}
ar_over60 = ${Number(ar_over60) || 0}
ar_total = ${Number(ar_total) || 0}
ar_pct_threshold_bp = ${Number(ar_pct_threshold_bp) || 0}
revenue12mo = ${Number(revenue12mo) || 0}
revenue_threshold = ${Number(revenue_threshold) || 0}
largest_cust_sales = ${Number(largest_cust_sales) || 0}
total_sales = ${Number(total_sales) || 0}
concentration_threshold_bp = ${Number(concentration_threshold_bp) || 0}
  `;

  const proverPath = path.join(RELIABILITY_DIR, "Prover.toml");
  fs.writeFileSync(proverPath, toml);

  try {
    const result = execSync(`${NARGO_BIN} execute`, {
      cwd: RELIABILITY_DIR
    }).toString();

    const match = result.match(/\[([01, ]+)\]/);
    const bools = match ? match[1].split(",").map(x => x.trim() === "1") : [false, false, false, false, false, false];

    const criteria = [
      { key: "reliable", label: "Invoice Reliability", pass: bools[0], explanation: bools[0] ? "Paid invoices meet threshold." : "Paid invoices below threshold." },
      { key: "dti", label: "Debt-to-Income", pass: bools[1], explanation: bools[1] ? "DTI ratio is within safe bounds." : "DTI ratio is too high." },
      { key: "dso", label: "DSO", pass: bools[2], explanation: bools[2] ? "DSO is within range." : "DSO is too high." },
      { key: "ar_aging", label: "AR > 60 Days", pass: bools[3], explanation: bools[3] ? "AR aging is acceptable." : "AR aging is too high." },
      { key: "revenue", label: "12mo Revenue", pass: bools[4], explanation: bools[4] ? "Revenue meets threshold." : "Revenue below threshold." },
      { key: "concentration", label: "Customer Concentration", pass: bools[5], explanation: bools[5] ? "Customer concentration is safe." : "Customer concentration too high." }
    ];
    const overallPass = bools.every(Boolean);

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



// Final fallback to confirm missed routes
app.use((req, res) => {
  console.log("Fallback handler triggered:", req.method, req.url);
  res.status(404).send("Not found from fallback");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
