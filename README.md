# API Playground Dashboard

[![CI](https://github.com/jamesdoom/api-playground-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/jamesdoom/api-playground-dashboard/actions/workflows/ci.yml)

A responsive full-stack dashboard that brings several third-party APIs into one consistent interface. The project demonstrates API integration, server-side credential protection, shared TypeScript contracts, provider error handling, response caching, automated tests, and serverless deployment.

**[View the live dashboard](https://api-playground-dashboard-sigma.vercel.app/)**

## Features

- Search current weather conditions by city with OpenWeather
- Track Bitcoin, Ethereum, and Solana prices and 24-hour movement with CoinGecko
- Browse recent Guardian headlines by category
- Refresh controls, loading skeletons, retry actions, and last-updated timestamps
- Persistent weather city and news category preferences using `localStorage`
- Responsive layouts and accessible loading and error announcements
- Five-minute CDN caching with stale-while-revalidate support
- Shared provider services used by both Express and Vercel serverless handlers
- Vitest, Testing Library, ESLint, production build, and server type checks in CI

## Technology

| Layer | Tools |
| --- | --- |
| Client | React, TypeScript, Vite, CSS |
| Local API | Node.js, Express, TypeScript, tsx |
| Production API | Vercel Functions |
| Providers | OpenWeather, CoinGecko, The Guardian Open Platform |
| Quality | Vitest, Testing Library, ESLint, GitHub Actions |

## Architecture

```text
React dashboard
      |
      | /api/weather, /api/crypto, /api/news
      v
+----------------------+     +--------------------------+
| Local Express routes |     | Vercel API functions     |
+----------------------+     +--------------------------+
             \                    /
              \                  /
               v                v
          Shared TypeScript services
          - provider requests
          - response mapping
          - friendly API errors
          - shared contracts
                     |
                     v
       OpenWeather / CoinGecko / Guardian
```

The browser never receives provider credentials. Both production handlers and the local Express server call the same shared service layer so their behavior stays aligned.

## Project structure

```text
api-playground-dashboard/
├─ api/                    # Vercel serverless handlers
├─ client/src/
│  ├─ components/         # Dashboard widgets and component tests
│  ├─ services/           # Browser API client
│  ├─ test/               # Handler and shared-service tests
│  └─ types/              # Client-facing contract exports
├─ server/src/
│  ├─ routes/             # Local Express routes
│  ├─ services/           # Environment-aware service wrappers
│  └─ types/              # Server-facing contract exports
├─ shared/
│  ├─ contracts/          # Provider and dashboard TypeScript types
│  ├─ errors/             # Normalized provider errors
│  ├─ http/               # Cache and serverless utilities
│  └─ services/           # Shared provider integrations
└─ .github/workflows/     # Continuous integration
```

## Local development

### Prerequisites

- Node.js 22 or newer
- API keys from [OpenWeather](https://openweathermap.org/api), [CoinGecko](https://www.coingecko.com/en/api), and [The Guardian](https://open-platform.theguardian.com/)

### 1. Install dependencies

```bash
npm install --prefix client
npm install --prefix server
```

### 2. Configure the server

Copy `server/.env.example` to `server/.env` and replace the placeholder values:

```dotenv
PORT=5000
OPENWEATHER_API_KEY=your_openweather_api_key
GUARDIAN_API_KEY=your_guardian_api_key
COINGECKO_API_KEY=your_coingecko_demo_api_key
```

### 3. Start both applications

Run the API in one terminal:

```bash
npm run dev --prefix server
```

Run the client in another:

```bash
npm run dev --prefix client
```

Vite serves the dashboard at `http://localhost:5173` and proxies `/api` requests to Express at `http://localhost:5000`.

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Reports API availability |
| `GET` | `/api/weather?city=Chicago` | Returns normalized current conditions |
| `GET` | `/api/crypto` | Returns normalized USD prices and 24-hour changes |
| `GET` | `/api/news?category=technology` | Returns six recent headlines |

Provider responses are reduced to the fields the dashboard needs. Errors are translated into stable, user-friendly messages before they reach the client.

## Quality checks

Run the same complete verification used by GitHub Actions:

```bash
npm run verify
```

This runs the shared TypeScript build, test suite, linting, client production build, and server type check.

## Deployment

The repository is configured for Vercel. The React client builds to `client/dist`, while files in `api/` become serverless endpoints. Add `OPENWEATHER_API_KEY`, `GUARDIAN_API_KEY`, and `COINGECKO_API_KEY` to the Vercel project environment before deploying.

## Roadmap

- Add historical price charts and selectable crypto assets
- Add end-to-end browser tests for critical user flows
- Add more API categories such as movies, sports, and AI
- Add drag-and-drop widget customization
