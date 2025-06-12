import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/test-db", async (req, res) => {
  try {
    const tokens = await prisma.quickBooksToken.findMany();
    res.json(tokens);
  } catch (error) {
    console.error(error);
    res.status(500).send("Database error!");
  }
});

router.post("/test-db-insert", async (req, res) => {
  try {
    const newToken = await prisma.quickBooksToken.create({
      data: {
        accessToken: "dummy_access",
        refreshToken: "dummy_refresh",
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });
    res.json(newToken);
  } catch (error) {
    console.error(error);
    res.status(500).send("Insert error!");
  }
});

router.get("/generate-zktls-proof", async (req, res) => {
  console.log("Generating zkTLS proof...");

  // Dummy data representing what you'd sign
  const dummyInvoiceData = {
    invoiceId: "INV-001",
    amount: 100000,
    dueDate: "2025-07-01",
    historicalPaymentReliability: 0.95,
  };

  // ⚠️ In real usage, you'd call your zkTLS library here!
  // For now, simulate it
  const zkTLSProof = {
    proof: "zkTLS_dummy_proof",
    verified: true,
    timestamp: new Date(),
  };

  res.json({
    message: "zkTLS proof generated (mocked)",
    invoiceData: dummyInvoiceData,
    zkTLSProof,
  });
});


export default router;
