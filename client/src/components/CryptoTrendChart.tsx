import { useEffect, useId, useState } from "react";
import { fetchCryptoHistory } from "../services/api";
import type { CryptoHistoryResponse, CryptoId } from "../types/crypto";
import { buildChartPath, getTrendMetrics } from "./cryptoChart";

const CHART_WIDTH = 280;
const CHART_HEIGHT = 72;
function CryptoTrendChart({
  id,
  name,
  onShowDetails,
}: {
  id: CryptoId;
  name: string;
  onShowDetails: () => void;
}) {
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
        const response = await fetchCryptoHistory(id, 7, controller.signal);

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

  const trend = getTrendMetrics(history);

  return (
    <figure className={`crypto-trend crypto-trend-${trend.direction}`}>
      <figcaption id={titleId}>Seven-day trend</figcaption>
      <button
        type="button"
        className="crypto-detail-link"
        data-crypto-detail-trigger={id}
        onClick={onShowDetails}
      >
        View details
      </button>
      <svg
        className="crypto-chart"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={`${titleId} ${summaryId}`}
      >
        <path
          className="crypto-chart-line"
          d={buildChartPath(history.prices, CHART_WIDTH, CHART_HEIGHT)}
        />
      </svg>
      <p id={summaryId} className="crypto-trend-summary">{trend.summary}</p>
    </figure>
  );
}

export default CryptoTrendChart;
