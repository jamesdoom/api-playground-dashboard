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
          icon: "01d",
        }),
      );
    });

    expect(await screen.findByText("Chicago, US")).toBeInTheDocument();
    expect(screen.getByText("70°F")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
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

  it("shows an accessible fallback when the weather icon fails", async () => {
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
          icon: "01d",
        }),
      ),
    );

    render(<WeatherWidget />);
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Chicago" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    const weatherIcon = await screen.findByRole("img", { name: "clear sky" });
    fireEvent.error(weatherIcon);

    expect(screen.getByRole("img", { name: "clear sky icon unavailable" })).toBeInTheDocument();
  });
});
