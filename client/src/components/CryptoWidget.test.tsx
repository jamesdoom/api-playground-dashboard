import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("restores an empty watchlist and persists an added asset", async () => {
    window.localStorage.setItem("dashboard-crypto-watchlist", "[]");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        assets: [
          { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", priceUsd: 0.15, change24h: 1.2 },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<CryptoWidget />);
    expect(screen.getByText("Add an asset to start your crypto watchlist.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add crypto asset"), {
      target: { value: "dogecoin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Dogecoin")).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("dashboard-crypto-watchlist")).toBe('["dogecoin"]');
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/crypto?ids=dogecoin",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("disables additions at the five-asset limit", () => {
    window.localStorage.setItem(
      "dashboard-crypto-watchlist",
      '["bitcoin","ethereum","solana","dogecoin","cardano"]',
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(cryptoResponse)));

    render(<CryptoWidget />);

    expect(screen.getByText("Five-asset limit reached.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
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
