import { describe, expect, it } from "vitest";
import { parseCryptoHistoryDays, parseCryptoIds } from "../../../shared/contracts/crypto.ts";
import { parseNewsCategory } from "../../../shared/contracts/news.ts";
import { AVAILABLE_STOCKS, parseStockSymbols } from "../../../shared/contracts/stocks.ts";
import { mapCoinGeckoHistory, mapCoinGeckoResponse } from "../../../shared/services/cryptoService.ts";
import { mapGuardianResponse } from "../../../shared/services/newsService.ts";
import { mapFinnhubQuote } from "../../../shared/services/stocksService.ts";
import { mapOpenMeteoResponse } from "../../../shared/services/weatherService.ts";

describe("shared provider transformations", () => {
  it("maps Finnhub data into the stock quote contract", () => {
    const quote = mapFinnhubQuote(AVAILABLE_STOCKS[0], { c: 205.5, dp: 1.25 });

    expect(quote).toEqual({
      symbol: "AAPL",
      name: "Apple",
      priceUsd: 205.5,
      changePercent: 1.25,
    });
  });

  it("validates and normalizes customizable market selections", () => {
    expect(parseCryptoIds("bitcoin,DOGECOIN,bitcoin")).toEqual(["bitcoin", "dogecoin"]);
    expect(parseCryptoIds("bitcoin,unknown")).toBeNull();
    expect(parseCryptoIds("bitcoin,ethereum,solana,dogecoin,cardano,ripple")).toBeNull();
    expect(parseStockSymbols("aapl,TSLA,aapl")).toEqual(["AAPL", "TSLA"]);
    expect(parseStockSymbols("AAPL,UNKNOWN")).toBeNull();
    expect(parseStockSymbols("AAPL,MSFT,NVDA,GOOGL,AMZN,TSLA")).toBeNull();
  });

  it("accepts only supported crypto history ranges", () => {
    expect(parseCryptoHistoryDays(undefined)).toBe(7);
    expect(parseCryptoHistoryDays("30")).toBe(30);
    expect(parseCryptoHistoryDays("90")).toBe(90);
    expect(parseCryptoHistoryDays("14")).toBeNull();
  });

  it("maps CoinGecko prices into the dashboard contract", () => {
    const assets = mapCoinGeckoResponse({
      bitcoin: { usd: 67500, usd_24h_change: 2.5 },
      ethereum: { usd: 3500, usd_24h_change: -1.25 },
      solana: { usd: 145, usd_24h_change: 0.5 },
    });

    expect(assets).toEqual([
      { id: "bitcoin", name: "Bitcoin", symbol: "BTC", priceUsd: 67500, change24h: 2.5 },
      { id: "ethereum", name: "Ethereum", symbol: "ETH", priceUsd: 3500, change24h: -1.25 },
      { id: "solana", name: "Solana", symbol: "SOL", priceUsd: 145, change24h: 0.5 },
    ]);
  });

  it("maps CoinGecko history into a compact dashboard series", () => {
    const history = mapCoinGeckoHistory("bitcoin", {
      prices: [[1, 60000], [2, 62000], [3, 67500]],
    });

    expect(history).toEqual({
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      days: 7,
      prices: [
        { timestamp: 1, priceUsd: 60000 },
        { timestamp: 2, priceUsd: 62000 },
        { timestamp: 3, priceUsd: 67500 },
      ],
    });
  });

  it("maps Open-Meteo data into the dashboard contract", () => {
    const weather = mapOpenMeteoResponse(
      { name: "Chicago", country_code: "US", latitude: 41.85, longitude: -87.65 },
      {
        current: {
          temperature_2m: 70.4,
          apparent_temperature: 68.6,
          relative_humidity_2m: 52,
          weather_code: 0,
          is_day: 1,
        },
        hourly: {
          time: ["2026-07-18T09:00"],
          temperature_2m: [71.2],
          precipitation_probability: [15],
          weather_code: [1],
          is_day: [1],
        },
        daily: {
          time: ["2026-07-18"],
          temperature_2m_max: [82.4],
          temperature_2m_min: [64.2],
          sunrise: ["2026-07-18T05:32"],
          sunset: ["2026-07-18T20:24"],
          precipitation_probability_max: [25],
          weather_code: [2],
        },
      },
    );

    expect(weather).toEqual({
      city: "Chicago",
      country: "US",
      temperature: 70,
      feelsLike: 69,
      humidity: 52,
      weatherDescription: "clear sky",
      icon: "☀️",
      hourlyForecast: [
        {
          time: "2026-07-18T09:00",
          temperature: 71,
          precipitationProbability: 15,
          weatherDescription: "mainly clear",
          icon: "🌤️",
        },
      ],
      dailyForecast: [
        {
          date: "2026-07-18",
          high: 82,
          low: 64,
          sunrise: "2026-07-18T05:32",
          sunset: "2026-07-18T20:24",
          precipitationProbability: 25,
          weatherDescription: "partly cloudy",
          icon: "⛅",
        },
      ],
    });
  });

  it("maps Guardian data and supplies a null thumbnail fallback", () => {
    const articles = mapGuardianResponse({
      response: {
        results: [
          {
            id: "technology/example",
            sectionName: "Technology",
            webPublicationDate: "2026-06-18T12:00:00Z",
            webTitle: "Example headline",
            webUrl: "https://www.theguardian.com/example",
          },
        ],
      },
    });

    expect(articles[0]).toEqual({
      id: "technology/example",
      title: "Example headline",
      section: "Technology",
      publishedAt: "2026-06-18T12:00:00Z",
      url: "https://www.theguardian.com/example",
      thumbnail: null,
    });
  });

  it("normalizes known categories and rejects unknown categories", () => {
    expect(parseNewsCategory("TECHNOLOGY")).toBe("technology");
    expect(parseNewsCategory(undefined)).toBe("all");
    expect(parseNewsCategory("not-a-section")).toBeNull();
  });
});
