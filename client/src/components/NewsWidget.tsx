import { useEffect, useState, type ChangeEvent } from "react";
import { fetchLatestNews } from "../services/api";
import { NEWS_CATEGORIES, type NewsArticle, type NewsCategory } from "../types/news";

const NEWS_CATEGORY_STORAGE_KEY = "dashboard-news-category";
const articleDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const updatedTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function isNewsCategory(value: string): value is NewsCategory {
  return NEWS_CATEGORIES.some((category) => category === value);
}

function getStoredCategory(): NewsCategory {
  try {
    const storedCategory = window.localStorage.getItem(NEWS_CATEGORY_STORAGE_KEY);
    return storedCategory && isNewsCategory(storedCategory) ? storedCategory : "all";
  } catch {
    return "all";
  }
}

function formatCategory(category: NewsCategory): string {
  return category === "all" ? "Top stories" : category[0].toUpperCase() + category.slice(1);
}

function NewsThumbnail({ article }: { article: NewsArticle }) {
  const [hasError, setHasError] = useState(false);
  const fallbackLetter = article.section.trim().slice(0, 1).toUpperCase() || "N";

  return (
    <div className="news-thumbnail" aria-hidden="true">
      {article.thumbnail && !hasError ? (
        <img
          src={article.thumbnail}
          alt=""
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="news-thumbnail-fallback">{fallbackLetter}</span>
      )}
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="news-list news-skeleton" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="news-item news-skeleton-item" key={index}>
          <span className="skeleton-block news-thumbnail" />
          <div className="skeleton-stack">
            <span className="skeleton-block skeleton-line-short" />
            <span className="skeleton-block skeleton-line-wide" />
            <span className="skeleton-block skeleton-line-medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsWidget() {
  const [category, setCategory] = useState<NewsCategory>(getStoredCategory);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const news = await fetchLatestNews(category, controller.signal);
        setArticles(news.articles);
        setUpdatedAt(new Date());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to load headlines.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadNews();
    return () => controller.abort();
  }, [category, refreshCount]);

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextCategory = event.target.value;

    if (!isNewsCategory(nextCategory)) {
      return;
    }

    setArticles([]);
    setCategory(nextCategory);

    try {
      window.localStorage.setItem(NEWS_CATEGORY_STORAGE_KEY, nextCategory);
    } catch {
      // Category persistence is optional; loading headlines should still continue.
    }
  }

  return (
    <section
      className="widget news-widget"
      aria-labelledby="news-widget-title"
      aria-busy={isLoading}
    >
      <div className="widget-header news-header">
        <div>
          <h2 id="news-widget-title">News</h2>
        </div>

        <div className="news-controls">
          <label htmlFor="news-category">Category</label>
          <select
            id="news-category"
            value={category}
            onChange={handleCategoryChange}
            disabled={isLoading}
          >
            {NEWS_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {formatCategory(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage ? (
        <div className="error-state" role="alert">
          <p>{errorMessage}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setRefreshCount((count) => count + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {isLoading && articles.length === 0 ? (
        <>
          <p className="sr-only" role="status">Loading current headlines...</p>
          <NewsSkeleton />
        </>
      ) : null}

      {articles.length > 0 ? (
        <>
          <div className="news-list">
            {articles.map((article) => (
              <a
                className="news-item"
                href={article.url}
                key={article.id}
                target="_blank"
                rel="noreferrer"
              >
                <NewsThumbnail article={article} />

                <div className="news-copy">
                  <p className="news-meta">
                    <span>{article.section}</span>
                    <time dateTime={article.publishedAt}>
                      {articleDateFormatter.format(new Date(article.publishedAt))}
                    </time>
                  </p>
                  <h3>{article.title}</h3>
                  <span className="news-link-label">Read at The Guardian &rarr;</span>
                </div>
              </a>
            ))}
          </div>

          <div className="widget-footer">
            <p>{updatedAt ? `Updated ${updatedTimeFormatter.format(updatedAt)}` : null}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setRefreshCount((count) => count + 1)}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default NewsWidget;
