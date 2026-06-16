type ApiRequest = {
  method?: string;
  query: {
    city?: string | string[];
  };
};

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
};

type OpenWeatherApiResponse = {
  name: string;
  sys: {
    country: string;
  };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
};

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

function getCityFromQuery(queryCity: string | string[] | undefined): string {
  const city = Array.isArray(queryCity) ? queryCity[0] : queryCity;
  return city?.trim() ?? "";
}

function mapOpenWeatherResponse(data: OpenWeatherApiResponse) {
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

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ message: "This endpoint only supports GET requests." });
    return;
  }

  const city = getCityFromQuery(request.query.city);

  if (!city) {
    response.status(400).json({ message: "Please enter a city name." });
    return;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    response.status(500).json({ message: "Weather service is not configured yet." });
    return;
  }

  const searchParams = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: "imperial",
  });

  try {
    const openWeatherResponse = await fetch(`${OPENWEATHER_BASE_URL}?${searchParams.toString()}`);

    if (openWeatherResponse.status === 404) {
      response.status(404).json({ message: "We could not find weather for that city." });
      return;
    }

    if (openWeatherResponse.status === 401) {
      response.status(500).json({ message: "Weather service is not configured correctly." });
      return;
    }

    if (!openWeatherResponse.ok) {
      response.status(500).json({ message: "Weather data is unavailable right now. Please try again soon." });
      return;
    }

    const weatherData = (await openWeatherResponse.json()) as OpenWeatherApiResponse;
    response.status(200).json(mapOpenWeatherResponse(weatherData));
  } catch (error) {
    console.error("Weather request failed:", error);
    response.status(500).json({ message: "Weather data is unavailable right now. Please try again soon." });
  }
}
