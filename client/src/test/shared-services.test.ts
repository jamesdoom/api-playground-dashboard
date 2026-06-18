import { describe, expect, it } from "vitest";
import { parseNewsCategory } from "../../../shared/contracts/news.ts";
import { mapGuardianResponse } from "../../../shared/services/newsService.ts";
import { mapOpenWeatherResponse } from "../../../shared/services/weatherService.ts";

describe("shared provider transformations", () => {
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
