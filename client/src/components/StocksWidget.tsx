import { useEffect, useState } from "react";
import { fetchStockQuotes } from "../services/api";
import {
  AVAILABLE_STOCKS,
  DEFAULT_STOCK_SYMBOLS,
  MAX_STOCK_WATCHLIST_ITEMS,
  isStockSymbol,
  type StockQuote,
  type StockSymbol,
} from "../types/stocks";

const STOCKS_STORAGE_KEY = "dashboard-stocks-watchlist";
const PREVIOUS_DEFAULT_STOCK_SYMBOLS = ["AAPL", "MSFT", "NVDA"];
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const updatedTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function getStoredStockSymbols(): StockSymbol[] {
  try {
    const stored = window.localStorage.getItem(STOCKS_STORAGE_KEY);

    if (stored === null) {
      return [...DEFAULT_STOCK_SYMBOLS];
    }

    const parsed = JSON.parse(stored) as unknown;

    if (!Array.isArray(parsed)) {
      return [...DEFAULT_STOCK_SYMBOLS];
    }

    const symbols = [...new Set(parsed.filter((value): value is StockSymbol => (
      typeof value === "string" && isStockSymbol(value)
    )))].slice(0, MAX_STOCK_WATCHLIST_ITEMS);

    if (
      symbols.length === PREVIOUS_DEFAULT_STOCK_SYMBOLS.length
      && symbols.every((symbol, index) => symbol === PREVIOUS_DEFAULT_STOCK_SYMBOLS[index])
    ) {
      return [...DEFAULT_STOCK_SYMBOLS];
    }

    return symbols;
  } catch {
    return [...DEFAULT_STOCK_SYMBOLS];
  }
}

function saveStockSymbols(symbols: readonly StockSymbol[]) {
  try {
    window.localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(symbols));
  } catch {
    // Storage is optional; the watchlist still works for the current visit.
  }
}

function formatChange(change: number): string {
  const prefix = change > 0 ? "+" : "";
  return `${prefix}${change.toFixed(2)}%`;
}

function StocksSkeleton({ count }: { count: number }) {
  return (
    <div className="stocks-list stocks-skeleton" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
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
  const [selectedSymbols, setSelectedSymbols] = useState<StockSymbol[]>(getStoredStockSymbols);
  const [selectedOption, setSelectedOption] = useState("");
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(selectedSymbols.length > 0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const availableOptions = AVAILABLE_STOCKS.filter(
    (stock) => !selectedSymbols.includes(stock.symbol),
  );
  const optionToAdd = availableOptions.some((stock) => stock.symbol === selectedOption)
    ? selectedOption
    : (availableOptions[0]?.symbol ?? "");
  const isAtLimit = selectedSymbols.length >= MAX_STOCK_WATCHLIST_ITEMS;

  useEffect(() => {
    if (selectedSymbols.length === 0) {
      return;
    }

    const controller = new AbortController();

    async function loadQuotes() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const stocks = await fetchStockQuotes(selectedSymbols, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

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
  }, [selectedSymbols, refreshCount]);

  function updateWatchlist(symbols: StockSymbol[]) {
    setSelectedSymbols(symbols);
    setQuotes((current) => current.filter((quote) => symbols.includes(quote.symbol)));

    if (symbols.length === 0) {
      setErrorMessage("");
      setIsLoading(false);
      setUpdatedAt(null);
    }

    saveStockSymbols(symbols);
  }

  function handleAdd() {
    if (!isAtLimit && isStockSymbol(optionToAdd) && !selectedSymbols.includes(optionToAdd)) {
      updateWatchlist([...selectedSymbols, optionToAdd]);
      setSelectedOption("");
    }
  }

  function handleRemove(symbol: StockSymbol) {
    updateWatchlist(selectedSymbols.filter((selectedSymbol) => selectedSymbol !== symbol));
  }

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

      <div className="watchlist-controls">
        <label className="sr-only" htmlFor="stocks-selector">Add stock</label>
        <select
          id="stocks-selector"
          value={optionToAdd}
          onChange={(event) => setSelectedOption(event.target.value)}
          disabled={isAtLimit || availableOptions.length === 0}
        >
          {availableOptions.map((stock) => (
            <option key={stock.symbol} value={stock.symbol}>{stock.name}</option>
          ))}
        </select>
        <button
          type="button"
          className="secondary-button"
          onClick={handleAdd}
          disabled={isAtLimit || !optionToAdd}
        >
          Add
        </button>
      </div>

      {isAtLimit ? <p className="watchlist-message">Five-stock limit reached.</p> : null}

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
          <StocksSkeleton count={selectedSymbols.length} />
        </>
      ) : null}

      {!isLoading && selectedSymbols.length === 0 ? (
        <p className="watchlist-empty">Add a company to start your stock watchlist.</p>
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
                <li className="stock-row watchlist-row" key={quote.symbol}>
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
                  <button
                    type="button"
                    className="watchlist-remove"
                    onClick={() => handleRemove(quote.symbol)}
                    aria-label={`Remove ${quote.name}`}
                  >
                    &times;
                  </button>
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
