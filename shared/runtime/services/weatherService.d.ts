import type { OpenWeatherApiResponse, WeatherData } from "../contracts/weather.ts";
import { type ApiErrorDetails } from "../errors/ProviderError.ts";
export declare function mapOpenWeatherResponse(data: OpenWeatherApiResponse): WeatherData;
export declare function getWeatherByCity(city: string, apiKey: string | undefined): Promise<WeatherData>;
export declare function getWeatherApiError(error: unknown): ApiErrorDetails;
