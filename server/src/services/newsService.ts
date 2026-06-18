import { getLatestNews as fetchLatestNews } from "../../../shared/services/newsService.js";
import type { NewsCategory } from "../../../shared/contracts/news.js";

export function getLatestNews(category: NewsCategory) {
  return fetchLatestNews(category, process.env.GUARDIAN_API_KEY);
}
