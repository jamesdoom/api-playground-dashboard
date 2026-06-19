import { getStockQuotes as fetchStockQuotes } from "../../../shared/services/stocksService.ts";
import type { StockSymbol } from "../../../shared/contracts/stocks.ts";

export function getStockQuotes(symbols: readonly StockSymbol[]) {
  return fetchStockQuotes(process.env.FINNHUB_API_KEY, symbols);
}
