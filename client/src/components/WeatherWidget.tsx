import { useState, type FormEvent } from "react";
import { fetchWeatherByCity } from "../services/api";
import type { WeatherData } from "../types/weather";

function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function WeatherWidget() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCity = city.trim();

    if (!trimmedCity) {
      setErrorMessage("Please enter a city name.");
      setWeather(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const weatherData = await fetchWeatherByCity(trimmedCity);
      setWeather(weatherData);
    } catch (error) {
      setWeather(null);
      setErrorMessage(error instanceof Error ? error.message : "Unable to load weather data.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="widget weather-widget" aria-labelledby="weather-widget-title">
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
            {isLoading ? "Loading..." : "Search"}
          </button>
        </div>
      </form>

      {errorMessage ? <p className="widget-message error-message">{errorMessage}</p> : null}
      {isLoading ? <p className="widget-message">Fetching current conditions...</p> : null}

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
        </div>
      ) : null}
    </section>
  );
}

export default WeatherWidget;
