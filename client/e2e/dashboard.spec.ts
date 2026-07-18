import { expect, test, type Page } from "@playwright/test";

const newsApiPattern = /\/api\/news(?:\?.*)?$/;
const cryptoHistoryApiPattern = /\/api\/crypto\/history(?:\?.*)?$/;

const cryptoHistoryCatalog = {
  bitcoin: { name: "Bitcoin", symbol: "BTC", prices: [60000, 62000, 67500] },
  ethereum: { name: "Ethereum", symbol: "ETH", prices: [3700, 3600, 3500] },
  solana: { name: "Solana", symbol: "SOL", prices: [140, 142, 145] },
  dogecoin: { name: "Dogecoin", symbol: "DOGE", prices: [0.14, 0.145, 0.15] },
  cardano: { name: "Cardano", symbol: "ADA", prices: [0.62, 0.61, 0.6] },
  ripple: { name: "XRP", symbol: "XRP", prices: [0.48, 0.49, 0.5] },
} as const;

function getCryptoHistory(
  id: keyof typeof cryptoHistoryCatalog,
  days: 7 | 30 | 90 = 7,
) {
  const asset = cryptoHistoryCatalog[id];
  return {
    id,
    name: asset.name,
    symbol: asset.symbol,
    days,
    prices: asset.prices.map((priceUsd, index) => ({ timestamp: index + 1, priceUsd })),
  };
}

const newsResponse = {
  articles: [
    {
      id: "technology/example",
      title: "Example technology headline",
      section: "Technology",
      publishedAt: "2026-06-18T12:00:00Z",
      url: "https://www.theguardian.com/example",
      thumbnail: null,
    },
  ],
};

async function mockDashboardApis(page: Page) {
  await page.route(/\/api\/health$/, (route) =>
    route.fulfill({ json: { message: "Serverless API is running" } }),
  );
  await page.route(/\/api\/weather(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        city: "Chicago",
        country: "US",
        temperature: 70,
        feelsLike: 69,
        humidity: 50,
        weatherDescription: "clear sky",
        icon: "",
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
      },
    }),
  );
  await page.route(cryptoHistoryApiPattern, (route) => {
    const searchParams = new URL(route.request().url()).searchParams;
    const id = searchParams.get("id") as keyof typeof cryptoHistoryCatalog;
    const days = Number(searchParams.get("days")) as 7 | 30 | 90;
    return route.fulfill({ json: getCryptoHistory(id, days) });
  });
  await page.route(/\/api\/crypto(?:\?.*)?$/, (route) => {
    const catalog = {
      bitcoin: { id: "bitcoin", name: "Bitcoin", symbol: "BTC", priceUsd: 67500, change24h: 2.5 },
      ethereum: { id: "ethereum", name: "Ethereum", symbol: "ETH", priceUsd: 3500, change24h: -1.25 },
      solana: { id: "solana", name: "Solana", symbol: "SOL", priceUsd: 145, change24h: 0.5 },
      dogecoin: { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", priceUsd: 0.15, change24h: 1.2 },
      cardano: { id: "cardano", name: "Cardano", symbol: "ADA", priceUsd: 0.6, change24h: -0.4 },
      ripple: { id: "ripple", name: "XRP", symbol: "XRP", priceUsd: 0.5, change24h: 0.8 },
    } as const;
    const ids = new URL(route.request().url()).searchParams.get("ids")?.split(",") ?? [];
    const assets = ids.flatMap((id) => id in catalog ? [catalog[id as keyof typeof catalog]] : []);
    return route.fulfill({ json: { assets } });
  });
  await page.route(/\/api\/stocks(?:\?.*)?$/, (route) => {
    const catalog = {
      AAPL: { symbol: "AAPL", name: "Apple", priceUsd: 205.5, changePercent: 1.25 },
      MSFT: { symbol: "MSFT", name: "Microsoft", priceUsd: 450.25, changePercent: -0.75 },
      NVDA: { symbol: "NVDA", name: "Nvidia", priceUsd: 150, changePercent: 0.5 },
      GOOGL: { symbol: "GOOGL", name: "Alphabet", priceUsd: 180, changePercent: 0.35 },
      AMZN: { symbol: "AMZN", name: "Amazon", priceUsd: 210, changePercent: -0.2 },
      TSLA: { symbol: "TSLA", name: "Tesla", priceUsd: 320, changePercent: 2.1 },
    } as const;
    const symbols = new URL(route.request().url()).searchParams.get("symbols")?.split(",") ?? [];
    const quotes = symbols.flatMap((symbol) => (
      symbol in catalog ? [catalog[symbol as keyof typeof catalog]] : []
    ));
    return route.fulfill({ json: { quotes } });
  });
  await page.route(newsApiPattern, (route) => route.fulfill({ json: newsResponse }));
}

