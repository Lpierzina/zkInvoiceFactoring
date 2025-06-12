import { Router } from "express";
import { startOAuth, quickbooksCallback, verifyInvoice } from "../services/quickbooks";

const router = Router();

router.get("/quickbooks/connect", startOAuth);
router.get("/quickbooks/callback", quickbooksCallback);
router.post("/verify", verifyInvoice);

export default router;
