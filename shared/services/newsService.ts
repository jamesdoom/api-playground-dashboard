import type { GuardianApiResponse, NewsArticle, NewsCategory } from "../contracts/news.ts";
import { ProviderError, type ApiErrorDetails } from "../errors/ProviderError.ts";

const GUARDIAN_BASE_URL = "https://content.guardianapis.com/search";

export function mapGuardianResponse(data: GuardianApiResponse): NewsArticle[] {
  return data.response.results.map((article) => ({
    id: article.id,
    title: article.webTitle,
    section: article.sectionName,
    publishedAt: article.webPublicationDate,
    url: article.webUrl,
    thumbnail: article.fields?.thumbnail ?? null,
  }));
}

export async function getLatestNews(
  category: NewsCategory,
  apiKey: string | undefined,
): Promise<NewsArticle[]> {
  if (!apiKey) {
    throw new ProviderError("not_configured", "Guardian API key is not configured.");
  }

  const searchParams = new URLSearchParams({
    "api-key": apiKey,
    "order-by": "newest",
    "page-size": "6",
    "show-fields": "thumbnail",
  });

  if (category !== "all") {
    searchParams.set("section", category);
  }

  try {
    const response = await fetch(`${GUARDIAN_BASE_URL}?${searchParams.toString()}`);

    if (response.status === 401 || response.status === 403) {
      throw new ProviderError("unauthorized", "The Guardian rejected the API key.");
    }

    if (!response.ok) {
      throw new ProviderError("unavailable", "The Guardian request failed.");
    }

    const data = (await response.json()) as GuardianApiResponse;
    return mapGuardianResponse(data);
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    throw new ProviderError("unavailable", "The Guardian could not be reached.");
  }
}

export function getNewsApiError(error: unknown): ApiErrorDetails {
  if (error instanceof ProviderError) {
    if (error.code === "not_configured") {
      return { statusCode: 500, message: "News service is not configured yet." };
    }

    if (error.code === "unauthorized") {
      return { statusCode: 500, message: "News service is not configured correctly." };
    }
  }

  return { statusCode: 500, message: "Headlines are unavailable right now. Please try again soon." };
}
