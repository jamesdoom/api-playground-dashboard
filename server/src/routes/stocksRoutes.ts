import { Router } from "express";
import { parseStockSymbols } from "../../../shared/contracts/stocks.ts";
import { DASHBOARD_CACHE_CONTROL } from "../../../shared/http/cache.ts";
import { getStocksApiError } from "../../../shared/services/stocksService.ts";
import { getStockQuotes } from "../services/stocksService.js";

const router = Router();

router.get("/", async (req, res) => {
  const querySymbols = Array.isArray(req.query.symbols) ? req.query.symbols[0] : req.query.symbols;
  const symbols = parseStockSymbols(typeof querySymbols === "string" ? querySymbols : undefined);

  if (!symbols) {
    res.status(400).json({ message: "Please select one to five supported stocks." });
    return;
  }

  try {
    const quotes = await getStockQuotes(symbols);
    res.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    res.json({ quotes });
  } catch (error) {
    const apiError = getStocksApiError(error);
    console.error("Stock request failed:", error);
    res.status(apiError.statusCode).json({ message: apiError.message });
  }
});

export default router;
