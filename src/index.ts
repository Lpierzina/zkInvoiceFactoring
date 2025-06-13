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
  const { total_invoices, paid_invoices, threshold_percent } = req.body;
  const toml = `total_invoices = ${total_invoices}
paid_invoices = ${paid_invoices}
threshold_percent = ${threshold_percent}
`;

  const proverPath = path.join(RELIABILITY_DIR, "Prover.toml");
  fs.writeFileSync(proverPath, toml);

  try {
    const result = execSync(`${NARGO_BIN} execute`, {
      cwd: RELIABILITY_DIR
    }).toString();

    const match = result.match(/Field\((\d)\)/);
    const isReliable = match ? match[1] === '1' : false;
    res.json({ isReliable, nargoOutput: result });
  } catch (e) {
    let msg = "Unknown error";
    let nargoOutput = undefined;
    if (e instanceof Error) {
      msg = e.message;
      // @ts-ignore
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
