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

function historyResponse(id: "bitcoin" | "ethereum" | "solana" | "dogecoin") {
  const asset = {
    bitcoin: { name: "Bitcoin", symbol: "BTC", prices: [60000, 62000, 67500] },
    ethereum: { name: "Ethereum", symbol: "ETH", prices: [3700, 3600, 3500] },
    solana: { name: "Solana", symbol: "SOL", prices: [145, 145, 145] },
    dogecoin: { name: "Dogecoin", symbol: "DOGE", prices: [0.14, 0.15, 0.15] },
  }[id];

  return {
    id,
    name: asset.name,
    symbol: asset.symbol,
    days: 7,
    prices: asset.prices.map((priceUsd, index) => ({ timestamp: index + 1, priceUsd })),
  };
}

describe("CryptoWidget", () => {
  it("shows loading, current prices, movement, and refresh controls", async () => {
    let resolveRequest!: (response: Response) => void;
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal("fetch", vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/crypto/history")) {
        const id = new URL(url, "http://localhost").searchParams.get("id") as "bitcoin" | "ethereum" | "solana";
        return Promise.resolve(jsonResponse(historyResponse(id)));
      }

      return request;
    }));

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
    expect(await screen.findByText(/Bitcoin rose 12.50% over seven days/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Seven-day trend Bitcoin rose 12.50%/i })).toBeInTheDocument();
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

  it("retries a failed historical trend", async () => {
    let historyRequests = 0;
    vi.stubGlobal("fetch", vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (!url.includes("/crypto/history")) {
        return Promise.resolve(jsonResponse({ assets: [cryptoResponse.assets[0]] }));
      }

      historyRequests += 1;
      return Promise.resolve(
        historyRequests === 1
          ? jsonResponse({ message: "Crypto prices are unavailable right now." }, 500)
          : jsonResponse(historyResponse("bitcoin")),
      );
    }));

    render(<CryptoWidget />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Bitcoin trend unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Retry trend" }));

    expect(await screen.findByText(/Bitcoin rose 12.50% over seven days/)).toBeInTheDocument();
  });
});
