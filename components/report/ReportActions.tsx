"use client";

import { useEffect, useRef, useState } from "react";
import { analyticsReadyEvent, track } from "@/lib/analytics";
import { STEAM_STORE } from "@/lib/steamStore";

const buttonStyle = "min-h-11 rounded-xl border border-[#d8c7e4] bg-white px-4 font-bold text-[#563569] hover:bg-[#f2e5fa]";

export function SteamStoreLink({ appId }: { appId: number }) {
  return <a href={`${STEAM_STORE}/app/${appId}/`}
    onClick={() => track("steam_store_click", { steam_app_id: appId })}
    className="inline-flex min-h-11 items-center rounded-xl bg-[#4c2b66] px-4 font-bold text-white hover:bg-[#3a204e]">View on Steam</a>;
}

export default function ReportActions({ appId, title, url }: { appId: number; title: string; url: string }) {
  const [status, setStatus] = useState("");
  const [manualLink, setManualLink] = useState<string>();
  const viewed = useRef(false);
  useEffect(() => {
    const view = () => {
      if (!viewed.current) viewed.current = track("report_view", { steam_app_id: appId });
    };
    view();
    window.addEventListener(analyticsReadyEvent, view);
    return () => window.removeEventListener(analyticsReadyEvent, view);
  }, [appId]);

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

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonStyle} onClick={share}>Share report</button>
        <button type="button" className={buttonStyle} onClick={copy}>Copy report link</button>
      </div>
      <p role="status" className={status ? "mt-2 text-sm text-[#514960]" : "sr-only"}>{status}</p>
      {manualLink && <input aria-label="Report address" readOnly value={manualLink} onFocus={(event) => event.target.select()}
        className="mt-2 w-full rounded border bg-white p-2 text-sm" />}
    </div>
  );
}
