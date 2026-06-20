import type { CryptoHistoryResponse, CryptoPricePoint } from "../types/crypto";

export function formatMarketPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: price < 1 ? 4 : 2,
  }).format(price);
}

export function buildChartPath(
  prices: CryptoPricePoint[],
  width: number,
  height: number,
  padding = 4,
): string {
  const values = prices.map((point) => point.priceUsd);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum;
  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;

  return prices.map((point, index) => {
    const x = padding + index * drawableWidth / (prices.length - 1);
    const y = spread === 0
      ? height / 2
      : padding + (maximum - point.priceUsd) * drawableHeight / spread;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export function getTrendMetrics(history: CryptoHistoryResponse) {
  const values = history.prices.map((point) => point.priceUsd);
  const first = values[0];
  const last = values.at(-1) ?? first;
  const changeUsd = last - first;
  const changePercent = changeUsd / first * 100;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const direction = changePercent > 0
    ? "positive"
    : changePercent < 0
      ? "negative"
      : "neutral";
  const movement = direction === "positive" ? "rose" : direction === "negative" ? "fell" : "was unchanged";
  const changeText = direction === "neutral" ? "" : ` ${Math.abs(changePercent).toFixed(2)}%`;
  const period = history.days === 7 ? "seven days" : `${history.days} days`;

  return {
    average,
    changePercent,
    changeUsd,
    direction,
    first,
    last,
    maximum,
    minimum,
    summary: `${history.name} ${movement}${changeText} over ${period}. Range ${formatMarketPrice(minimum)} to ${formatMarketPrice(maximum)}.`,
  };
}
