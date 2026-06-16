import axios from "axios";
import type { OpenWeatherApiResponse, WeatherData } from "../types/weather.js";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

function getWeatherApiKey(): string {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Keep configuration checks close to the service that needs them so startup stays simple.
    throw new Error("OpenWeather API key is not configured.");
  }

  return apiKey;
}

function mapOpenWeatherResponse(data: OpenWeatherApiResponse): WeatherData {
  const currentWeather = data.weather[0];

  return {
    city: data.name,
    country: data.sys.country,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    weatherDescription: currentWeather?.description ?? "Weather unavailable",
    icon: currentWeather?.icon ?? "",
  };
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  const response = await axios.get<OpenWeatherApiResponse>(OPENWEATHER_BASE_URL, {
    params: {
      q: city,
      appid: getWeatherApiKey(),
      units: "imperial",
    },
  });

  return mapOpenWeatherResponse(response.data);
}
