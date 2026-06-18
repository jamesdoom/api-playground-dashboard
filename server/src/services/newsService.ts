import { getLatestNews as fetchLatestNews } from "../../../shared/services/newsService.ts";
import type { NewsCategory } from "../../../shared/contracts/news.ts";

export function getLatestNews(category: NewsCategory) {
  return fetchLatestNews(category, process.env.GUARDIAN_API_KEY);
}
