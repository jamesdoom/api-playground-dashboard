import { DASHBOARD_CACHE_CONTROL } from "../shared/runtime/http/cache.js";
import type { ApiRequest, ApiResponse } from "../shared/http/serverless.ts";
import {
  getStockQuotes,
  getStocksApiError,
} from "../shared/runtime/services/stocksService.js";

export default async function handler(request: ApiRequest<Record<string, never>>, response: ApiResponse) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ message: "This endpoint only supports GET requests." });
    return;
  }

  try {
    const quotes = await getStockQuotes(process.env.FINNHUB_API_KEY);
    response.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    response.status(200).json({ quotes });
  } catch (error) {
    const apiError = getStocksApiError(error);
    console.error("Stock request failed:", error);
    response.status(apiError.statusCode).json({ message: apiError.message });
  }
}
