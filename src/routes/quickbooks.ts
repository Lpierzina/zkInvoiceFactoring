import { Router } from "express";
import {
  startOAuth,
  quickbooksCallback,
  proveReliabilityWithQuickbooks,
  quickBooksToken,
  quickBooksRealmId,
} from "../services/quickbooks";

console.log("[QuickBooks Router] Loading router...");

const router = Router();

interface ArAgingBuckets {
  over30: number;
  over60: number;
  over90: number;
  totalAR: number;
  pctOver60: number | null;
}

router.get("/ping", (req, res) => {
  console.log("[QuickBooks Router] GET /ping");
  res.send("pong from quickbooks router!");
});

router.get("/connect", (req, res, next) => {
  console.log("[QuickBooks Router] GET /connect");
  startOAuth(req, res);
});

router.get("/callback", (req, res, next) => {
  console.log("[QuickBooks Router] GET /callback");
  quickbooksCallback(req, res);
});

router.get("/status", (req, res) => {
  res.json({ connected: !!quickBooksToken });
});

router.post("/prove-reliability", (req, res, next) => {
  console.log("[QuickBooks Router] POST /prove-reliability");
  proveReliabilityWithQuickbooks(req, res);
});

router.get("/invoice-summary", async (req, res) => {
  try {
    if (!quickBooksToken || !quickBooksRealmId) {
      return res.status(401).json({ error: "QuickBooks not connected." });
    }
    const url = `https://quickbooks.api.intuit.com/v3/company/${quickBooksRealmId}/query?query=SELECT%20*%20FROM%20Invoice`;
    const accessToken = quickBooksToken.access_token;

    const qbRes = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "Content-Type": "application/text",
      }
    });

    if (!qbRes.ok) throw new Error("QB fetch failed");
    const qbData = await qbRes.json();
    const invoices = qbData.QueryResponse.Invoice || [];
    const total = invoices.length;
    const paid = invoices.filter((inv: any) => Number(inv.Balance) === 0).length;
    res.json({ total, paid });
  } catch (e) {
    let msg = "Unknown error";
    if (e instanceof Error) {
      msg = e.message;
    } else if (typeof e === "string") {
      msg = e;
    }
    res.status(500).json({ error: msg });
  }
});

router.get("/financial-summary", async (req, res) => {
  try {
    if (!quickBooksToken || !quickBooksRealmId) {
      return res.status(401).json({ error: "QuickBooks not connected." });
    }
    // Fetch ALL invoices
    const url = `https://quickbooks.api.intuit.com/v3/company/${quickBooksRealmId}/query?query=SELECT * FROM Invoice`;
    const accessToken = quickBooksToken.access_token;

    const qbRes = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "Content-Type": "application/text",
      }
    });
    if (!qbRes.ok) throw new Error("QB fetch failed");
    const qbData = await qbRes.json();
    const invoices = qbData.QueryResponse.Invoice || [];

    const totalDebt = invoices.filter((inv: any) => Number(inv.Balance) > 0)
      .reduce((sum: number, inv: any) => sum + Number(inv.Balance), 0);

    const totalIncome = invoices.filter((inv: any) => Number(inv.Balance) === 0)
      .reduce((sum: number, inv: any) => sum + Number(inv.TotalAmt), 0);

    res.json({ totalDebt, totalIncome });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}); // <-- CLOSES /financial-summary route!

