export declare const TRACKED_STOCKS: readonly [{
    readonly symbol: "AAPL";
    readonly name: "Apple";
}, {
    readonly symbol: "MSFT";
    readonly name: "Microsoft";
}, {
    readonly symbol: "NVDA";
    readonly name: "Nvidia";
}];
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
