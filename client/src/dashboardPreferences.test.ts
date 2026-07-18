import { describe, expect, it } from "vitest";
import {
  DASHBOARD_PREFERENCES_KEY,
  loadDashboardPreferences,
  saveDashboardPreferences,
} from "./dashboardPreferences";

describe("dashboard preferences", () => {
  it("uses the default widget order when no preference is stored", () => {
    expect(loadDashboardPreferences()).toEqual({
      order: ["weather", "news", "stocks", "crypto"],
      hidden: [],
    });
  });

  it("migrates the previous default order to the new layout", () => {
    window.localStorage.setItem(
      DASHBOARD_PREFERENCES_KEY,
      JSON.stringify({
        order: ["weather", "stocks", "crypto", "news"],
        hidden: [],
      }),
    );

    expect(loadDashboardPreferences()).toEqual({
      order: ["weather", "news", "stocks", "crypto"],
      hidden: [],
    });
  });

  it("normalizes persisted order and visibility values", () => {
    window.localStorage.setItem(
      DASHBOARD_PREFERENCES_KEY,
      JSON.stringify({
        order: ["crypto", "weather", "crypto", "unknown"],
        hidden: ["stocks", "unknown", "stocks"],
      }),
    );

    expect(loadDashboardPreferences()).toEqual({
      order: ["crypto", "weather", "news", "stocks"],
      hidden: ["stocks"],
    });
  });

  it("persists dashboard preferences", () => {
    saveDashboardPreferences({
      order: ["news", "crypto", "stocks", "weather"],
      hidden: ["weather"],
    });

    expect(JSON.parse(window.localStorage.getItem(DASHBOARD_PREFERENCES_KEY) ?? "")).toEqual({
      order: ["news", "crypto", "stocks", "weather"],
      hidden: ["weather"],
    });
  });
});
