import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CryptoWidget from "./CryptoWidget";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const cryptoResponse = {
  assets: [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC", priceUsd: 67500, change24h: 2.5 },
    { id: "ethereum", name: "Ethereum", symbol: "ETH", priceUsd: 3500, change24h: -1.25 },
    { id: "solana", name: "Solana", symbol: "SOL", priceUsd: 145, change24h: 0 },
  ],
};

describe("CryptoWidget", () => {
  it("shows loading, current prices, movement, and refresh controls", async () => {
    let resolveRequest!: (response: Response) => void;
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(request));

    render(<CryptoWidget />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading current crypto prices");

    await act(async () => {
      resolveRequest(jsonResponse(cryptoResponse));
    });

    expect(await screen.findByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("$67,500.00")).toBeInTheDocument();
    expect(screen.getByLabelText("Bitcoin 24-hour change +2.50%")).toBeInTheDocument();
    expect(screen.getByText(/^Updated /)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
  });

  it("shows the API error and a retry action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ message: "Crypto prices are unavailable right now." }, 500),
      ),
    );

    render(<CryptoWidget />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Crypto prices are unavailable right now.",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });
});
