import { useEffect, useState } from "react";
import { fetchCryptoPrices } from "../services/api";
import type { CryptoAsset } from "../types/crypto";

const updatedTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

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

function CryptoSkeleton() {
  return (
    <div className="crypto-list crypto-skeleton" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
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
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPrices() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const crypto = await fetchCryptoPrices(controller.signal);
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
  }, [refreshCount]);

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
          <CryptoSkeleton />
        </>
      ) : null}

      {assets.length > 0 ? (
        <>
          <ul className="crypto-list" aria-live="polite">
            {assets.map((asset) => {
              const direction = asset.change24h > 0 ? "positive" : asset.change24h < 0 ? "negative" : "neutral";

              return (
                <li className="crypto-row" key={asset.id}>
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
