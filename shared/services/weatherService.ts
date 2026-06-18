import type { OpenWeatherApiResponse, WeatherData } from "../contracts/weather.ts";
import { ProviderError, type ApiErrorDetails } from "../errors/ProviderError.ts";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

export function mapOpenWeatherResponse(data: OpenWeatherApiResponse): WeatherData {
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

export async function getWeatherByCity(city: string, apiKey: string | undefined): Promise<WeatherData> {
  if (!apiKey) {
    throw new ProviderError("not_configured", "OpenWeather API key is not configured.");
  }

  const searchParams = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: "imperial",
  });

  try {
    const response = await fetch(`${OPENWEATHER_BASE_URL}?${searchParams.toString()}`);

    if (response.status === 404) {
      throw new ProviderError("not_found", "City was not found.");
    }

    if (response.status === 401) {
      throw new ProviderError("unauthorized", "OpenWeather rejected the API key.");
    }

    if (!response.ok) {
      throw new ProviderError("unavailable", "OpenWeather request failed.");
    }

    const data = (await response.json()) as OpenWeatherApiResponse;
    return mapOpenWeatherResponse(data);
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    throw new ProviderError("unavailable", "OpenWeather could not be reached.");
  }
}

export function getWeatherApiError(error: unknown): ApiErrorDetails {
  if (error instanceof ProviderError) {
    if (error.code === "not_configured") {
      return { statusCode: 500, message: "Weather service is not configured yet." };
    }

    if (error.code === "not_found") {
      return { statusCode: 404, message: "We could not find weather for that city." };
    }

    if (error.code === "unauthorized") {
      return { statusCode: 500, message: "Weather service is not configured correctly." };
    }
  }

  return { statusCode: 500, message: "Weather data is unavailable right now. Please try again soon." };
}
