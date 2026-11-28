"use client";

import { useEffect, useId, useRef, useState } from "react";
import { analyticsReadyEvent, track } from "@/lib/analytics";
import type { RetailerLink } from "@/lib/retailers";
import { STEAM_STORE } from "@/lib/steamStore";

const buttonStyle = "min-h-11 rounded-xl border border-[#d8c7e4] px-4 font-bold text-[#563569]";

function SteamStoreLink({ appId }: { appId: number }) {
  return <a href={`${STEAM_STORE}/app/${appId}/`}
    onClick={() => track("steam_store_clicked", { steam_app_id: appId, retailer_name: "Steam", link_type: "steam_store", affiliate: false })}
    className="inline-flex min-h-11 items-center rounded-xl bg-[#285740] px-4 font-bold text-white hover:bg-[#204632]">View on Steam</a>;
}

export function ReportShare({ appId, title, url }: {
  appId: number; title: string; url: string;
}) {
  const [status, setStatus] = useState("");
  const [manualLink, setManualLink] = useState<string>();
  const copied = status === "Report link copied.";
  useEffect(() => {
    if (!copied) return;
    const reset = window.setTimeout(() => setStatus(""), 2500);
    return () => window.clearTimeout(reset);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      track("report_share", { steam_app_id: appId, method: "copy" });
      setManualLink(undefined);
      setStatus("Report link copied.");
    } catch {
      setManualLink(url);
      setStatus("Select and copy the address below.");
    }
  }

  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: `${title} · PlaySafe.games`, url });
      track("report_share", { steam_app_id: appId, method: "native" });
      setManualLink(undefined);
      setStatus("Report shared.");
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) await copy();
    }
  }

  return <div className="flex flex-col items-center text-center md:ml-auto md:shrink-0 md:items-end md:text-right">
    <button type="button" className="min-h-11 rounded-xl border border-white px-4 font-bold text-white hover:bg-white/15"
      onClick={share}>{copied ? "Copied!" : "Share report"}</button>
    <p role="status" className={status && !copied ? "mt-2 text-sm text-[#f1e6f6]" : "sr-only"}>{status}</p>
    {manualLink && <input aria-label="Report address" readOnly value={manualLink} onFocus={(event) => event.target.select()}
      className="mt-2 w-full max-w-md rounded border bg-white p-2 text-sm text-[#352145]" />}
  </div>;
}

export default function ReportActions({ appId, retailers }: { appId: number; retailers: RetailerLink[] }) {
  const [retailersOpen, setRetailersOpen] = useState(false);
  const panelId = useId();
  const viewed = useRef(false);

  useEffect(() => {
    const view = () => {
      if (!viewed.current) viewed.current = track("report_view", { steam_app_id: appId });
    };
    view();
    window.addEventListener(analyticsReadyEvent, view);
    return () => window.removeEventListener(analyticsReadyEvent, view);
  }, [appId]);

  return (
    <div className="min-w-0" aria-label="Report actions" role="group">
      <div className="flex flex-wrap items-start justify-center gap-2 md:justify-start">
        <SteamStoreLink appId={appId} />
        {retailers.length > 0 && <button type="button" aria-expanded={retailersOpen} aria-controls={panelId}
          className={`inline-flex items-center gap-2 bg-[#f2e5fa] hover:bg-[#e8d7f3] ${buttonStyle}`}
          onClick={() => {
            if (!retailersOpen) track("where_to_buy_opened", { steam_app_id: appId });
            setRetailersOpen(!retailersOpen);
          }}>
          Where to buy
          <svg aria-hidden="true" className={`size-4 ${retailersOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>}
      </div>
      {retailers.length > 0 && <div id={panelId} hidden={!retailersOpen}
        className="mt-3 max-w-xl rounded-xl border border-[#e8ddee] bg-[#fcfaff] p-4 text-sm text-[#514960]">
        <p>Check prices and availability at authorised game retailers.</p>
        <ul className="my-2">
          {retailers.map(({ name, href, linkType, affiliate }) => <li key={name}>
            <a href={href} target="_blank" rel="noopener noreferrer"
              onClick={() => track("retailer_link_clicked", { steam_app_id: appId, retailer_name: name, link_type: linkType, affiliate })}
              className="inline-flex min-h-11 items-center gap-2 font-bold text-[#563569] underline underline-offset-4">
              Search on {name}
              <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 5h6v6m0-6-8 8m6 0v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8c0-.6.4-1 1-1h5" />
              </svg>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>)}
        </ul>
        <p>Prices, availability, editions and regional restrictions may vary. Check the retailer&apos;s website before purchasing.</p>
      </div>}
    </div>
  );
}
