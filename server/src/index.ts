import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import weatherRoutes from "./routes/weatherRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/weather", weatherRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
