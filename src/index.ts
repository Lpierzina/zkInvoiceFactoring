import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiTestRouter from "./routes/apiTest";
import quickbooksRouter from "./routes/quickbooks";

dotenv.config();

console.log("[App] Starting Express app...");

const app = express();
app.use(cors());
console.log("[App] CORS middleware loaded.");

app.use(express.json());
console.log("[App] JSON middleware loaded.");

// Register routers
console.log("[App] Registering /api/quickbooks router...");
app.use("/api/quickbooks", quickbooksRouter);

console.log("[App] Registering /api router (apiTestRouter)...");
app.use("/api", apiTestRouter);

// Log every incoming request (optional, but super useful for debugging)
app.use((req, res, next) => {
  console.log(`[App] Incoming ${req.method} ${req.url}`);
  next();
});

// Final fallback to confirm missed routes
app.use((req, res) => {
  console.log("[App] Fallback handler triggered:", req.method, req.url);
  res.status(404).send("Not found from fallback");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[App] Server running on port ${PORT}`);
});
