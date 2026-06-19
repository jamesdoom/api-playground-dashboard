import { useEffect, useId, useState } from "react";
import { fetchCryptoHistory } from "../services/api";
import type { CryptoHistoryResponse, CryptoId, CryptoPricePoint } from "../types/crypto";

const CHART_WIDTH = 280;
const CHART_HEIGHT = 72;
const CHART_PADDING = 4;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: price < 1 ? 4 : 2,
  }).format(price);
}

function buildChartPath(prices: CryptoPricePoint[]): string {
  const values = prices.map((point) => point.priceUsd);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum;
  const drawableWidth = CHART_WIDTH - CHART_PADDING * 2;
  const drawableHeight = CHART_HEIGHT - CHART_PADDING * 2;

  return prices.map((point, index) => {
    const x = CHART_PADDING + index * drawableWidth / (prices.length - 1);
    const y = spread === 0
      ? CHART_HEIGHT / 2
      : CHART_PADDING + (maximum - point.priceUsd) * drawableHeight / spread;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function getTrendSummary(history: CryptoHistoryResponse): {
  direction: "positive" | "negative" | "neutral";
  summary: string;
} {
  const values = history.prices.map((point) => point.priceUsd);
  const first = values[0];
  const last = values.at(-1) ?? first;
  const change = (last - first) / first * 100;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const direction = change > 0 ? "positive" : change < 0 ? "negative" : "neutral";
  const movement = direction === "positive" ? "rose" : direction === "negative" ? "fell" : "was unchanged";
  const changeText = direction === "neutral" ? "" : ` ${Math.abs(change).toFixed(2)}%`;

  return {
    direction,
    summary: `${history.name} ${movement}${changeText} over seven days. Range ${formatPrice(minimum)} to ${formatPrice(maximum)}.`,
  };
}

function CryptoTrendChart({ id, name }: { id: CryptoId; name: string }) {
  const [history, setHistory] = useState<CryptoHistoryResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const titleId = useId();
  const summaryId = useId();

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchCryptoHistory(id, controller.signal);

        if (!controller.signal.aborted) {
          setHistory(response);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to load price history.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();
    return () => controller.abort();
  }, [id, retryCount]);

  if (isLoading && history === null) {
    return (
      <div className="crypto-trend crypto-trend-loading">
        <p className="sr-only" role="status">Loading {name} seven-day price trend...</p>
        <span className="skeleton-block crypto-chart-skeleton" aria-hidden="true" />
      </div>
    );
  }

  if (errorMessage && history === null) {
    return (
      <div className="crypto-trend crypto-trend-error" role="alert">
        <p>{name} trend unavailable.</p>
        <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry trend</button>
      </div>
    );
  }

  if (history === null) {
    return null;
  }

  const trend = getTrendSummary(history);

  return (
    <figure className={`crypto-trend crypto-trend-${trend.direction}`}>
      <figcaption id={titleId}>Seven-day trend</figcaption>
      <svg
        className="crypto-chart"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={`${titleId} ${summaryId}`}
      >
        <path className="crypto-chart-line" d={buildChartPath(history.prices)} />
      </svg>
      <p id={summaryId} className="crypto-trend-summary">{trend.summary}</p>
    </figure>
  );
}

export default CryptoTrendChart;
