// Vercel serves a cached response for five minutes and may serve stale data
// for ten more minutes while refreshing it in the background.
export const DASHBOARD_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

// Historical series change less often than current quotes, so they can stay at
// the CDN edge longer while still refreshing in the background.
export const HISTORICAL_PRICE_CACHE_CONTROL = "public, s-maxage=900, stale-while-revalidate=3600";
