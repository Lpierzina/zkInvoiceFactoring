import { Router } from "express";
import {
  startOAuth,
  quickbooksCallback,
  proveReliabilityWithQuickbooks,
} from "../services/quickbooks";

const router = Router();

router.get("/quickbooks/connect", startOAuth);
router.get("/quickbooks/callback", quickbooksCallback);
router.post("/quickbooks/prove-reliability", proveReliabilityWithQuickbooks);

export default router;
