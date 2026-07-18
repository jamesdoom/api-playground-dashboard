import type { OpenMeteoForecastResponse, OpenMeteoGeocodingResponse, WeatherData } from "../contracts/weather.ts";
import { type ApiErrorDetails } from "../errors/ProviderError.ts";
type WeatherPresentation = {
    description: string;
    dayIcon: string;
    nightIcon?: string;
};
export declare function getWeatherPresentation(weatherCode: number, isDay: boolean): WeatherPresentation;
export declare function mapOpenMeteoResponse(location: NonNullable<OpenMeteoGeocodingResponse["results"]>[number], data: OpenMeteoForecastResponse): WeatherData;
export declare function getWeatherByCity(city: string): Promise<WeatherData>;
export declare function getWeatherApiError(error: unknown): ApiErrorDetails;
export {};
