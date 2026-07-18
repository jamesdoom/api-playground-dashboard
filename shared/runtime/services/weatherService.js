import { ProviderError } from "../errors/ProviderError.js";
const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const WEATHER_CODES = {
    0: { description: "clear sky", dayIcon: "☀️", nightIcon: "🌙" },
    1: { description: "mainly clear", dayIcon: "🌤️", nightIcon: "🌙" },
    2: { description: "partly cloudy", dayIcon: "⛅", nightIcon: "☁️" },
    3: { description: "overcast", dayIcon: "☁️" },
    45: { description: "fog", dayIcon: "🌫️" },
    48: { description: "rime fog", dayIcon: "🌫️" },
    51: { description: "light drizzle", dayIcon: "🌦️" },
    53: { description: "moderate drizzle", dayIcon: "🌦️" },
    55: { description: "dense drizzle", dayIcon: "🌧️" },
    56: { description: "light freezing drizzle", dayIcon: "🌧️" },
    57: { description: "dense freezing drizzle", dayIcon: "🌧️" },
    61: { description: "slight rain", dayIcon: "🌦️" },
    63: { description: "moderate rain", dayIcon: "🌧️" },
    65: { description: "heavy rain", dayIcon: "🌧️" },
    66: { description: "light freezing rain", dayIcon: "🌧️" },
    67: { description: "heavy freezing rain", dayIcon: "🌧️" },
    71: { description: "slight snowfall", dayIcon: "🌨️" },
    73: { description: "moderate snowfall", dayIcon: "🌨️" },
    75: { description: "heavy snowfall", dayIcon: "❄️" },
    77: { description: "snow grains", dayIcon: "❄️" },
    80: { description: "slight rain showers", dayIcon: "🌦️" },
    81: { description: "moderate rain showers", dayIcon: "🌧️" },
    82: { description: "violent rain showers", dayIcon: "⛈️" },
    85: { description: "slight snow showers", dayIcon: "🌨️" },
    86: { description: "heavy snow showers", dayIcon: "❄️" },
    95: { description: "thunderstorm", dayIcon: "⛈️" },
    96: { description: "thunderstorm with slight hail", dayIcon: "⛈️" },
    99: { description: "thunderstorm with heavy hail", dayIcon: "⛈️" },
};
export function getWeatherPresentation(weatherCode, isDay) {
    const presentation = WEATHER_CODES[weatherCode] ?? {
        description: "weather unavailable",
        dayIcon: "🌡️",
    };
    return presentation.nightIcon && !isDay
        ? { ...presentation, dayIcon: presentation.nightIcon }
        : presentation;
}
export function mapOpenMeteoResponse(location, data) {
    const presentation = getWeatherPresentation(data.current.weather_code, data.current.is_day === 1);
    const hourlyForecast = data.hourly.time.map((time, index) => {
        const hourlyPresentation = getWeatherPresentation(data.hourly.weather_code[index] ?? -1, data.hourly.is_day[index] === 1);
        return {
            time,
            temperature: Math.round(data.hourly.temperature_2m[index] ?? 0),
            precipitationProbability: Math.round(data.hourly.precipitation_probability[index] ?? 0),
            weatherDescription: hourlyPresentation.description,
            icon: hourlyPresentation.dayIcon,
        };
    });
    const dailyForecast = data.daily.time.map((date, index) => {
        const dailyPresentation = getWeatherPresentation(data.daily.weather_code[index] ?? -1, true);
        return {
            date,
            high: Math.round(data.daily.temperature_2m_max[index] ?? 0),
            low: Math.round(data.daily.temperature_2m_min[index] ?? 0),
            sunrise: data.daily.sunrise[index] ?? "",
            sunset: data.daily.sunset[index] ?? "",
            precipitationProbability: Math.round(data.daily.precipitation_probability_max[index] ?? 0),
            weatherDescription: dailyPresentation.description,
            icon: dailyPresentation.dayIcon,
        };
    });
    return {
        city: location.name,
        country: location.country_code,
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: Math.round(data.current.relative_humidity_2m),
        weatherDescription: presentation.description,
        icon: presentation.dayIcon,
        hourlyForecast,
        dailyForecast,
    };
}
export async function getWeatherByCity(city) {
    try {
        const geocodingParams = new URLSearchParams({ name: city, count: "1", language: "en" });
        const geocodingResponse = await fetch(`${OPEN_METEO_GEOCODING_URL}?${geocodingParams.toString()}`);
        if (!geocodingResponse.ok) {
            throw new ProviderError("unavailable", "Open-Meteo geocoding request failed.");
        }
        const geocoding = (await geocodingResponse.json());
        const location = geocoding.results?.[0];
        if (!location) {
            throw new ProviderError("not_found", "City was not found.");
        }
        const forecastParams = new URLSearchParams({
            latitude: String(location.latitude),
            longitude: String(location.longitude),
            current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day",
            hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
            daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
            temperature_unit: "fahrenheit",
            timezone: "auto",
            forecast_hours: "24",
            forecast_days: "7",
        });
        const forecastResponse = await fetch(`${OPEN_METEO_FORECAST_URL}?${forecastParams.toString()}`);
        if (!forecastResponse.ok) {
            throw new ProviderError("unavailable", "Open-Meteo forecast request failed.");
        }
        const forecast = (await forecastResponse.json());
        return mapOpenMeteoResponse(location, forecast);
    }
    catch (error) {
        if (error instanceof ProviderError) {
            throw error;
        }
        throw new ProviderError("unavailable", "Open-Meteo could not be reached.");
    }
}
export function getWeatherApiError(error) {
    if (error instanceof ProviderError) {
        if (error.code === "not_found") {
            return { statusCode: 404, message: "We could not find weather for that city." };
        }
    }
    return { statusCode: 500, message: "Weather data is unavailable right now. Please try again soon." };
}
