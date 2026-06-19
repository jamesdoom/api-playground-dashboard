export const AVAILABLE_CRYPTOCURRENCIES = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "solana", name: "Solana", symbol: "SOL" },
    { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
    { id: "cardano", name: "Cardano", symbol: "ADA" },
    { id: "ripple", name: "XRP", symbol: "XRP" },
];
export const DEFAULT_CRYPTO_IDS = ["bitcoin", "ethereum", "solana"];
export const MAX_WATCHLIST_ITEMS = 5;
export function isCryptoId(value) {
    return AVAILABLE_CRYPTOCURRENCIES.some((crypto) => crypto.id === value);
}
export function parseCryptoIds(value) {
    if (value === undefined) {
        return [...DEFAULT_CRYPTO_IDS];
    }
    const ids = [...new Set(value.split(",").map((id) => id.trim().toLowerCase()).filter(Boolean))];
    if (ids.length === 0 || ids.length > MAX_WATCHLIST_ITEMS || !ids.every(isCryptoId)) {
        return null;
    }
    return ids;
}
