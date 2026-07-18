export declare const AVAILABLE_STOCKS: readonly [{
    readonly symbol: "AAPL";
    readonly name: "Apple";
}, {
    readonly symbol: "MSFT";
    readonly name: "Microsoft";
}, {
    readonly symbol: "NVDA";
    readonly name: "Nvidia";
}, {
    readonly symbol: "GOOGL";
    readonly name: "Alphabet";
}, {
    readonly symbol: "AMZN";
    readonly name: "Amazon";
}, {
    readonly symbol: "TSLA";
    readonly name: "Tesla";
}, {
    readonly symbol: "FISV";
    readonly name: "Fiserv";
}, {
    readonly symbol: "SOFI";
    readonly name: "SoFi";
}];
export type StockSymbol = (typeof AVAILABLE_STOCKS)[number]["symbol"];
export declare const DEFAULT_STOCK_SYMBOLS: readonly StockSymbol[];
export declare const MAX_STOCK_WATCHLIST_ITEMS = 5;
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
export declare function isStockSymbol(value: string): value is StockSymbol;
export declare function parseStockSymbols(value: string | undefined): StockSymbol[] | null;
