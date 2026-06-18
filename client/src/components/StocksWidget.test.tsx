import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StocksWidget from "./StocksWidget";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const stocksResponse = {
  quotes: [
    { symbol: "AAPL", name: "Apple", priceUsd: 205.5, changePercent: 1.25 },
    { symbol: "MSFT", name: "Microsoft", priceUsd: 450.25, changePercent: -0.75 },
    { symbol: "NVDA", name: "Nvidia", priceUsd: 150, changePercent: 0 },
  ],
};

describe("StocksWidget", () => {
  it("shows loading, current quotes, movement, and refresh controls", async () => {
    let resolveRequest!: (response: Response) => void;
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(request));

    render(<StocksWidget />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading current stock prices");

    await act(async () => {
      resolveRequest(jsonResponse(stocksResponse));
    });

    expect(await screen.findByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("$205.50")).toBeInTheDocument();
    expect(screen.getByLabelText("Apple daily change +1.25%")).toBeInTheDocument();
    expect(screen.getByText("Quotes may be delayed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
  });

  it("shows the API error and a retry action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ message: "Stock prices are unavailable right now." }, 500),
      ),
    );

    render(<StocksWidget />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Stock prices are unavailable right now.",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });
});
