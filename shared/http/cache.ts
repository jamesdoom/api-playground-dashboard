// Vercel serves a cached response for five minutes and may serve stale data
// for ten more minutes while refreshing it in the background.
export const DASHBOARD_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";
