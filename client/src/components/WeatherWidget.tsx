import { useState, type FormEvent } from "react";
import { fetchWeatherByCity } from "../services/api";
import type { WeatherData } from "../types/weather";

const WEATHER_CITY_STORAGE_KEY = "dashboard-weather-city";
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function getStoredCity(): string {
  try {
    return window.localStorage.getItem(WEATHER_CITY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function WeatherSkeleton() {
  return (
    <div className="weather-results weather-skeleton" aria-hidden="true">
      <div className="skeleton-stack">
        <span className="skeleton-block skeleton-line-wide" />
        <span className="skeleton-block skeleton-line-short" />
      </div>
      <span className="skeleton-block skeleton-temperature" />
      <div className="weather-stats">
        <span className="skeleton-block skeleton-stat" />
        <span className="skeleton-block skeleton-stat" />
      </div>
    </div>
  );
}

function WeatherWidget() {
  const [city, setCity] = useState(getStoredCity);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  async function loadWeather(requestedCity: string, keepCurrentWeather = false) {
    setIsLoading(true);
    setErrorMessage("");

    if (!keepCurrentWeather) {
      setWeather(null);
    }

    try {
      const weatherData = await fetchWeatherByCity(requestedCity);
      setWeather(weatherData);
      setCity(weatherData.city);
      setUpdatedAt(new Date());

      try {
        window.localStorage.setItem(WEATHER_CITY_STORAGE_KEY, weatherData.city);
      } catch {
        // Storage may be unavailable in private browsing; weather still works without it.
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load weather data.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCity = city.trim();

    if (!trimmedCity) {
      setErrorMessage("Please enter a city name.");
      setWeather(null);
      return;
    }

    void loadWeather(trimmedCity);
  }

  return (
    <section
      className="widget weather-widget"
      aria-labelledby="weather-widget-title"
      aria-busy={isLoading}
    >
      <div className="widget-header">
        <div>
          <p className="eyebrow">OpenWeather API</p>
          <h2 id="weather-widget-title">Weather</h2>
        </div>
        {weather?.icon ? (
          <img
            className="weather-icon"
            src={getWeatherIconUrl(weather.icon)}
            alt={weather.weatherDescription}
          />
        ) : null}
      </div>

      <form className="weather-form" onSubmit={handleSubmit}>
        <label htmlFor="city">City</label>
        <div className="weather-search">
          <input
            id="city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Try Chicago"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading && !weather ? "Loading..." : "Search"}
          </button>
        </div>
      </form>

      {errorMessage ? (
        <div className="error-state" role="alert">
          <p>{errorMessage}</p>
          {city.trim() ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadWeather(city.trim())}
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {isLoading && !weather ? (
        <>
          <p className="sr-only" role="status">Fetching current conditions...</p>
          <WeatherSkeleton />
        </>
      ) : null}

      {weather ? (
        <div className="weather-results" aria-live="polite">
          <div>
            <p className="weather-location">
              {weather.city}, {weather.country}
            </p>
            <p className="weather-description">{weather.weatherDescription}</p>
          </div>

          <p className="weather-temp">{weather.temperature}&deg;F</p>

          <dl className="weather-stats">
            <div>
              <dt>Feels like</dt>
              <dd>{weather.feelsLike}&deg;F</dd>
            </div>
            <div>
              <dt>Humidity</dt>
              <dd>{weather.humidity}%</dd>
            </div>
          </dl>

          <div className="widget-footer">
            <p>{updatedAt ? `Updated ${timeFormatter.format(updatedAt)}` : null}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadWeather(weather.city, true)}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default WeatherWidget;
