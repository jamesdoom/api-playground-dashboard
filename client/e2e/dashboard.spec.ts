import { expect, test, type Page } from "@playwright/test";

const newsApiPattern = /\/api\/news(?:\?.*)?$/;

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
      },
    }),
  );
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
  await expect(page.getByText("Bitcoin")).toBeVisible();
  await expect(page.getByText("Apple", { exact: true })).toBeVisible();
  await expect(page.getByText("Example technology headline")).toBeVisible();

  const weather = page.getByRole("region", { name: "Weather" });
  await weather.getByLabel("City").fill("Chicago");
  await weather.getByRole("button", { name: "Search" }).click();
  await expect(weather.getByText("Chicago, US")).toBeVisible();
});

test("keeps widgets and weather controls inside the viewport", async ({ page }) => {
  await expect(page.getByText("Bitcoin")).toBeVisible();

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
  await expect(page.getByText("Bitcoin")).toBeVisible();

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
    expect(Math.abs(weather!.y - stocks!.y)).toBeLessThanOrEqual(1);
    expect(news!.y).toBeGreaterThan(weather!.y + weather!.height);
  } else if (testInfo.project.name === "tablet") {
    expect(Math.abs(weather!.y - crypto!.y)).toBeLessThanOrEqual(1);
    expect(stocks!.y).toBeGreaterThan(weather!.y + weather!.height);
    expect(news!.y).toBeGreaterThan(stocks!.y + stocks!.height);
  } else {
    expect(crypto!.y).toBeGreaterThan(weather!.y + weather!.height);
    expect(stocks!.y).toBeGreaterThan(crypto!.y + crypto!.height);
    expect(news!.y).toBeGreaterThan(stocks!.y + stocks!.height);
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
  await expect(crypto.getByText("Dogecoin")).toBeVisible();
  await crypto.getByRole("button", { name: "Remove Bitcoin" }).click();

  await stocks.getByLabel("Add stock").selectOption("GOOGL");
  await stocks.getByRole("button", { name: "Add" }).click();
  await expect(stocks.getByText("Alphabet")).toBeVisible();
  await stocks.getByRole("button", { name: "Remove Apple" }).click();

  await page.reload();

  await expect(crypto.getByText("Dogecoin")).toBeVisible();
  await expect(crypto.getByRole("button", { name: "Remove Bitcoin" })).toHaveCount(0);
  await expect(stocks.getByText("Alphabet")).toBeVisible();
  await expect(stocks.getByRole("button", { name: "Remove Apple" })).toHaveCount(0);
});
