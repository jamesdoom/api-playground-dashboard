import { useEffect, useState } from "react";
import { fetchStockQuotes } from "../services/api";
import type { StockQuote } from "../types/stocks";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const updatedTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function formatChange(change: number): string {
  const prefix = change > 0 ? "+" : "";
  return `${prefix}${change.toFixed(2)}%`;
}

function StocksSkeleton() {
  return (
    <div className="stocks-list stocks-skeleton" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="stock-row" key={index}>
          <span className="skeleton-block stock-symbol-skeleton" />
          <div className="skeleton-stack">
            <span className="skeleton-block skeleton-line-medium" />
            <span className="skeleton-block skeleton-line-short" />
          </div>
          <div className="skeleton-stack stock-value-skeleton">
            <span className="skeleton-block skeleton-line-wide" />
            <span className="skeleton-block skeleton-line-medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StocksWidget() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuotes() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const stocks = await fetchStockQuotes(controller.signal);
        setQuotes(stocks.quotes);
        setUpdatedAt(new Date());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to load stock prices.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadQuotes();
    return () => controller.abort();
  }, [refreshCount]);

  return (
    <section
      className="widget stocks-widget"
      aria-labelledby="stocks-widget-title"
      aria-busy={isLoading}
    >
      <div className="widget-header">
        <div>
          <p className="eyebrow">Finnhub API</p>
          <h2 id="stocks-widget-title">Stock watchlist</h2>
        </div>
        <span className="market-currency">USD</span>
      </div>

      {errorMessage ? (
        <div className="error-state" role="alert">
          <p>{errorMessage}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setRefreshCount((count) => count + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {isLoading && quotes.length === 0 ? (
        <>
          <p className="sr-only" role="status">Loading current stock prices...</p>
          <StocksSkeleton />
        </>
      ) : null}

      {quotes.length > 0 ? (
        <>
          <ul className="stocks-list" aria-live="polite">
            {quotes.map((quote) => {
              const direction = quote.changePercent > 0
                ? "positive"
                : quote.changePercent < 0
                  ? "negative"
                  : "neutral";

              return (
                <li className="stock-row" key={quote.symbol}>
                  <span className="stock-symbol" aria-hidden="true">
                    {quote.symbol.slice(0, 1)}
                  </span>
                  <div className="stock-name">
                    <strong>{quote.name}</strong>
                    <span>{quote.symbol}</span>
                  </div>
                  <div className="stock-value">
                    <strong>{priceFormatter.format(quote.priceUsd)}</strong>
                    <span
                      className={`stock-change stock-change-${direction}`}
                      aria-label={`${quote.name} daily change ${formatChange(quote.changePercent)}`}
                    >
                      {formatChange(quote.changePercent)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="market-disclaimer">Quotes may be delayed.</p>

          <div className="widget-footer">
            <p>{updatedAt ? `Updated ${updatedTimeFormatter.format(updatedAt)}` : null}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setRefreshCount((count) => count + 1)}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default StocksWidget;