test.beforeEach(async ({ page }) => {
  await mockDashboardApis(page);
  await page.goto("/");
});

test("renders every dashboard integration and searches for weather", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "API Playground Dashboard" })).toBeVisible();
  await expect(page.getByText("Bitcoin", { exact: true })).toBeVisible();
  await expect(page.getByText("Apple", { exact: true })).toBeVisible();
  await expect(page.getByText("Example technology headline")).toBeVisible();

  const weather = page.getByRole("region", { name: "Weather" });
  await weather.getByLabel("City").fill("Chicago");
  await weather.getByRole("button", { name: "Search" }).click();
  await expect(weather.getByText("Chicago, US")).toBeVisible();
  await expect(weather.getByRole("heading", { name: "Next 24 hours" })).toBeVisible();
  await expect(weather.getByRole("heading", { name: "7-day forecast" })).toBeVisible();
});

test("keeps widgets and weather controls inside the viewport", async ({ page }) => {
  await expect(page.getByText("Bitcoin", { exact: true })).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const pageWidth = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.clientWidth);

  for (const widget of await page.locator(".widget").all()) {
    const box = await widget.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  }

  const weather = page.getByRole("region", { name: "Weather" });
  const weatherBox = await weather.boundingBox();
  const searchBox = await weather.getByRole("button", { name: "Search" }).boundingBox();
  expect(weatherBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(searchBox!.x + searchBox!.width).toBeLessThanOrEqual(weatherBox!.x + weatherBox!.width);
});

test("uses the expected responsive widget order", async ({ page }, testInfo) => {
  await expect(page.getByText("Bitcoin", { exact: true })).toBeVisible();

  const weather = await page.getByRole("region", { name: "Weather" }).boundingBox();
  const crypto = await page.getByRole("region", { name: "Crypto market" }).boundingBox();
  const stocks = await page.getByRole("region", { name: "Stock watchlist" }).boundingBox();
  const news = await page.getByRole("region", { name: "Latest headlines" }).boundingBox();

  expect(weather).not.toBeNull();
  expect(crypto).not.toBeNull();
  expect(stocks).not.toBeNull();
  expect(news).not.toBeNull();

  if (testInfo.project.name === "desktop") {
    expect(Math.abs(weather!.y - crypto!.y)).toBeLessThanOrEqual(1);
    expect(stocks!.y).toBeGreaterThan(weather!.y + weather!.height);
    expect(news!.y).toBeGreaterThan(stocks!.y + stocks!.height);
    expect(news!.y).toBeGreaterThan(crypto!.y + crypto!.height);
  } else if (testInfo.project.name === "tablet") {
    expect(Math.abs(weather!.y - crypto!.y)).toBeLessThanOrEqual(1);
    expect(stocks!.y).toBeGreaterThan(weather!.y + weather!.height);
    expect(news!.y).toBeGreaterThan(stocks!.y + stocks!.height);
    expect(news!.y).toBeGreaterThan(crypto!.y + crypto!.height);
  } else {
    expect(stocks!.y).toBeGreaterThan(weather!.y + weather!.height);
    expect(crypto!.y).toBeGreaterThan(stocks!.y + stocks!.height);
    expect(news!.y).toBeGreaterThan(crypto!.y + crypto!.height);
  }
});

test("recovers from an API refresh error", async ({ page }) => {
  const news = page.getByRole("region", { name: "Latest headlines" });
  await expect(news.getByText("Example technology headline")).toBeVisible();

  await page.unroute(newsApiPattern);
  let requestCount = 0;
  await page.route(newsApiPattern, (route) => {
    requestCount += 1;

    if (requestCount === 1) {
      return route.fulfill({ status: 500, json: { message: "Headlines are unavailable right now." } });
    }

    return route.fulfill({ json: newsResponse });
  });

  await news.getByRole("button", { name: "Refresh" }).click();
  await expect(news.getByRole("alert")).toContainText("Headlines are unavailable right now.");
  await news.getByRole("button", { name: "Retry" }).click();
  await expect(news.getByRole("alert")).not.toBeVisible();
  await expect(news.getByText("Example technology headline")).toBeVisible();
});

test("customizes and restores both market watchlists", async ({ page }) => {
  const crypto = page.getByRole("region", { name: "Crypto market" });
  const stocks = page.getByRole("region", { name: "Stock watchlist" });

  await crypto.getByLabel("Add crypto asset").selectOption("dogecoin");
  await crypto.getByRole("button", { name: "Add" }).click();
  await expect(crypto.getByText("Dogecoin", { exact: true })).toBeVisible();
  await crypto.getByRole("button", { name: "Remove Bitcoin" }).click();

  await stocks.getByLabel("Add stock").selectOption("GOOGL");
  await stocks.getByRole("button", { name: "Add" }).click();
  await expect(stocks.getByText("Alphabet")).toBeVisible();
  await stocks.getByRole("button", { name: "Remove Apple" }).click();

  await page.reload();

  await expect(crypto.getByText("Dogecoin", { exact: true })).toBeVisible();
  await expect(crypto.getByRole("button", { name: "Remove Bitcoin" })).toHaveCount(0);
  await expect(stocks.getByText("Alphabet")).toBeVisible();
  await expect(stocks.getByRole("button", { name: "Remove Apple" })).toHaveCount(0);
});

