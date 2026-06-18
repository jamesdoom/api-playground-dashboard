import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import newsHandler from "../../../api/news.ts";
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
    process.env.OPENWEATHER_API_KEY = "weather-key";
    process.env.GUARDIAN_API_KEY = "news-key";
  });

  afterEach(() => {
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.GUARDIAN_API_KEY;
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

  it("returns mapped weather data with the CDN cache policy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "Chicago",
            sys: { country: "US" },
            main: { temp: 70, feels_like: 69, humidity: 50 },
            weather: [{ description: "clear sky", icon: "01d" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const result = createApiResponse();

    await weatherHandler({ method: "GET", query: { city: "Chicago" } }, result.response);

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({ city: "Chicago", temperature: 70 });
    expect(result.headers.get("Cache-Control")).toContain("s-maxage=300");
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
});
