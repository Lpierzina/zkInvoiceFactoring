import { Router } from "express";
import {
  startOAuth,
  quickbooksCallback,
  proveReliabilityWithQuickbooks,
  quickBooksToken, // 👈 add this import!
  quickBooksRealmId, // 👈 add this import!
} from "../services/quickbooks";

console.log("[QuickBooks Router] Loading router...");

const router = Router();

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

// Add to your quickbooks router
router.get("/status", (req, res) => {
  res.json({ connected: !!quickBooksToken }); // or however you track this
});

router.post("/prove-reliability", (req, res, next) => {
  console.log("[QuickBooks Router] POST /prove-reliability");
  proveReliabilityWithQuickbooks(req, res);
});

router.get("/invoice-summary", async (req, res) => {
  try {
    // Use your existing logic to fetch invoices from QuickBooks API:
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



console.log("[QuickBooks Router] Exporting router.");

export default router;
