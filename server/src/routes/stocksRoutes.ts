import { Router } from "express";
import { DASHBOARD_CACHE_CONTROL } from "../../../shared/http/cache.ts";
import { getStocksApiError } from "../../../shared/services/stocksService.ts";
import { getStockQuotes } from "../services/stocksService.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const quotes = await getStockQuotes();
    res.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    res.json({ quotes });
  } catch (error) {
    const apiError = getStocksApiError(error);
    console.error("Stock request failed:", error);
    res.status(apiError.statusCode).json({ message: apiError.message });
  }
});

export default router;
