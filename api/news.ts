import { parseNewsCategory } from "../shared/contracts/news.ts";
import { DASHBOARD_CACHE_CONTROL } from "../shared/http/cache.ts";
import type { ApiRequest, ApiResponse } from "../shared/http/serverless.ts";
import { getLatestNews, getNewsApiError } from "../shared/services/newsService.ts";

type NewsQuery = {
  category?: string | string[];
};

function getCategoryFromQuery(queryCategory: string | string[] | undefined): string | undefined {
  return Array.isArray(queryCategory) ? queryCategory[0] : queryCategory;
}

export default async function handler(request: ApiRequest<NewsQuery>, response: ApiResponse) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ message: "This endpoint only supports GET requests." });
    return;
  }

  const category = parseNewsCategory(getCategoryFromQuery(request.query.category));

  if (!category) {
    response.status(400).json({ message: "Please select a valid news category." });
    return;
  }

  try {
    const articles = await getLatestNews(category, process.env.GUARDIAN_API_KEY);
    response.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    response.status(200).json({ articles });
  } catch (error) {
    const apiError = getNewsApiError(error);
    console.error("News request failed:", error);
    response.status(apiError.statusCode).json({ message: apiError.message });
  }
}
