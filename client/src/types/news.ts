export const NEWS_CATEGORIES = [
  "all",
  "world",
  "technology",
  "business",
  "sport",
  "culture",
  "science",
  "environment",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface NewsArticle {
  id: string;
  title: string;
  section: string;
  publishedAt: string;
  url: string;
  thumbnail: string | null;
}

export interface NewsResponse {
  articles: NewsArticle[];
}
