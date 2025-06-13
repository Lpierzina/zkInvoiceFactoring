import { Router } from "express";
import {
  startOAuth,
  quickbooksCallback,
  proveReliabilityWithQuickbooks,
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

router.post("/prove-reliability", (req, res, next) => {
  console.log("[QuickBooks Router] POST /prove-reliability");
  proveReliabilityWithQuickbooks(req, res);
});

console.log("[QuickBooks Router] Exporting router.");

export default router;
