import type { WeatherData } from "../types/weather";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function checkServerHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Failed to connect to server");
  }

  return response.json();
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallbackMessage = "Something went wrong. Please try again.";

  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const searchParams = new URLSearchParams({ city });
  const response = await fetch(`${API_BASE_URL}/weather?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<WeatherData>;
}
