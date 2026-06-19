import { describe, expect, it } from "vitest";
import { parseCryptoIds } from "../../../shared/contracts/crypto.ts";
import { parseNewsCategory } from "../../../shared/contracts/news.ts";
import { AVAILABLE_STOCKS, parseStockSymbols } from "../../../shared/contracts/stocks.ts";
import { mapCoinGeckoResponse } from "../../../shared/services/cryptoService.ts";
import { mapGuardianResponse } from "../../../shared/services/newsService.ts";
import { mapFinnhubQuote } from "../../../shared/services/stocksService.ts";
import { mapOpenWeatherResponse } from "../../../shared/services/weatherService.ts";

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

  it("maps OpenWeather data into the dashboard contract", () => {
    const weather = mapOpenWeatherResponse({
      name: "Chicago",
      sys: { country: "US" },
      main: { temp: 70.4, feels_like: 68.6, humidity: 52 },
      weather: [{ description: "clear sky", icon: "01d" }],
    });

    expect(weather).toEqual({
      city: "Chicago",
      country: "US",
      temperature: 70,
      feelsLike: 69,
      humidity: 52,
      weatherDescription: "clear sky",
      icon: "01d",
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
