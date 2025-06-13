import { Router } from "express";
import {
  startOAuth,
  quickbooksCallback,
  proveReliabilityWithQuickbooks,
} from "../services/quickbooks";

const router = Router();

// Remove the /quickbooks prefix from each route!
router.get("/connect", startOAuth);
router.get("/callback", quickbooksCallback);
router.post("/prove-reliability", proveReliabilityWithQuickbooks);

export default router;
