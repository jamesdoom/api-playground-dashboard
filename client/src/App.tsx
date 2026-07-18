import { useEffect, useState } from "react";
import CryptoWidget from "./components/CryptoWidget";
import NewsWidget from "./components/NewsWidget";
import StocksWidget from "./components/StocksWidget";
import WeatherWidget from "./components/WeatherWidget";
import { checkServerHealth } from "./services/api";
import "./App.css";

function App() {
  const [serverStatus, setServerStatus] = useState("Checking server...");

  useEffect(() => {
    checkServerHealth()
      .then((data) => setServerStatus(data.message))
      .catch(() => setServerStatus("Server connection failed"));
  }, []);

  const serverStatusTone = serverStatus === "Checking server..."
    ? "pending"
    : serverStatus === "Server connection failed"
      ? "error"
      : "online";

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Portfolio Project</p>
          <h1>API Playground Dashboard</h1>
          <p className="dashboard-intro">Live signals from weather, markets, and the wider world.</p>
        </div>
        <div className="dashboard-header-actions">
          <p className={`server-status server-status-${serverStatusTone}`}>{serverStatus}</p>
        </div>
      </header>

      <section className="dashboard-grid dashboard-grid-default" aria-label="API widgets">
        <WeatherWidget />
        <StocksWidget />
        <CryptoWidget />
        <NewsWidget />
      </section>
    </main>
  );
}

export default App;
