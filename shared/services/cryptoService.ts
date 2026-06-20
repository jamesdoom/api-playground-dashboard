import {
  AVAILABLE_CRYPTOCURRENCIES,
  DEFAULT_CRYPTO_IDS,
  type CoinGeckoMarketChartResponse,
  type CoinGeckoSimplePriceResponse,
  type CryptoAsset,
  type CryptoHistoryResponse,
  type CryptoHistoryDays,
  type CryptoId,
  type CryptoPricePoint,
} from "../contracts/crypto.ts";
import { ProviderError, type ApiErrorDetails } from "../errors/ProviderError.ts";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3/simple/price";
const COINGECKO_MARKET_CHART_URL = "https://api.coingecko.com/api/v3/coins";
const MAX_HISTORY_POINTS = 32;

export function mapCoinGeckoResponse(
  data: CoinGeckoSimplePriceResponse,
  ids: readonly CryptoId[] = DEFAULT_CRYPTO_IDS,
): CryptoAsset[] {
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

export async function getCryptoPrices(
  apiKey: string | undefined,
  ids: readonly CryptoId[] = DEFAULT_CRYPTO_IDS,
): Promise<CryptoAsset[]> {
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

    const data = (await response.json()) as CoinGeckoSimplePriceResponse;
    return mapCoinGeckoResponse(data, ids);
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    throw new ProviderError("unavailable", "CoinGecko could not be reached.");
  }
}

function downsamplePricePoints(points: CryptoPricePoint[]): CryptoPricePoint[] {
  if (points.length <= MAX_HISTORY_POINTS) {
    return points;
  }

  return Array.from({ length: MAX_HISTORY_POINTS }, (_, index) => {
    const sourceIndex = Math.round(index * (points.length - 1) / (MAX_HISTORY_POINTS - 1));
    return points[sourceIndex];
  });
}

export function mapCoinGeckoHistory(
  id: CryptoId,
  data: CoinGeckoMarketChartResponse,
  days: CryptoHistoryDays = 7,
): CryptoHistoryResponse {
  const crypto = AVAILABLE_CRYPTOCURRENCIES.find((candidate) => candidate.id === id);

  if (!crypto || !Array.isArray(data.prices)) {
    throw new ProviderError("unavailable", "CoinGecko did not return historical pricing.");
  }

  const prices = data.prices.flatMap((point): CryptoPricePoint[] => {
    if (
      !Array.isArray(point)
      || point.length < 2
      || typeof point[0] !== "number"
      || !Number.isFinite(point[0])
      || typeof point[1] !== "number"
      || !Number.isFinite(point[1])
      || point[1] <= 0
    ) {
      return [];
    }

    return [{ timestamp: point[0], priceUsd: point[1] }];
  });

  if (prices.length < 2) {
    throw new ProviderError("unavailable", `CoinGecko did not return enough ${crypto.name} history.`);
  }

  return {
    ...crypto,
    days,
    prices: downsamplePricePoints(prices),
  };
}

export async function getCryptoHistory(
  apiKey: string | undefined,
  id: CryptoId,
  days: CryptoHistoryDays = 7,
): Promise<CryptoHistoryResponse> {
  if (!apiKey) {
    throw new ProviderError("not_configured", "CoinGecko API key is not configured.");
  }

  const searchParams = new URLSearchParams({
    vs_currency: "usd",
    days: String(days),
  });

  try {
    const response = await fetch(
      `${COINGECKO_MARKET_CHART_URL}/${id}/market_chart?${searchParams.toString()}`,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": apiKey,
        },
      },
    );

    if (response.status === 401 || response.status === 403) {
      throw new ProviderError("unauthorized", "CoinGecko rejected the API key.");
    }

    if (!response.ok) {
      throw new ProviderError("unavailable", "CoinGecko history request failed.");
    }

    return mapCoinGeckoHistory(id, (await response.json()) as CoinGeckoMarketChartResponse, days);
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    throw new ProviderError("unavailable", "CoinGecko could not be reached.");
  }
}

export function getCryptoApiError(error: unknown): ApiErrorDetails {
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
