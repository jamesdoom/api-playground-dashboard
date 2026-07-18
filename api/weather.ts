import { DASHBOARD_CACHE_CONTROL } from "../shared/runtime/http/cache.js";
import type { ApiRequest, ApiResponse } from "../shared/http/serverless.ts";
import {
  getWeatherApiError,
  getWeatherByCity,
} from "../shared/runtime/services/weatherService.js";

type WeatherQuery = {
  city?: string | string[];
};

function getCityFromQuery(queryCity: string | string[] | undefined): string {
  const city = Array.isArray(queryCity) ? queryCity[0] : queryCity;
  return city?.trim() ?? "";
}

export default async function handler(request: ApiRequest<WeatherQuery>, response: ApiResponse) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ message: "This endpoint only supports GET requests." });
    return;
  }

  const city = getCityFromQuery(request.query.city);

  if (!city) {
    response.status(400).json({ message: "Please enter a city name." });
    return;
  }

  try {
    const weather = await getWeatherByCity(city);
    response.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    response.status(200).json(weather);
  } catch (error) {
    const apiError = getWeatherApiError(error);
    console.error("Weather request failed:", error);
    response.status(apiError.statusCode).json({ message: apiError.message });
  }
}
