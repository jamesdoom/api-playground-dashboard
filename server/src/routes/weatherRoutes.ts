import axios from "axios";
import { Router } from "express";
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
    res.json(weather);
  } catch (error) {
    if (error instanceof Error && error.message === "OpenWeather API key is not configured.") {
      res.status(500).json({ message: "Weather service is not configured yet." });
      return;
    }

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;

      if (statusCode === 404) {
        res.status(404).json({ message: "We could not find weather for that city." });
        return;
      }

      if (statusCode === 401) {
        res.status(500).json({ message: "Weather service is not configured correctly." });
        return;
      }
    }

    console.error("Weather request failed:", error);
    res.status(500).json({ message: "Weather data is unavailable right now. Please try again soon." });
  }
});

export default router;
