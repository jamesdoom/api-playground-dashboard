import { useEffect, useState } from "react";
import CryptoWidget from "./components/CryptoWidget";
import NewsWidget from "./components/NewsWidget";
import StocksWidget from "./components/StocksWidget";
import WeatherWidget from "./components/WeatherWidget";
import {
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_PREFERENCES,
  loadDashboardPreferences,
  saveDashboardPreferences,
  type DashboardPreferences,
  type DashboardWidgetId,
} from "./dashboardPreferences";
import { checkServerHealth } from "./services/api";
import "./App.css";

function App() {
  const [serverStatus, setServerStatus] = useState("Checking server...");
  const [preferences, setPreferences] = useState<DashboardPreferences>(loadDashboardPreferences);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizationStatus, setCustomizationStatus] = useState("");

  useEffect(() => {
    checkServerHealth()
      .then((data) => setServerStatus(data.message))
      .catch(() => setServerStatus("Server connection failed"));
  }, []);

  function updatePreferences(
    nextPreferences: DashboardPreferences,
    announcement: string,
  ) {
    setPreferences(nextPreferences);
    saveDashboardPreferences(nextPreferences);
    setCustomizationStatus(announcement);
  }

  function toggleWidget(id: DashboardWidgetId) {
    const widget = DASHBOARD_WIDGETS.find((candidate) => candidate.id === id);
    const isHidden = preferences.hidden.includes(id);
    const hidden = isHidden
      ? preferences.hidden.filter((hiddenId) => hiddenId !== id)
      : [...preferences.hidden, id];

    updatePreferences(
      { ...preferences, hidden },
      `${widget?.label ?? "Widget"} ${isHidden ? "shown" : "hidden"}.`,
    );
  }

  function moveWidget(id: DashboardWidgetId, direction: -1 | 1) {
    const currentIndex = preferences.order.indexOf(id);
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= preferences.order.length) {
      return;
    }

    const order = [...preferences.order];
    [order[currentIndex], order[nextIndex]] = [order[nextIndex], order[currentIndex]];
    const widget = DASHBOARD_WIDGETS.find((candidate) => candidate.id === id);

    updatePreferences(
      { ...preferences, order },
      `${widget?.label ?? "Widget"} moved ${direction < 0 ? "up" : "down"}.`,
    );
  }

  function restoreDefaults() {
    const defaults = {
      order: [...DEFAULT_DASHBOARD_PREFERENCES.order],
      hidden: [],
    };
    updatePreferences(defaults, "Default dashboard restored.");
  }

  function renderWidget(id: DashboardWidgetId) {
    switch (id) {
      case "weather":
        return <WeatherWidget key={id} />;
      case "stocks":
        return <StocksWidget key={id} />;
      case "crypto":
        return <CryptoWidget key={id} />;
      case "news":
        return <NewsWidget key={id} />;
    }
  }

  const visibleWidgetIds = preferences.order.filter((id) => !preferences.hidden.includes(id));
  const isDefaultLayout = preferences.hidden.length === 0
    && preferences.order.length === DEFAULT_DASHBOARD_PREFERENCES.order.length
    && preferences.order.every(
      (id, index) => id === DEFAULT_DASHBOARD_PREFERENCES.order[index],
    );
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
          <button
            type="button"
            className="secondary-button customize-dashboard-button"
            aria-expanded={isCustomizing}
            aria-controls="dashboard-customization"
            onClick={() => setIsCustomizing((current) => !current)}
          >
            {isCustomizing ? "Done" : "Customize dashboard"}
          </button>
        </div>
      </header>

      {isCustomizing ? (
        <section
          className="dashboard-customization"
          id="dashboard-customization"
          aria-labelledby="dashboard-customization-title"
        >
          <div className="customization-heading">
            <div>
              <p className="eyebrow">Your layout</p>
              <h2 id="dashboard-customization-title">Customize dashboard</h2>
            </div>
            <button type="button" className="secondary-button" onClick={restoreDefaults}>
              Restore defaults
            </button>
          </div>
          <p className="customization-instructions">
            Choose which widgets appear, then move them into your preferred reading order.
          </p>
          <ol className="customization-list">
            {preferences.order.map((id, index) => {
              const widget = DASHBOARD_WIDGETS.find((candidate) => candidate.id === id);
              const isVisible = !preferences.hidden.includes(id);

              return (
                <li key={id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleWidget(id)}
                    />
                    <span>Show {widget?.label}</span>
                  </label>
                  <div className="customization-move-controls">
                    <button
                      type="button"
                      onClick={() => moveWidget(id, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${widget?.label} up`}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWidget(id, 1)}
                      disabled={index === preferences.order.length - 1}
                      aria-label={`Move ${widget?.label} down`}
                    >
                      Down
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="sr-only" role="status" aria-live="polite">{customizationStatus}</p>
        </section>
      ) : null}

      <section
        className={`dashboard-grid${isDefaultLayout ? " dashboard-grid-default" : ""}`}
        aria-label="API widgets"
      >
        {visibleWidgetIds.length > 0 ? (
          visibleWidgetIds.map(renderWidget)
        ) : (
          <div className="dashboard-empty">
            <h2>Your dashboard is empty</h2>
            <p>Use Customize dashboard to show the widgets you want.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
