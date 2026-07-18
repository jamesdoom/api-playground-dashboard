import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WeatherWidget from "./WeatherWidget";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("WeatherWidget", () => {
  it("shows loading and success states and remembers the city", async () => {
    let resolveRequest!: (response: Response) => void;
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(request));

    render(<WeatherWidget />);
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Chicago" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByRole("status")).toHaveTextContent("Fetching current conditions");

    await act(async () => {
      resolveRequest(
        jsonResponse({
          city: "Chicago",
          country: "US",
          temperature: 70,
          feelsLike: 69,
          humidity: 50,
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
        }),
      );
    });

    expect(await screen.findByText("Chicago, US")).toBeInTheDocument();
    expect(screen.getByText("70°F")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
    expect(screen.getByRole("heading", { name: "Next 24 hours" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "7-day forecast" })).toBeInTheDocument();
    expect(screen.getByText("82°")).toBeInTheDocument();
    expect(screen.getByTitle("Sunrise")).toHaveTextContent("5:32 AM");
    expect(window.localStorage.getItem("dashboard-weather-city")).toBe("Chicago");
  });

  it("shows the API error and a retry action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "We could not find weather for that city." }, 404)),
    );

    render(<WeatherWidget />);
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Unknown" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not find weather for that city.",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });

  it("shows an accessible provider-independent weather icon", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          city: "Chicago",
          country: "US",
          temperature: 70,
          feelsLike: 69,
          humidity: 50,
          weatherDescription: "clear sky",
          icon: "☀️",
        }),
      ),
    );

    render(<WeatherWidget />);
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Chicago" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("img", { name: "clear sky" })).toHaveTextContent("☀️");
  });
});
