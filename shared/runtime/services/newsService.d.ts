import type { GuardianApiResponse, NewsArticle, NewsCategory } from "../contracts/news.ts";
import { type ApiErrorDetails } from "../errors/ProviderError.ts";
export declare function mapGuardianResponse(data: GuardianApiResponse): NewsArticle[];
export declare function getLatestNews(category: NewsCategory, apiKey: string | undefined): Promise<NewsArticle[]>;
export declare function getNewsApiError(error: unknown): ApiErrorDetails;
