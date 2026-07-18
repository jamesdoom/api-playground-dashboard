import { useState, type FormEvent } from "react";
import { fetchWeatherByCity } from "../services/api";
import type { WeatherData } from "../types/weather";

const WEATHER_CITY_STORAGE_KEY = "dashboard-weather-city";
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

function formatForecastTime(value: string): string {
  const [, time = ""] = value.split("T");
  const [hour = "0", minute = "0"] = time.split(":");
  return timeFormatter.format(new Date(2000, 0, 1, Number(hour), Number(minute)));
}

function formatForecastDay(value: string, index: number): string {
  if (index === 0) {
    return "Today";
  }

  const [year, month, day] = value.split("-").map(Number);
  return dayFormatter.format(new Date(year, month - 1, day, 12));
}

function getStoredCity(): string {
  try {
    return window.localStorage.getItem(WEATHER_CITY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function WeatherIcon({ icon, description }: { icon: string; description: string }) {
  return (
    <span className="weather-icon weather-icon-fallback" role="img" aria-label={description}>
      {icon}
    </span>
  );
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
          <p className="eyebrow">Open-Meteo API</p>
          <h2 id="weather-widget-title">Weather</h2>
        </div>
        {weather?.icon ? (
          <WeatherIcon
            key={weather.icon}
            icon={weather.icon}
            description={weather.weatherDescription}
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

          {weather.hourlyForecast?.length ? (
            <section className="forecast-section" aria-labelledby="hourly-forecast-title">
              <div className="forecast-heading">
                <h3 id="hourly-forecast-title">Next 24 hours</h3>
                <span>Local time</span>
              </div>
              <div className="hourly-forecast" tabIndex={0}>
                {weather.hourlyForecast.map((hour) => (
                  <article className="hourly-forecast-card" key={hour.time}>
                    <time dateTime={hour.time}>{formatForecastTime(hour.time)}</time>
                    <span role="img" aria-label={hour.weatherDescription}>{hour.icon}</span>
                    <strong>{hour.temperature}&deg;</strong>
                    <small aria-label={`${hour.precipitationProbability}% chance of precipitation`}>
                      💧 {hour.precipitationProbability}%
                    </small>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {weather.dailyForecast?.length ? (
            <section className="forecast-section" aria-labelledby="daily-forecast-title">
              <div className="forecast-heading">
                <h3 id="daily-forecast-title">7-day forecast</h3>
              </div>
              <div className="daily-forecast">
                {weather.dailyForecast.map((day, index) => (
                  <article className="daily-forecast-row" key={day.date}>
                    <time dateTime={day.date}>{formatForecastDay(day.date, index)}</time>
                    <span className="daily-condition" role="img" aria-label={day.weatherDescription}>
                      {day.icon}
                    </span>
                    <span className="daily-temperatures">
                      <strong>{day.high}&deg;</strong>
                      <span>{day.low}&deg;</span>
                    </span>
                    <span className="daily-precipitation" aria-label={`${day.precipitationProbability}% chance of precipitation`}>
                      💧 {day.precipitationProbability}%
                    </span>
                    <span className="sun-times">
                      <span title="Sunrise">↑ {formatForecastTime(day.sunrise)}</span>
                      <span title="Sunset">↓ {formatForecastTime(day.sunset)}</span>
                    </span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

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
