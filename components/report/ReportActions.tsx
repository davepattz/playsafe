"use client";

import { useState } from "react";

const buttonStyle = "min-h-11 rounded-xl border border-[#d8c7e4] bg-white px-4 font-bold text-[#563569] hover:bg-[#f2e5fa]";

export default function ReportActions({ title, path }: { title: string; path: string }) {
  const [status, setStatus] = useState("");
  const [manualLink, setManualLink] = useState<string>();
  const url = () => new URL(path, window.location.origin).href;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setManualLink(undefined);
      setStatus("Report link copied.");
    } catch {
      setManualLink(url());
      setStatus("Select and copy the address below.");
    }
  }

  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: `${title} · PlaySafe.games`, url: url() });
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
