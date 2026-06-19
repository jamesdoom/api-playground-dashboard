import { AVAILABLE_STOCKS, type FinnhubQuoteResponse, type StockQuote, type StockSymbol } from "../contracts/stocks.ts";
import { type ApiErrorDetails } from "../errors/ProviderError.ts";
export declare function mapFinnhubQuote(stock: (typeof AVAILABLE_STOCKS)[number], data: FinnhubQuoteResponse): StockQuote;
export declare function getStockQuotes(apiKey: string | undefined, symbols?: readonly StockSymbol[]): Promise<StockQuote[]>;
export declare function getStocksApiError(error: unknown): ApiErrorDetails;
