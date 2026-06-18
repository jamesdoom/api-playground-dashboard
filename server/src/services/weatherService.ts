import { getWeatherByCity as fetchWeatherByCity } from "../../../shared/services/weatherService.js";

export function getWeatherByCity(city: string) {
  return fetchWeatherByCity(city, process.env.OPENWEATHER_API_KEY);
}
