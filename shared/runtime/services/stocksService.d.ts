import { TRACKED_STOCKS, type FinnhubQuoteResponse, type StockQuote } from "../contracts/stocks.ts";
import { type ApiErrorDetails } from "../errors/ProviderError.ts";
export declare function mapFinnhubQuote(stock: (typeof TRACKED_STOCKS)[number], data: FinnhubQuoteResponse): StockQuote;
export declare function getStockQuotes(apiKey: string | undefined): Promise<StockQuote[]>;
export declare function getStocksApiError(error: unknown): ApiErrorDetails;
