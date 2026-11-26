"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import {
  analyticsAllowed, analyticsId, analyticsReadyEvent, setAnalyticsAllowed, subscribeAnalytics,
} from "@/lib/analytics";

function useAnalyticsPreference() {
  return useSyncExternalStore(subscribeAnalytics, analyticsAllowed, () => false);
}

export function AnalyticsSettings() {
  const allowed = useAnalyticsPreference();
  return <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-bold">
    <input type="checkbox" checked={allowed} onChange={(event) => setAnalyticsAllowed(event.target.checked)} />
    Allow optional Google Analytics
  </label>;
}

export default function Analytics() {
  const allowed = useAnalyticsPreference();
  useEffect(() => {
    Object.assign(window, { [`ga-disable-${analyticsId}`]: !allowed });
    if (!allowed) return;
    if (!window.gtag) {
      const queue = window.dataLayer ??= [];
      window.gtag = (...args) => { queue.push(args); };
      window.gtag("js", new Date());
      window.gtag("config", analyticsId, {
        send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        page_location: window.location.origin + window.location.pathname, page_referrer: "",
      });
    }
    window.dispatchEvent(new Event(analyticsReadyEvent));
  }, [allowed]);
  if (!allowed) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`} strategy="afterInteractive" />;
}
