import { useEffect, useState } from "react";
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

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Portfolio Project</p>
          <h1>API Playground Dashboard</h1>
        </div>
        <p className="server-status">{serverStatus}</p>
      </header>

      <section className="dashboard-grid" aria-label="API widgets">
        <WeatherWidget />
      </section>
    </main>
  );
}

export default App;
