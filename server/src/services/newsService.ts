import axios from "axios";
import type { GuardianApiResponse, NewsArticle, NewsCategory } from "../types/news.js";

const GUARDIAN_BASE_URL = "https://content.guardianapis.com/search";

function getGuardianApiKey(): string {
  const apiKey = process.env.GUARDIAN_API_KEY;

  if (!apiKey) {
    throw new Error("Guardian API key is not configured.");
  }

  return apiKey;
}

function mapGuardianResponse(data: GuardianApiResponse): NewsArticle[] {
  return data.response.results.map((article) => ({
    id: article.id,
    title: article.webTitle,
    section: article.sectionName,
    publishedAt: article.webPublicationDate,
    url: article.webUrl,
    thumbnail: article.fields?.thumbnail ?? null,
  }));
}

export async function getLatestNews(category: NewsCategory): Promise<NewsArticle[]> {
  const response = await axios.get<GuardianApiResponse>(GUARDIAN_BASE_URL, {
    params: {
      "api-key": getGuardianApiKey(),
      "order-by": "newest",
      "page-size": 6,
      "show-fields": "thumbnail",
      // Guardian uses section IDs for categories; "all" means omit the filter.
      ...(category === "all" ? {} : { section: category }),
    },
  });

  return mapGuardianResponse(response.data);
}
