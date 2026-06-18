export const NEWS_CATEGORIES = [
    "all",
    "world",
    "technology",
    "business",
    "sport",
    "culture",
    "science",
    "environment",
];
export function parseNewsCategory(value) {
    const normalizedValue = value?.toLowerCase() ?? "all";
    return NEWS_CATEGORIES.find((category) => category === normalizedValue) ?? null;
}
