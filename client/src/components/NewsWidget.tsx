import { useEffect, useState } from "react";
import { fetchLatestNews } from "../services/api";
import { NEWS_CATEGORIES, type NewsArticle, type NewsCategory } from "../types/news";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatCategory(category: NewsCategory): string {
  return category === "all" ? "Top stories" : category[0].toUpperCase() + category.slice(1);
}

function NewsWidget() {
  const [category, setCategory] = useState<NewsCategory>("all");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const news = await fetchLatestNews(category, controller.signal);
        setArticles(news.articles);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setArticles([]);
        setErrorMessage(error instanceof Error ? error.message : "Unable to load headlines.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadNews();
    return () => controller.abort();
  }, [category]);

  return (
    <section className="widget news-widget" aria-labelledby="news-widget-title">
      <div className="widget-header news-header">
        <div>
          <p className="eyebrow">The Guardian Open Platform</p>
          <h2 id="news-widget-title">Latest headlines</h2>
        </div>

        <div className="news-controls">
          <label htmlFor="news-category">Category</label>
          <select
            id="news-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as NewsCategory)}
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

      <div aria-live="polite">
        {isLoading ? <p className="widget-message">Loading current headlines...</p> : null}
        {errorMessage ? <p className="widget-message error-message">{errorMessage}</p> : null}
      </div>

      {!isLoading && articles.length > 0 ? (
        <div className="news-list">
          {articles.map((article) => (
            <a
              className="news-item"
              href={article.url}
              key={article.id}
              target="_blank"
              rel="noreferrer"
            >
              <div className="news-thumbnail" aria-hidden="true">
                {article.thumbnail ? <img src={article.thumbnail} alt="" loading="lazy" /> : null}
              </div>

              <div className="news-copy">
                <p className="news-meta">
                  <span>{article.section}</span>
                  <time dateTime={article.publishedAt}>
                    {dateFormatter.format(new Date(article.publishedAt))}
                  </time>
                </p>
                <h3>{article.title}</h3>
                <span className="news-link-label">Read at The Guardian &rarr;</span>
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default NewsWidget;
