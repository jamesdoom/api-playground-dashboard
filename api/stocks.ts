import { parseStockSymbols } from "../shared/runtime/contracts/stocks.js";
import { DASHBOARD_CACHE_CONTROL } from "../shared/runtime/http/cache.js";
import type { ApiRequest, ApiResponse } from "../shared/http/serverless.ts";
import {
  getStockQuotes,
  getStocksApiError,
} from "../shared/runtime/services/stocksService.js";

type StocksQuery = {
  symbols?: string | string[];
};

export default async function handler(request: ApiRequest<StocksQuery>, response: ApiResponse) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ message: "This endpoint only supports GET requests." });
    return;
  }

  const querySymbols = Array.isArray(request.query.symbols)
    ? request.query.symbols[0]
    : request.query.symbols;
  const symbols = parseStockSymbols(querySymbols);

  if (!symbols) {
    response.status(400).json({ message: "Please select one to five supported stocks." });
    return;
  }

  try {
    const quotes = await getStockQuotes(process.env.FINNHUB_API_KEY, symbols);
    response.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    response.status(200).json({ quotes });
  } catch (error) {
    const apiError = getStocksApiError(error);
    console.error("Stock request failed:", error);
    response.status(apiError.statusCode).json({ message: apiError.message });
  }
}
