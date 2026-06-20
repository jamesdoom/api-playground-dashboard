export const DASHBOARD_WIDGETS = [
  { id: "weather", label: "Weather" },
  { id: "stocks", label: "Stock watchlist" },
  { id: "crypto", label: "Crypto market" },
  { id: "news", label: "Latest headlines" },
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number]["id"];

export interface DashboardPreferences {
  order: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
}

export const DASHBOARD_PREFERENCES_KEY = "dashboard-widget-preferences";

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  order: DASHBOARD_WIDGETS.map((widget) => widget.id),
  hidden: [],
};

function isDashboardWidgetId(value: unknown): value is DashboardWidgetId {
  return DASHBOARD_WIDGETS.some((widget) => widget.id === value);
}

function uniqueWidgetIds(value: unknown): DashboardWidgetId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter(isDashboardWidgetId))];
}

export function loadDashboardPreferences(): DashboardPreferences {
  try {
    const stored = window.localStorage.getItem(DASHBOARD_PREFERENCES_KEY);

    if (stored === null) {
      return {
        order: [...DEFAULT_DASHBOARD_PREFERENCES.order],
        hidden: [],
      };
    }

    const parsed = JSON.parse(stored) as { order?: unknown; hidden?: unknown };
    const storedOrder = uniqueWidgetIds(parsed.order);
    const missingWidgets = DEFAULT_DASHBOARD_PREFERENCES.order.filter(
      (id) => !storedOrder.includes(id),
    );

    return {
      order: [...storedOrder, ...missingWidgets],
      hidden: uniqueWidgetIds(parsed.hidden),
    };
  } catch {
    return {
      order: [...DEFAULT_DASHBOARD_PREFERENCES.order],
      hidden: [],
    };
  }
}

export function saveDashboardPreferences(preferences: DashboardPreferences) {
  try {
    window.localStorage.setItem(DASHBOARD_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Storage is optional; customization still works for the current visit.
  }
}
