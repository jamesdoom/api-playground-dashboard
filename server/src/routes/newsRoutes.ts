import { Router } from "express";
import { DASHBOARD_CACHE_CONTROL } from "../../../shared/http/cache.ts";
import { getNewsApiError } from "../../../shared/services/newsService.ts";
import { getLatestNews } from "../services/newsService.js";
import { parseNewsCategory } from "../types/news.js";

const router = Router();

router.get("/", async (req, res) => {
  const queryCategory = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
  const category = parseNewsCategory(typeof queryCategory === "string" ? queryCategory : undefined);

  if (!category) {
    res.status(400).json({ message: "Please select a valid news category." });
    return;
  }

  try {
    const articles = await getLatestNews(category);
    res.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    res.json({ articles });
  } catch (error) {
    const apiError = getNewsApiError(error);
    console.error("News request failed:", error);
    res.status(apiError.statusCode).json({ message: apiError.message });
  }
});

export default router;
