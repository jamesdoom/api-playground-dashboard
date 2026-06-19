export const AVAILABLE_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
] as const;

export type StockSymbol = (typeof AVAILABLE_STOCKS)[number]["symbol"];

export const DEFAULT_STOCK_SYMBOLS: readonly StockSymbol[] = ["AAPL", "MSFT", "NVDA"];
export const MAX_STOCK_WATCHLIST_ITEMS = 5;

export interface StockQuote {
  symbol: StockSymbol;
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

export function isStockSymbol(value: string): value is StockSymbol {
  return AVAILABLE_STOCKS.some((stock) => stock.symbol === value);
}

export function parseStockSymbols(value: string | undefined): StockSymbol[] | null {
  if (value === undefined) {
    return [...DEFAULT_STOCK_SYMBOLS];
  }

  const symbols = [
    ...new Set(value.split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)),
  ];

  if (
    symbols.length === 0
    || symbols.length > MAX_STOCK_WATCHLIST_ITEMS
    || !symbols.every(isStockSymbol)
  ) {
    return null;
  }

  return symbols;
}
