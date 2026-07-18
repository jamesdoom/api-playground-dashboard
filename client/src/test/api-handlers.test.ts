import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import cryptoHandler from "../../../api/crypto.ts";
import cryptoHistoryHandler from "../../../api/crypto/history.ts";
import newsHandler from "../../../api/news.ts";
import stocksHandler from "../../../api/stocks.ts";
import weatherHandler from "../../../api/weather.ts";
import type { ApiResponse } from "../../../shared/http/serverless.ts";

function createApiResponse() {
  let statusCode = 200;
  let body: unknown;
  const headers = new Map<string, string>();

  const response: ApiResponse = {
    status(code) {
      statusCode = code;
      return response;
    },
    json(payload) {
      body = payload;
    },
    setHeader(name, value) {
      headers.set(name, value);
    },
  };

  return {
    response,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    headers,
  };
}

describe("Vercel API handlers", () => {
  beforeEach(() => {
    process.env.GUARDIAN_API_KEY = "news-key";
    process.env.COINGECKO_API_KEY = "crypto-key";
    process.env.FINNHUB_API_KEY = "stocks-key";
  });

  afterEach(() => {
    delete process.env.GUARDIAN_API_KEY;
    delete process.env.COINGECKO_API_KEY;
    delete process.env.FINNHUB_API_KEY;
  });

  it("rejects a weather request without a city", async () => {
    const result = createApiResponse();
    await weatherHandler({ method: "GET", query: {} }, result.response);

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({ message: "Please enter a city name." });
  });

  it("rejects an unsupported news category", async () => {
    const result = createApiResponse();
    await newsHandler({ method: "GET", query: { category: "unknown" } }, result.response);

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({ message: "Please select a valid news category." });
  });

  it("rejects unsupported market watchlist selections", async () => {
    const cryptoResult = createApiResponse();
    const stocksResult = createApiResponse();

    await cryptoHandler(
      { method: "GET", query: { ids: "bitcoin,not-a-coin" } },
      cryptoResult.response,
    );
    await stocksHandler(
      { method: "GET", query: { symbols: "AAPL,NOPE" } },
      stocksResult.response,
    );

    expect(cryptoResult.statusCode).toBe(400);
    expect(cryptoResult.body).toEqual({
      message: "Please select one to five supported crypto assets.",
    });
    expect(stocksResult.statusCode).toBe(400);
    expect(stocksResult.body).toEqual({ message: "Please select one to five supported stocks." });
  });

  it("rejects an unsupported historical crypto asset", async () => {
    const result = createApiResponse();
    await cryptoHistoryHandler({ method: "GET", query: { id: "not-a-coin" } }, result.response);

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({ message: "Please select a supported crypto asset." });
  });

  it("rejects an unsupported crypto history range", async () => {
    const result = createApiResponse();
    await cryptoHistoryHandler(
      { method: "GET", query: { id: "bitcoin", days: "14" } },
      result.response,
    );

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({ message: "Please select a 7, 30, or 90-day history range." });
  });

  it("returns mapped weather data with the CDN cache policy", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              { name: "Chicago", country_code: "US", latitude: 41.85, longitude: -87.65 },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: {
              temperature_2m: 70,
              apparent_temperature: 69,
              relative_humidity_2m: 50,
              weather_code: 0,
              is_day: 1,
            },
            hourly: {
              time: ["2026-07-18T09:00"],
              temperature_2m: [71],
              precipitation_probability: [15],
              weather_code: [1],
              is_day: [1],
            },
            daily: {
              time: ["2026-07-18"],
              temperature_2m_max: [82],
              temperature_2m_min: [64],
              sunrise: ["2026-07-18T05:32"],
              sunset: ["2026-07-18T20:24"],
              precipitation_probability_max: [25],
              weather_code: [2],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = createApiResponse();

    await weatherHandler({ method: "GET", query: { city: "Chicago" } }, result.response);

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({ city: "Chicago", temperature: 70 });
    expect(result.body).toMatchObject({
      hourlyForecast: [{ temperature: 71, precipitationProbability: 15 }],
      dailyForecast: [{ high: 82, low: 64, precipitationProbability: 25 }],
    });
    expect(result.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("temperature_unit=fahrenheit"),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("forecast_hours=24"),
    );
  });

  it("returns mapped headlines with the CDN cache policy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            response: {
              results: [
                {
                  id: "world/example",
                  sectionName: "World news",
                  webPublicationDate: "2026-06-18T12:00:00Z",
                  webTitle: "Example headline",
                  webUrl: "https://www.theguardian.com/example",
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const result = createApiResponse();

    await newsHandler({ method: "GET", query: { category: "world" } }, result.response);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      articles: [expect.objectContaining({ title: "Example headline", thumbnail: null })],
    });
    expect(result.headers.get("Cache-Control")).toContain("stale-while-revalidate=600");
  });

  it("returns mapped crypto prices with the CDN cache policy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            bitcoin: { usd: 67500, usd_24h_change: 2.5 },
            ethereum: { usd: 3500, usd_24h_change: -1.25 },
            solana: { usd: 145, usd_24h_change: 0.5 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const result = createApiResponse();

    await cryptoHandler({ method: "GET", query: {} }, result.response);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      assets: [
        expect.objectContaining({ id: "bitcoin", symbol: "BTC", priceUsd: 67500 }),
        expect.objectContaining({ id: "ethereum", symbol: "ETH", priceUsd: 3500 }),
        expect.objectContaining({ id: "solana", symbol: "SOL", priceUsd: 145 }),
      ],
    });
    expect(result.headers.get("Cache-Control")).toContain("s-maxage=300");
  });

  it("returns normalized crypto history with the longer CDN cache policy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ prices: [[1, 60000], [2, 62000], [3, 67500]] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const result = createApiResponse();

    await cryptoHistoryHandler(
      { method: "GET", query: { id: "bitcoin", days: "30" } },
      result.response,
    );

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      days: 30,
      prices: [
        { timestamp: 1, priceUsd: 60000 },
        { timestamp: 2, priceUsd: 62000 },
        { timestamp: 3, priceUsd: 67500 },
      ],
    });
    expect(result.headers.get("Cache-Control")).toContain("s-maxage=900");
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("days=30"),
      expect.any(Object),
    );
  });

  it("returns mapped stock quotes with the CDN cache policy", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ c: 205.5, dp: 1.25 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ c: 450.25, dp: -0.75 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ c: 150, dp: 0.5 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = createApiResponse();

    await stocksHandler({ method: "GET", query: {} }, result.response);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      quotes: [
        expect.objectContaining({ symbol: "AAPL", priceUsd: 205.5, changePercent: 1.25 }),
        expect.objectContaining({ symbol: "MSFT", priceUsd: 450.25, changePercent: -0.75 }),
        expect.objectContaining({ symbol: "NVDA", priceUsd: 150, changePercent: 0.5 }),
      ],
    });
    expect(result.headers.get("Cache-Control")).toContain("s-maxage=300");
  });
});
