export const AVAILABLE_CRYPTOCURRENCIES = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
] as const;

export type CryptoId = (typeof AVAILABLE_CRYPTOCURRENCIES)[number]["id"];

export const DEFAULT_CRYPTO_IDS: readonly CryptoId[] = ["bitcoin", "ethereum", "solana"];
export const MAX_WATCHLIST_ITEMS = 5;

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

export type CoinGeckoSimplePriceResponse = Record<
  string,
  {
    usd?: number;
    usd_24h_change?: number;
  }
>;

export function isCryptoId(value: string): value is CryptoId {
  return AVAILABLE_CRYPTOCURRENCIES.some((crypto) => crypto.id === value);
}

export function parseCryptoIds(value: string | undefined): CryptoId[] | null {
  if (value === undefined) {
    return [...DEFAULT_CRYPTO_IDS];
  }

  const ids = [...new Set(value.split(",").map((id) => id.trim().toLowerCase()).filter(Boolean))];

  if (ids.length === 0 || ids.length > MAX_WATCHLIST_ITEMS || !ids.every(isCryptoId)) {
    return null;
  }

  return ids;
}
