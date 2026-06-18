import { getStockQuotes as fetchStockQuotes } from "../../../shared/services/stocksService.ts";

export function getStockQuotes() {
  return fetchStockQuotes(process.env.FINNHUB_API_KEY);
}
