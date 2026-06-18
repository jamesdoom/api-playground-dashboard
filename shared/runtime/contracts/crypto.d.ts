export declare const TRACKED_CRYPTOCURRENCIES: readonly [{
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
}];
export interface CryptoAsset {
    id: string;
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
