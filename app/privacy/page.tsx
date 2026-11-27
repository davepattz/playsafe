import Link from "next/link";
import InformationPage from "@/components/InformationPage";
import { ReportSection } from "@/components/report/ReportSections";
import { AnalyticsSettings } from "@/components/Analytics";
import { isStagingBuild } from "@/lib/staging";

export const metadata = {
  title: "Privacy policy | PlaySafe.games",
  description: "How PlaySafe handles game searches, optional analytics, feedback and third-party services.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <InformationPage title="Privacy policy">
    <ReportSection id="requests" title="Search and report requests">
      <p>You can use PlaySafe without an account. Search terms are processed to find games and may be sent to Steam for matching. PlaySafe stores game metadata, catalogue titles and aggregate report view counts. Hosting and other service providers may process request and network information in operational logs.</p>
      <p className="mt-3">If per-client rate limits are enabled, PlaySafe uses a short-lived keyed digest of the connecting IP address for that limit. The rate-limit records do not store raw IP addresses.</p>
    </ReportSection>
    <ReportSection id="analytics" title="Optional analytics">
      <p>When you enable Google Analytics, it may use cookies and process device, browser and usage information. PlaySafe sends game selection, report view, successful sharing, Where to buy opens and store clicks with the game’s Steam App ID. Store click events include retailer name, link type and affiliate status. Search events record a result count. PlaySafe does not send typed search terms or contact details as analytics event parameters.</p>
      <p className="my-3">Your choice is saved in this browser. Turning analytics off stops PlaySafe from sending future analytics events from this browser. You can remove existing cookies in your browser settings. <a className="underline" href="https://policies.google.com/privacy">Google’s privacy policy</a> explains how Google processes data.</p>
      {isStagingBuild() ? <p>Analytics is disabled on staging.</p> : <AnalyticsSettings />}
    </ReportSection>
    <ReportSection id="third-parties" title="Third-party services and feedback">
      <p>Steam artwork, embedded YouTube videos and legacy Disqus comments may connect your browser to their providers. Steam, GitHub and other linked services have their own privacy policies. Feedback sent by email may include your email address and the details you choose to provide. Please keep children’s details and other private information out of reports and public issues.</p>
      <p className="mt-3">For privacy questions or requests about information you have shared, see <Link className="underline" href="/contact">Contact and feedback</Link>.</p>
    </ReportSection>
  </InformationPage>;
}
