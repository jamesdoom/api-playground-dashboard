export declare const AVAILABLE_CRYPTOCURRENCIES: readonly [{
    readonly id: "bitcoin";
    readonly name: "Bitcoin";
    readonly symbol: "BTC";
}, {
    readonly id: "ethereum";
    readonly name: "Ethereum";
    readonly symbol: "ETH";
}, {
    readonly id: "solana";
    readonly name: "Solana";
    readonly symbol: "SOL";
}, {
    readonly id: "dogecoin";
    readonly name: "Dogecoin";
    readonly symbol: "DOGE";
}, {
    readonly id: "cardano";
    readonly name: "Cardano";
    readonly symbol: "ADA";
}, {
    readonly id: "ripple";
    readonly name: "XRP";
    readonly symbol: "XRP";
}];
export type CryptoId = (typeof AVAILABLE_CRYPTOCURRENCIES)[number]["id"];
export declare const DEFAULT_CRYPTO_IDS: readonly CryptoId[];
export declare const MAX_WATCHLIST_ITEMS = 5;
export interface CryptoAsset {
    id: CryptoId;
    name: string;
    symbol: string;
    priceUsd: number;
    change24h: number;
}
export interface CryptoResponse {
    assets: CryptoAsset[];
}
export type CoinGeckoSimplePriceResponse = Record<string, {
    usd?: number;
    usd_24h_change?: number;
}>;
export declare function isCryptoId(value: string): value is CryptoId;
export declare function parseCryptoIds(value: string | undefined): CryptoId[] | null;
