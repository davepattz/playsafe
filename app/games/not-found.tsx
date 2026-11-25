import ReportMessage from "@/components/report/ReportMessage";

export default function GameReportNotFound() {
  return <ReportMessage title="Game report unavailable">
    Steam did not provide a matching base game for this address. Search by game title to find a report.
  </ReportMessage>;
}
