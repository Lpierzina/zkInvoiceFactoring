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

// Helper to always write integers
function toInt(x: any, def: number) {
  const n = Number(x);
  if (isNaN(n) || x === "" || x === undefined || x === null) return def;
  return Math.round(n); // or Math.floor(n) if you prefer
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
  const isManual = !!req.body.manual;



  // Always write TOML with integers
  const toml = `
total_invoices = ${toInt(total_invoices, 1)}
paid_invoices = ${toInt(paid_invoices, 1)}
threshold_percent = ${toInt(threshold_percent, 0)}
total_debt = ${toInt(req.body.total_debt, 0)}
total_income = ${toInt(req.body.total_income, 1)}
dti_threshold_bp = ${toInt(dti_threshold_bp, 4000)}        # 40.00% DTI passes
dso = ${toInt(dso, 0)}
dso_threshold = ${toInt(dso_threshold, isManual ? 0 : 45)}
ar_over60 = ${toInt(ar_over60, 0)}
ar_total = ${toInt(ar_total, 1)}
ar_pct_threshold_bp = ${toInt(ar_pct_threshold_bp, isManual ? 0 : 1000)}
revenue12mo = ${toInt(revenue12mo, isManual ? 999999999 : 0)}
revenue_threshold = ${toInt(revenue_threshold, isManual ? 0 : 120000)}
largest_cust_sales = ${toInt(largest_cust_sales, 0)}
total_sales = ${toInt(total_sales, 1)}
concentration_threshold_bp = ${toInt(concentration_threshold_bp, isManual ? 10000 : 5000)}
`;

console.log('\n[DEBUG] Writing Prover.toml with:\n' + toml);

  const proverPath = path.join(RELIABILITY_DIR, "Prover.toml");
  fs.writeFileSync(proverPath, toml);

  try {
    const result = execSync(`${NARGO_BIN} execute`, {
      cwd: RELIABILITY_DIR
    }).toString();

    // Parse Field(1) output to boolean
    const fieldMatches = [...result.matchAll(/Field\((\d)\)/g)];
    const bools = fieldMatches.map(m => m[1] === "1");
    while (bools.length < 6) bools.push(false); // always fill to 6

    let criteria;
    let overallPass;

    if (isManual) {
      criteria = [
        {
          key: "reliable",
          label: "Invoice Reliability",
          pass: bools[0],
          explanation: bools[0]
            ? "Were enough invoices paid to meet the required reliability threshold? (Default: 90% paid invoices needed.)"
            : "Paid invoices below threshold."
        },
        {
          key: "dti",
          label: "Debt-to-Income Ratio",
          pass: bools[1],
          explanation: bools[1]
            ? "Debt-to-income ratio is within a healthy range (default: under 40%)."
            : "DTI ratio is too high."
        }
      ];
      overallPass = bools[0] && bools[1];
    } else {
      criteria = [
        {
          key: "reliable",
          label: "Invoice Reliability",
          pass: bools[0],
          explanation: bools[0]
            ? "Were enough invoices paid to meet the required reliability threshold? (90%+ paid is required for most lenders.)"
            : "Paid invoices below threshold."
        },
        {
          key: "dti",
          label: "Debt-to-Income Ratio",
          pass: bools[1],
          explanation: bools[1]
            ? "Does the business have a safe amount of unpaid debt compared to its income? (Below 40% is considered healthy.)"
            : "DTI ratio is too high."
        },
        {
          key: "dso",
          label: "Days Sales Outstanding (DSO)",
          pass: bools[2],
          explanation: bools[2]
            ? "Is the business paid quickly after issuing invoices? (Under 45 days is preferred.)"
            : "DSO is too high."
        },
        {
          key: "ar_aging",
          label: "AR Overdue (>60 days)",
          pass: bools[3],
          explanation: bools[3]
            ? "Is a low portion of accounts receivable overdue by more than 60 days? (Less than 10% is ideal.)"
            : "AR aging is too high."
        },
        {
          key: "revenue",
          label: "Annual Revenue",
          pass: bools[4],
          explanation: bools[4]
            ? "Does the business generate at least $120,000 in revenue per year? (Most lenders require this minimum.)"
            : "Revenue below threshold."
        },
        {
          key: "concentration",
          label: "Customer Concentration",
          pass: bools[5],
          explanation: bools[5]
            ? "Is the business not too reliant on a single customer? (Largest customer should be less than 50% of total sales.)"
            : "Customer concentration too high."
        }
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
