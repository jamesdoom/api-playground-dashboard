type ApiRequest = {
  method?: string;
  query: {
    category?: string | string[];
  };
};

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
};

type GuardianApiResponse = {
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
};

const GUARDIAN_BASE_URL = "https://content.guardianapis.com/search";
const NEWS_CATEGORIES = [
  "all",
  "world",
  "technology",
  "business",
  "sport",
  "culture",
  "science",
  "environment",
] as const;

type NewsCategory = (typeof NEWS_CATEGORIES)[number];

function getCategory(queryCategory: string | string[] | undefined): NewsCategory | null {
  const value = (Array.isArray(queryCategory) ? queryCategory[0] : queryCategory)?.toLowerCase() ?? "all";
  return NEWS_CATEGORIES.find((category) => category === value) ?? null;
}

function mapGuardianResponse(data: GuardianApiResponse) {
  return data.response.results.map((article) => ({
    id: article.id,
    title: article.webTitle,
    section: article.sectionName,
    publishedAt: article.webPublicationDate,
    url: article.webUrl,
    thumbnail: article.fields?.thumbnail ?? null,
  }));
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ message: "This endpoint only supports GET requests." });
    return;
  }

  const category = getCategory(request.query.category);

  if (!category) {
    response.status(400).json({ message: "Please select a valid news category." });
    return;
  }

  const apiKey = process.env.GUARDIAN_API_KEY;

  if (!apiKey) {
    response.status(500).json({ message: "News service is not configured yet." });
    return;
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
    const guardianResponse = await fetch(`${GUARDIAN_BASE_URL}?${searchParams.toString()}`);

    if (guardianResponse.status === 401 || guardianResponse.status === 403) {
      response.status(500).json({ message: "News service is not configured correctly." });
      return;
    }

    if (!guardianResponse.ok) {
      response.status(500).json({ message: "Headlines are unavailable right now. Please try again soon." });
      return;
    }

    const guardianData = (await guardianResponse.json()) as GuardianApiResponse;
    response.status(200).json({ articles: mapGuardianResponse(guardianData) });
  } catch (error) {
    console.error("News request failed:", error);
    response.status(500).json({ message: "Headlines are unavailable right now. Please try again soon." });
  }
}
