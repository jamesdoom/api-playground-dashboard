export declare const NEWS_CATEGORIES: readonly ["all", "world", "technology", "business", "sport", "culture", "science", "environment"];
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
export interface GuardianApiResponse {
    response: {
        results: Array<{
            id: string;
            sectionName: string;
            webPublicationDate: string;
            webTitle: string;
            webUrl: string;
            fields?: {
                thumbnail?: string;
            };
        }>;
    };
}
export declare function parseNewsCategory(value: string | undefined): NewsCategory | null;
