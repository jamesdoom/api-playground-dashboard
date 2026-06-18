export const TRACKED_CRYPTOCURRENCIES = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
] as const;

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

export type CoinGeckoSimplePriceResponse = Record<
  string,
  {
    usd?: number;
    usd_24h_change?: number;
  }
>;
