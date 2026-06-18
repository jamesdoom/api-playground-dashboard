import { Router } from "express";
import { DASHBOARD_CACHE_CONTROL } from "../../../shared/http/cache.ts";
import { getWeatherApiError } from "../../../shared/services/weatherService.ts";
import { getWeatherByCity } from "../services/weatherService.js";

const router = Router();

router.get("/", async (req, res) => {
  const city = String(req.query.city ?? "").trim();

  if (!city) {
    res.status(400).json({ message: "Please enter a city name." });
    return;
  }

  try {
    const weather = await getWeatherByCity(city);
    res.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    res.json(weather);
  } catch (error) {
    const apiError = getWeatherApiError(error);
    console.error("Weather request failed:", error);
    res.status(apiError.statusCode).json({ message: apiError.message });
  }
});

export default router;
