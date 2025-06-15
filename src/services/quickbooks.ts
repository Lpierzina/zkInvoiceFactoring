import { Request, Response } from "express";
import { AuthorizationCode } from "simple-oauth2";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { Router } from "express";


dotenv.config();

export let quickBooksToken: any = null;
export let quickBooksRealmId: string | null = null;



const client = new AuthorizationCode({
  client: {
    id: process.env.QUICKBOOKS_CLIENT_ID!,
    secret: process.env.QUICKBOOKS_CLIENT_SECRET!,
  },
  auth: {
    tokenHost: "https://oauth.platform.intuit.com",
    authorizeHost: "https://appcenter.intuit.com",
    authorizePath: "/connect/oauth2",
    tokenPath: "/oauth2/v1/tokens/bearer",
  },
});


// Step 1: OAuth
export const startOAuth = (req: Request, res: Response) => {
  console.log("[QuickBooks Service] startOAuth called");
  const authorizationUri = client.authorizeURL({
    redirect_uri: process.env.CALLBACK_URL!,
    scope: "com.intuit.quickbooks.accounting",
    state: Math.random().toString(36).substring(7),
  });
  console.log("[QuickBooks Service] Redirecting to:", authorizationUri);
  res.redirect(authorizationUri);
};

// Step 2: OAuth callback
export const quickbooksCallback = async (req: Request, res: Response) => {
  console.log("[QuickBooks Service] quickbooksCallback called with query:", req.query);
  const { code, realmId } = req.query;
  try {
    // 👇👇👇 THIS LINE fetches the token!
    const accessToken = await client.getToken({
      code: code as string,
      redirect_uri: process.env.CALLBACK_URL!,
      scope: "com.intuit.quickbooks.accounting",
    });

    // Now you can use accessToken
    quickBooksToken = accessToken.token;
    quickBooksRealmId = realmId as string;
    console.log("[QuickBooks Service] QuickBooks token saved:", quickBooksToken, "RealmId:", quickBooksRealmId);

    // THIS HTML sends the postMessage and closes popup:
    res.send(`
      <html>
        <body>
          <h2>QuickBooks Connected!</h2>
          <script>
            if (window.opener) {
              window.opener.postMessage("quickbooks_connected", "*");
              window.close();
            }
          </script>
          <p>You may now close this tab and return to the app.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("[QuickBooks Service] OAuth Callback Error", error);
    res.status(500).send("OAuth callback error: " + (error as any).message);
  }
};


// Step 3: ZK proof (with QuickBooks)
export const proveReliabilityWithQuickbooks = async (req: Request, res: Response) => {
  console.log("[QuickBooks Service] proveReliabilityWithQuickbooks called with body:", req.body);

  if (!quickBooksToken || !quickBooksRealmId) {
    console.warn("[QuickBooks Service] Not connected to QuickBooks. Token or realmId missing.");
    return res.status(401).json({ error: "QuickBooks not connected." });
  }

  // 1. Accept all necessary fields from req.body (manual or pre-fetched from QuickBooks)
  const {
    total_invoices, paid_invoices, threshold_percent,
    total_debt, total_income, dti_threshold_bp,
    dso, dso_threshold,
    ar_over60, ar_total, ar_pct_threshold_bp,
    revenue12mo, revenue_threshold,
    largest_cust_sales, total_sales, concentration_threshold_bp
  } = req.body;

  // 2. Optionally: if any field missing, fetch from QuickBooks here (optional/advanced)
  // Example shown for invoice counts only, add more if needed:
  let total = Number(total_invoices), paid = Number(paid_invoices);
  if (!total || !paid) {
    try {
      const url = `https://quickbooks.api.intuit.com/v3/company/${quickBooksRealmId}/query?query=SELECT%20*%20FROM%20Invoice`;
      const accessToken = quickBooksToken.access_token;
      console.log("[QuickBooks Service] Fetching invoices from:", url);
      const qbRes = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
          "Content-Type": "application/text",
        }
      });
      if (!qbRes.ok) throw new Error("QB fetch failed");
      const qbData = await qbRes.json() as any;
      const invoices = qbData.QueryResponse.Invoice || [];
      total = invoices.length;
      paid = invoices.filter((inv: any) => Number(inv.Balance) === 0).length;
      console.log(`[QuickBooks Service] Invoice counts: total=${total}, paid=${paid}`);
    } catch (err) {
      console.error("[QuickBooks Service] QuickBooks fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch invoices from QuickBooks" });
    }
  }

  // 3. Write TOML for Noir (all 15 fields!)
  const toml = `
total_invoices = ${total}
paid_invoices = ${paid}
threshold_percent = ${threshold_percent}
total_debt = ${total_debt}
total_income = ${total_income}
dti_threshold_bp = ${dti_threshold_bp}
dso = ${dso}
dso_threshold = ${dso_threshold}
ar_over60 = ${ar_over60}
ar_total = ${ar_total}
ar_pct_threshold_bp = ${ar_pct_threshold_bp}
revenue12mo = ${revenue12mo}
revenue_threshold = ${revenue_threshold}
largest_cust_sales = ${largest_cust_sales}
total_sales = ${total_sales}
concentration_threshold_bp = ${concentration_threshold_bp}
`.trim();

  const proverPath = path.join(__dirname, "../../invoice_reliability/Prover.toml");
  console.log(`[QuickBooks Service] Writing TOML to ${proverPath}:\n${toml}`);
  fs.writeFileSync(proverPath, toml);

  try {
    // 4. Execute Noir/Nargo and parse [bool; 6] output
    console.log("[QuickBooks Service] Executing: nargo execute");
    const result = execSync('nargo execute', {
      cwd: path.join(__dirname, "../../invoice_reliability"),
    }).toString();
    console.log("[QuickBooks Service] nargo output:", result);

    // Parse [bool; 6] output e.g. [1, 1, 0, 1, 1, 0]
    const match = result.match(/\[([01, ]+)\]/);
    const bools = match ? match[1].split(",").map(x => x.trim() === "1") : [false, false, false, false, false, false];

    // Map results to criteria
    const criteria = [
      { key: "reliable",      label: "Invoice Reliability",      pass: bools[0], explanation: bools[0] ? "Paid invoices meet threshold." : "Paid invoices below threshold." },
      { key: "dti",           label: "Debt-to-Income",           pass: bools[1], explanation: bools[1] ? "DTI ratio is within safe bounds." : "DTI ratio is too high." },
      { key: "dso",           label: "DSO",                      pass: bools[2], explanation: bools[2] ? "DSO is within range." : "DSO is too high." },
      { key: "ar_aging",      label: "AR > 60 Days",             pass: bools[3], explanation: bools[3] ? "AR aging is acceptable." : "AR aging is too high." },
      { key: "revenue",       label: "12mo Revenue",             pass: bools[4], explanation: bools[4] ? "Revenue meets threshold." : "Revenue below threshold." },
      { key: "concentration", label: "Customer Concentration",   pass: bools[5], explanation: bools[5] ? "Customer concentration is safe." : "Customer concentration too high." }
    ];
    const overallPass = bools.every(Boolean);

    // 5. Return JSON in frontend format
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
      // @ts-ignore
      nargoOutput = (e as any).stdout?.toString();
    } else if (typeof e === "string") {
      msg = e;
    }
    console.error("[QuickBooks Service] nargo execute error:", msg, nargoOutput);
    res.status(500).json({ error: msg, nargoOutput });
  }
};
