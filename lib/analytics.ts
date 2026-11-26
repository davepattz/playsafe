const preferenceKey = "playsafe-analytics";
export const analyticsPreferenceEvent = "playsafe-analytics-preference";
export const analyticsReadyEvent = "playsafe-analytics-ready";
export const analyticsId = "G-QXFD5D8991";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function analyticsAllowed() {
  try { return window.localStorage.getItem(preferenceKey) === "yes"; }
  catch { return false; }
}

export function setAnalyticsAllowed(value: boolean) {
  try {
    window.localStorage.setItem(preferenceKey, value ? "yes" : "no");
    window.dispatchEvent(new Event(analyticsPreferenceEvent));
  } catch {
    // Analytics remains disabled when durable preference storage is unavailable.
  }
}

export function subscribeAnalytics(callback: () => void) {
  window.addEventListener(analyticsPreferenceEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(analyticsPreferenceEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

type Events = {
  game_search: { result_count: number };
  game_select: { steam_app_id: number };
  report_view: { steam_app_id: number };
  report_share: { steam_app_id: number; method: "native" | "copy" };
  steam_store_click: { steam_app_id: number };
};

export function track<K extends keyof Events>(event: K, values: Events[K]) {
  if (!analyticsAllowed() || !window.gtag) return false;
  window.gtag("event", event, {
    ...values, page_location: window.location.origin + window.location.pathname, page_referrer: "",
  });
  return true;
}