router.get("/lender-scorecard", async (req, res) => {
  try {
    if (!quickBooksToken || !quickBooksRealmId) {
      return res.status(401).json({ error: "QuickBooks not connected." });
    }
    const accessToken = quickBooksToken.access_token;
    const companyId = quickBooksRealmId;

    // 1. Fetch all invoices
    const invoicesUrl = `https://quickbooks.api.intuit.com/v3/company/${companyId}/query?query=SELECT * FROM Invoice`;
    const invoicesRes = await fetch(invoicesUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "Content-Type": "application/text",
      }
    });
    if (!invoicesRes.ok) throw new Error("QB fetch failed");
    const invoicesData = await invoicesRes.json();
    const invoices = invoicesData.QueryResponse.Invoice || [];
    const now = new Date();

    // 2. Days Sales Outstanding (DSO)
    let dsoSum = 0, dsoCount = 0;
    invoices.forEach((inv: any) => {
      if (inv.Balance === 0 && inv.TxnDate && inv.LinkedTxn) {
        let paidDate: Date | undefined;
        if (Array.isArray(inv.LinkedTxn)) {
          paidDate = inv.LinkedTxn
            .filter((txn: any) => txn.TxnType === "Payment" && txn.TxnDate)
            .map((txn: any) => new Date(txn.TxnDate))
            .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
        }
        if (!paidDate) paidDate = new Date(inv.MetaData?.LastUpdatedTime || inv.TxnDate);
        const issueDate: Date = new Date(inv.TxnDate);
        dsoSum += (paidDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
        dsoCount++;
      }
    });
    const dso = dsoCount > 0 ? dsoSum / dsoCount : null;

    // 3. AR Aging Buckets
    let arBuckets: ArAgingBuckets = { over30: 0, over60: 0, over90: 0, totalAR: 0, pctOver60: null };
    invoices.forEach((inv: any) => {
      if (Number(inv.Balance) > 0 && inv.DueDate) {
        const dueDate = new Date(inv.DueDate);
        const daysLate = (now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24);
        arBuckets.totalAR += Number(inv.Balance);
        if (daysLate > 90) arBuckets.over90 += Number(inv.Balance);
        else if (daysLate > 60) arBuckets.over60 += Number(inv.Balance);
        else if (daysLate > 30) arBuckets.over30 += Number(inv.Balance);
      }
    });
    arBuckets.pctOver60 = arBuckets.totalAR > 0 ? arBuckets.over60 / arBuckets.totalAR : null;

    // 4. Annual Revenue (last 12 months)
    const aYearAgo = new Date();
    aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);
    let revenue12mo = 0;
    invoices.forEach((inv: any) => {
      const date = new Date(inv.TxnDate);
      if (date > aYearAgo) revenue12mo += Number(inv.TotalAmt || 0);
    });

    // 5. Concentration Risk (by Customer)
    const customerSums: { [id: string]: number } = {};
    invoices.forEach((inv: any) => {
      if (!inv.CustomerRef?.value) return;
      const id = inv.CustomerRef.value;
      customerSums[id] = (customerSums[id] || 0) + Number(inv.TotalAmt || 0);
    });
    const totalSales = Object.values(customerSums).reduce((a, b) => a + b, 0);
    const largestCustomer = Object.entries(customerSums).sort((a, b) => b[1] - a[1])[0];
    const concentrationPct = totalSales > 0 ? (largestCustomer?.[1] || 0) / totalSales : null;

    // 6. Debt-to-Income
    const totalDebt = invoices
      .filter((inv: any) => Number(inv.Balance) > 0)
      .reduce((sum: number, inv: any) => sum + Number(inv.Balance), 0);
    const totalIncome = invoices
      .filter((inv: any) => Number(inv.Balance) === 0)
      .reduce((sum: number, inv: any) => sum + Number(inv.TotalAmt), 0);
    const dti = totalIncome > 0 ? totalDebt / totalIncome : null;

    let currentRatio = null;
    let profitability = null;

    res.json({
      dso,
      arBuckets,
      revenue12mo,
      largestCustomerPct: concentrationPct,
      dti,
      currentRatio,
      profitability,
      pass: {
        dso: dso !== null ? dso < 45 : null,
        arAging: arBuckets.pctOver60 !== null ? arBuckets.pctOver60 < 0.10 : null,
        revenue: revenue12mo > 120000,
        concentration: concentrationPct !== null ? concentrationPct < 0.5 : null,
        dti: dti !== null ? dti <= 0.4 : null,
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

console.log("[QuickBooks Router] Exporting router.");

export default router;
