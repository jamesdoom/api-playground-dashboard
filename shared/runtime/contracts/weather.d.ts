export interface WeatherData {
    city: string;
    country: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    weatherDescription: string;
    icon: string;
}
export interface OpenMeteoGeocodingResponse {
    results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        country_code: string;
    }>;
}
export interface OpenMeteoForecastResponse {
    current: {
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        weather_code: number;
        is_day: number;
    };
}
