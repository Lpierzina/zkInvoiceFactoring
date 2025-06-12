import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiTestRouter from "./routes/apiTest";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Load actual router here
app.use("/api", apiTestRouter);

// Final fallback to confirm missed routes
app.use((req, res) => {
  console.log("Fallback handler triggered:", req.method, req.url);
  res.status(404).send("Not found from fallback");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
