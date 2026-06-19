import { AVAILABLE_CRYPTOCURRENCIES, DEFAULT_CRYPTO_IDS, } from "../contracts/crypto.js";
import { ProviderError } from "../errors/ProviderError.js";
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3/simple/price";
export function mapCoinGeckoResponse(data, ids = DEFAULT_CRYPTO_IDS) {
    return ids.map((id) => {
        const crypto = AVAILABLE_CRYPTOCURRENCIES.find((candidate) => candidate.id === id);
        if (!crypto) {
            throw new ProviderError("unavailable", "CoinGecko received an unsupported asset request.");
        }
        const marketData = data[crypto.id];
        if (typeof marketData?.usd !== "number" || typeof marketData.usd_24h_change !== "number") {
            throw new ProviderError("unavailable", `CoinGecko did not return ${crypto.name} pricing.`);
        }
        return {
            ...crypto,
            priceUsd: marketData.usd,
            change24h: marketData.usd_24h_change,
        };
    });
}
export async function getCryptoPrices(apiKey, ids = DEFAULT_CRYPTO_IDS) {
    if (!apiKey) {
        throw new ProviderError("not_configured", "CoinGecko API key is not configured.");
    }
    const searchParams = new URLSearchParams({
        ids: ids.join(","),
        vs_currencies: "usd",
        include_24hr_change: "true",
    });
    try {
        const response = await fetch(`${COINGECKO_BASE_URL}?${searchParams.toString()}`, {
            headers: {
                accept: "application/json",
                "x-cg-demo-api-key": apiKey,
            },
        });
        if (response.status === 401 || response.status === 403) {
            throw new ProviderError("unauthorized", "CoinGecko rejected the API key.");
        }
        if (!response.ok) {
            throw new ProviderError("unavailable", "CoinGecko request failed.");
        }
        const data = (await response.json());
        return mapCoinGeckoResponse(data, ids);
    }
    catch (error) {
        if (error instanceof ProviderError) {
            throw error;
        }
        throw new ProviderError("unavailable", "CoinGecko could not be reached.");
    }
}
export function getCryptoApiError(error) {
    if (error instanceof ProviderError) {
        if (error.code === "not_configured") {
            return { statusCode: 500, message: "Crypto service is not configured yet." };
        }
        if (error.code === "unauthorized") {
            return { statusCode: 500, message: "Crypto service is not configured correctly." };
        }
    }
    return { statusCode: 500, message: "Crypto prices are unavailable right now. Please try again soon." };
}
