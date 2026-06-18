import axios from "axios";
import { Router } from "express";
import { getLatestNews } from "../services/newsService.js";
import { NEWS_CATEGORIES, type NewsCategory } from "../types/news.js";

const router = Router();

function isNewsCategory(value: string): value is NewsCategory {
  return NEWS_CATEGORIES.some((category) => category === value);
}

router.get("/", async (req, res) => {
  const requestedCategory = String(req.query.category ?? "all").toLowerCase();

  if (!isNewsCategory(requestedCategory)) {
    res.status(400).json({ message: "Please select a valid news category." });
    return;
  }

  try {
    const articles = await getLatestNews(requestedCategory);
    res.json({ articles });
  } catch (error) {
    if (error instanceof Error && error.message === "Guardian API key is not configured.") {
      res.status(500).json({ message: "News service is not configured yet." });
      return;
    }

    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      res.status(500).json({ message: "News service is not configured correctly." });
      return;
    }

    console.error("News request failed:", error);
    res.status(500).json({ message: "Headlines are unavailable right now. Please try again soon." });
  }
});

export default router;