test("announces crypto trends and recovers a failed history request", async ({ page }) => {
  const crypto = page.getByRole("region", { name: "Crypto market" });
  await expect(crypto.getByText(/Bitcoin rose 12.50% over seven days/)).toBeVisible();
  await expect(crypto.getByRole("img", { name: /Seven-day trend Bitcoin rose 12.50%/i })).toBeVisible();

  await page.unroute(cryptoHistoryApiPattern);
  let failBitcoin = true;
  await page.route(cryptoHistoryApiPattern, async (route) => {
    const id = new URL(route.request().url()).searchParams.get("id") as keyof typeof cryptoHistoryCatalog;

    if (id === "bitcoin") {
      await new Promise((resolve) => setTimeout(resolve, 150));

      if (failBitcoin) {
        return route.fulfill({ status: 500, json: { message: "Crypto history is unavailable." } });
      }
    }

    return route.fulfill({ json: getCryptoHistory(id) });
  });

  await page.reload();
  await expect(crypto.getByRole("status").filter({ hasText: "Loading Bitcoin seven-day price trend" })).toBeVisible();
  await expect(crypto.getByRole("alert").filter({ hasText: "Bitcoin trend unavailable" })).toBeVisible();
  failBitcoin = false;
  await crypto.getByRole("button", { name: "Retry trend" }).click();
  await expect(crypto.getByText(/Bitcoin rose 12.50% over seven days/)).toBeVisible();
});

test("customizes widget visibility and order with the keyboard", async ({ page }) => {
  await page.getByRole("button", { name: "Customize dashboard" }).click();

  const showWeather = page.getByRole("checkbox", { name: "Show Weather" });
  await showWeather.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("region", { name: "Weather" })).toHaveCount(0);

  const moveCryptoUp = page.getByRole("button", { name: "Move Crypto market up" });
  await moveCryptoUp.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("status").filter({ hasText: "Crypto market moved up" })).toBeAttached();
  await page.reload();

  await expect(page.getByRole("region", { name: "Weather" })).toHaveCount(0);
  await expect(page.locator(".widget h2")).toHaveText([
    "Crypto market",
    "Stock watchlist",
    "Latest headlines",
  ]);

  await page.getByRole("button", { name: "Customize dashboard" }).click();
  await expect(page.getByRole("checkbox", { name: "Show Weather" })).not.toBeChecked();
  await page.getByRole("button", { name: "Restore defaults" }).click();

  await expect(page.getByRole("region", { name: "Weather" })).toBeVisible();
  await expect(page.locator(".widget h2")).toHaveText([
    "Weather",
    "Stock watchlist",
    "Crypto market",
    "Latest headlines",
  ]);
});

test("opens a shareable crypto detail view and changes its range", async ({ page }) => {
  const crypto = page.getByRole("region", { name: "Crypto market" });
  const bitcoin = crypto.getByRole("listitem").filter({ hasText: "Bitcoin" });
  const detailsButton = bitcoin.getByRole("button", { name: "View details" });

  await detailsButton.click();
  await expect(crypto.getByRole("heading", { name: "Bitcoin (BTC)" })).toBeVisible();
  await expect(page).toHaveURL(/\?crypto=bitcoin&range=7$/);
  await expect(crypto.getByText("Average")).toBeVisible();

  await crypto.getByRole("button", { name: "30D" }).click();
  await expect(crypto.getByRole("button", { name: "30D" })).toHaveAttribute("aria-pressed", "true");
  await expect(crypto.getByText(/Bitcoin rose 12.50% over 30 days/)).toBeVisible();
  await expect(page).toHaveURL(/\?crypto=bitcoin&range=30$/);
  const pageWidth = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.clientWidth);

  await page.reload();
  await expect(crypto.getByRole("heading", { name: "Bitcoin (BTC)" })).toBeVisible();
  await expect(crypto.getByRole("button", { name: "30D" })).toHaveAttribute("aria-pressed", "true");

  await crypto.getByRole("button", { name: "Close details" }).click();
  await expect(crypto.getByRole("heading", { name: "Bitcoin (BTC)" })).toHaveCount(0);
  await expect(detailsButton).toBeFocused();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/?crypto=dogecoin&range=90");
  await expect(crypto.getByRole("heading", { name: "Dogecoin (DOGE)" })).toBeVisible();
  await expect(crypto.getByRole("button", { name: "90D" })).toHaveAttribute("aria-pressed", "true");
});
