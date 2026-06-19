import { useEffect, useState } from "react";
import { fetchCryptoPrices } from "../services/api";
import {
  AVAILABLE_CRYPTOCURRENCIES,
  DEFAULT_CRYPTO_IDS,
  MAX_WATCHLIST_ITEMS,
  isCryptoId,
  type CryptoAsset,
  type CryptoId,
} from "../types/crypto";
import CryptoTrendChart from "./CryptoTrendChart";

const CRYPTO_STORAGE_KEY = "dashboard-crypto-watchlist";
const updatedTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function getStoredCryptoIds(): CryptoId[] {
  try {
    const stored = window.localStorage.getItem(CRYPTO_STORAGE_KEY);

    if (stored === null) {
      return [...DEFAULT_CRYPTO_IDS];
    }

    const parsed = JSON.parse(stored) as unknown;

    if (!Array.isArray(parsed)) {
      return [...DEFAULT_CRYPTO_IDS];
    }

    return [...new Set(parsed.filter((value): value is CryptoId => (
      typeof value === "string" && isCryptoId(value)
    )))].slice(0, MAX_WATCHLIST_ITEMS);
  } catch {
    return [...DEFAULT_CRYPTO_IDS];
  }
}

function saveCryptoIds(ids: readonly CryptoId[]) {
  try {
    window.localStorage.setItem(CRYPTO_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage is optional; the watchlist still works for the current visit.
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: price < 1 ? 4 : 2,
  }).format(price);
}

function formatChange(change: number): string {
  const prefix = change > 0 ? "+" : "";
  return `${prefix}${change.toFixed(2)}%`;
}

function CryptoSkeleton({ count }: { count: number }) {
  return (
    <div className="crypto-list crypto-skeleton" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="crypto-row" key={index}>
          <span className="skeleton-block crypto-symbol-skeleton" />
          <div className="skeleton-stack">
            <span className="skeleton-block skeleton-line-medium" />
            <span className="skeleton-block skeleton-line-short" />
          </div>
          <div className="skeleton-stack crypto-value-skeleton">
            <span className="skeleton-block skeleton-line-wide" />
            <span className="skeleton-block skeleton-line-medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CryptoWidget() {
  const [selectedIds, setSelectedIds] = useState<CryptoId[]>(getStoredCryptoIds);
  const [selectedOption, setSelectedOption] = useState("");
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(selectedIds.length > 0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const availableOptions = AVAILABLE_CRYPTOCURRENCIES.filter(
    (crypto) => !selectedIds.includes(crypto.id),
  );
  const optionToAdd = availableOptions.some((crypto) => crypto.id === selectedOption)
    ? selectedOption
    : (availableOptions[0]?.id ?? "");
  const isAtLimit = selectedIds.length >= MAX_WATCHLIST_ITEMS;

  useEffect(() => {
    if (selectedIds.length === 0) {
      return;
    }

    const controller = new AbortController();

    async function loadPrices() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const crypto = await fetchCryptoPrices(selectedIds, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setAssets(crypto.assets);
        setUpdatedAt(new Date());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to load crypto prices.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadPrices();
    return () => controller.abort();
  }, [selectedIds, refreshCount]);

  function updateWatchlist(ids: CryptoId[]) {
    setSelectedIds(ids);
    setAssets((current) => current.filter((asset) => ids.includes(asset.id)));

    if (ids.length === 0) {
      setErrorMessage("");
      setIsLoading(false);
      setUpdatedAt(null);
    }

    saveCryptoIds(ids);
  }

  function handleAdd() {
    if (!isAtLimit && isCryptoId(optionToAdd) && !selectedIds.includes(optionToAdd)) {
      updateWatchlist([...selectedIds, optionToAdd]);
      setSelectedOption("");
    }
  }

  function handleRemove(id: CryptoId) {
    updateWatchlist(selectedIds.filter((selectedId) => selectedId !== id));
  }

  return (
    <section
      className="widget crypto-widget"
      aria-labelledby="crypto-widget-title"
      aria-busy={isLoading}
    >
      <div className="widget-header">
        <div>
          <p className="eyebrow">CoinGecko API</p>
          <h2 id="crypto-widget-title">Crypto market</h2>
        </div>
        <span className="crypto-currency">USD</span>
      </div>

      <div className="watchlist-controls">
        <label className="sr-only" htmlFor="crypto-selector">Add crypto asset</label>
        <select
          id="crypto-selector"
          value={optionToAdd}
          onChange={(event) => setSelectedOption(event.target.value)}
          disabled={isAtLimit || availableOptions.length === 0}
        >
          {availableOptions.map((crypto) => (
            <option key={crypto.id} value={crypto.id}>{crypto.name}</option>
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

      {isAtLimit ? <p className="watchlist-message">Five-asset limit reached.</p> : null}

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

      {isLoading && assets.length === 0 ? (
        <>
          <p className="sr-only" role="status">Loading current crypto prices...</p>
          <CryptoSkeleton count={selectedIds.length} />
        </>
      ) : null}

      {!isLoading && selectedIds.length === 0 ? (
        <p className="watchlist-empty">Add an asset to start your crypto watchlist.</p>
      ) : null}

      {assets.length > 0 ? (
        <>
          <ul className="crypto-list" aria-live="polite">
            {assets.map((asset) => {
              const direction = asset.change24h > 0 ? "positive" : asset.change24h < 0 ? "negative" : "neutral";

              return (
                <li className="crypto-row watchlist-row crypto-row-with-trend" key={asset.id}>
                  <span className={`crypto-symbol crypto-symbol-${asset.id}`} aria-hidden="true">
                    {asset.symbol.slice(0, 1)}
                  </span>
                  <div className="crypto-name">
                    <strong>{asset.name}</strong>
                    <span>{asset.symbol}</span>
                  </div>
                  <div className="crypto-value">
                    <strong>{formatPrice(asset.priceUsd)}</strong>
                    <span
                      className={`crypto-change crypto-change-${direction}`}
                      aria-label={`${asset.name} 24-hour change ${formatChange(asset.change24h)}`}
                    >
                      {formatChange(asset.change24h)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="watchlist-remove"
                    onClick={() => handleRemove(asset.id)}
                    aria-label={`Remove ${asset.name}`}
                  >
                    &times;
                  </button>
                  <CryptoTrendChart id={asset.id} name={asset.name} />
                </li>
              );
            })}
          </ul>

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

export default CryptoWidget;
