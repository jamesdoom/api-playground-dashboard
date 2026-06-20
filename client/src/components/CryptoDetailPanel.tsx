import { useEffect, useId, useState } from "react";
import { fetchCryptoHistory } from "../services/api";
import {
  AVAILABLE_CRYPTOCURRENCIES,
  CRYPTO_HISTORY_RANGES,
  type CryptoHistoryDays,
  type CryptoHistoryResponse,
  type CryptoId,
} from "../types/crypto";
import { buildChartPath, formatMarketPrice, getTrendMetrics } from "./cryptoChart";

const DETAIL_CHART_WIDTH = 640;
const DETAIL_CHART_HEIGHT = 180;

function formatSignedPrice(value: number): string {
  const formatted = formatMarketPrice(Math.abs(value));
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatted}`;
}

function CryptoDetailPanel({
  id,
  days,
  onClose,
  onDaysChange,
}: {
  id: CryptoId;
  days: CryptoHistoryDays;
  onClose: () => void;
  onDaysChange: (days: CryptoHistoryDays) => void;
}) {
  const [history, setHistory] = useState<CryptoHistoryResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [shareStatus, setShareStatus] = useState("");
  const titleId = useId();
  const summaryId = useId();
  const asset = AVAILABLE_CRYPTOCURRENCIES.find((candidate) => candidate.id === id);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchCryptoHistory(id, days, controller.signal);

        if (!controller.signal.aborted) {
          setHistory(response);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setHistory(null);
          setErrorMessage(error instanceof Error ? error.message : "Unable to load market details.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();
    return () => controller.abort();
  }, [days, id, retryCount]);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Share link copied.");
    } catch {
      setShareStatus("The share link is available in the address bar.");
    }
  }

  const trend = history ? getTrendMetrics(history) : null;

  return (
    <section className="crypto-detail-panel" aria-labelledby={titleId} aria-busy={isLoading}>
      <div className="crypto-detail-header">
        <div>
          <p className="eyebrow">Market detail</p>
          <h3 id={titleId}>{asset?.name} ({asset?.symbol})</h3>
        </div>
        <button type="button" className="crypto-detail-close" onClick={onClose}>
          Close details
        </button>
      </div>

      <div className="crypto-range-controls" role="group" aria-label="Price history range">
        {CRYPTO_HISTORY_RANGES.map((range) => (
          <button
            type="button"
            key={range}
            aria-pressed={days === range}
            onClick={() => onDaysChange(range)}
          >
            {range}D
          </button>
        ))}
      </div>

      {isLoading && history === null ? (
        <div className="crypto-detail-loading">
          <p className="sr-only" role="status">Loading {asset?.name} {days}-day market details...</p>
          <span className="skeleton-block crypto-detail-chart-skeleton" aria-hidden="true" />
        </div>
      ) : null}

      {errorMessage ? (
        <div className="error-state" role="alert">
          <p>{errorMessage}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Retry details
          </button>
        </div>
      ) : null}

      {history && trend ? (
        <>
          <figure className={`crypto-detail-chart crypto-trend-${trend.direction}`}>
            <svg
              viewBox={`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`}
              preserveAspectRatio="none"
              role="img"
              aria-labelledby={`${titleId} ${summaryId}`}
            >
              <path
                className="crypto-chart-line"
                d={buildChartPath(history.prices, DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, 8)}
              />
            </svg>
            <figcaption id={summaryId}>{trend.summary}</figcaption>
          </figure>

          <dl className="crypto-detail-stats">
            <div><dt>Latest</dt><dd>{formatMarketPrice(trend.last)}</dd></div>
            <div>
              <dt>Period change</dt>
              <dd className={`stock-change-${trend.direction}`}>
                {formatSignedPrice(trend.changeUsd)} ({trend.changePercent > 0 ? "+" : ""}{trend.changePercent.toFixed(2)}%)
              </dd>
            </div>
            <div><dt>Low</dt><dd>{formatMarketPrice(trend.minimum)}</dd></div>
            <div><dt>High</dt><dd>{formatMarketPrice(trend.maximum)}</dd></div>
            <div><dt>Average</dt><dd>{formatMarketPrice(trend.average)}</dd></div>
          </dl>
        </>
      ) : null}

      <div className="crypto-detail-actions">
        <button type="button" className="secondary-button" onClick={() => void copyShareLink()}>
          Copy share link
        </button>
        <p role="status" aria-live="polite">{shareStatus}</p>
      </div>
    </section>
  );
}

export default CryptoDetailPanel;
