"use client";

import ReportMessage from "@/components/report/ReportMessage";

export default function ReportError() {
  return <ReportMessage title="The game report could not be loaded" retry>
    Try reloading this report or return to search.
  </ReportMessage>;
}
