import { AVAILABLE_STOCKS, DEFAULT_STOCK_SYMBOLS, } from "../contracts/stocks.js";
import { ProviderError } from "../errors/ProviderError.js";
const FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote";
export function mapFinnhubQuote(stock, data) {
    if (typeof data.c !== "number" || data.c <= 0 || typeof data.dp !== "number") {
        throw new ProviderError("unavailable", `Finnhub did not return ${stock.name} pricing.`);
    }
    return {
        ...stock,
        priceUsd: data.c,
        changePercent: data.dp,
    };
}
export async function getStockQuotes(apiKey, symbols = DEFAULT_STOCK_SYMBOLS) {
    if (!apiKey) {
        throw new ProviderError("not_configured", "Finnhub API key is not configured.");
    }
    try {
        return await Promise.all(symbols.map(async (symbol) => {
            const stock = AVAILABLE_STOCKS.find((candidate) => candidate.symbol === symbol);
            if (!stock) {
                throw new ProviderError("unavailable", "Finnhub received an unsupported stock request.");
            }
            const searchParams = new URLSearchParams({ symbol: stock.symbol });
            const response = await fetch(`${FINNHUB_QUOTE_URL}?${searchParams.toString()}`, {
                headers: {
                    accept: "application/json",
                    "X-Finnhub-Token": apiKey,
                },
            });
            if (response.status === 401 || response.status === 403) {
                throw new ProviderError("unauthorized", "Finnhub rejected the API key.");
            }
            if (!response.ok) {
                throw new ProviderError("unavailable", "Finnhub request failed.");
            }
            const data = (await response.json());
            return mapFinnhubQuote(stock, data);
        }));
    }
    catch (error) {
        if (error instanceof ProviderError) {
            throw error;
        }
        throw new ProviderError("unavailable", "Finnhub could not be reached.");
    }
}
export function getStocksApiError(error) {
    if (error instanceof ProviderError) {
        if (error.code === "not_configured") {
            return { statusCode: 500, message: "Stock service is not configured yet." };
        }
        if (error.code === "unauthorized") {
            return { statusCode: 500, message: "Stock service is not configured correctly." };
        }
    }
    return { statusCode: 500, message: "Stock prices are unavailable right now. Please try again soon." };
}
