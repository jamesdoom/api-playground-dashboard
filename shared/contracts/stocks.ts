export const TRACKED_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
] as const;

export interface StockQuote {
  symbol: string;
  name: string;
  priceUsd: number;
  changePercent: number;
}

export interface StocksResponse {
  quotes: StockQuote[];
}

export interface FinnhubQuoteResponse {
  c?: number;
  dp?: number;
}
