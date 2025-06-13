import { Router } from "express";
import {
  startOAuth,
  quickbooksCallback,
  proveReliabilityWithQuickbooks,
} from "../services/quickbooks";


const router = Router();
router.get("/ping", (req, res) => res.send("pong from quickbooks router!"));

// Remove the /quickbooks prefix from each route!
router.get("/connect", startOAuth);
router.get("/callback", quickbooksCallback);
router.post("/prove-reliability", proveReliabilityWithQuickbooks);

export default router;
