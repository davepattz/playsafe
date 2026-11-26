import InformationPage from "@/components/InformationPage";
import { ReportSection } from "@/components/report/ReportSections";

export const metadata = {
  title: "Contact and feedback | PlaySafe.games",
  description: "Report incorrect Steam game information, suggest an improvement or ask a privacy question.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return <InformationPage title="Contact and feedback">
    <ReportSection id="corrections" title="Report a problem or suggest a change">
      <p>Include the PlaySafe report URL or Steam App ID, the finding you want us to check and a link to supporting evidence. Keep personal information out of public issues.</p>
      <p className="mt-3"><a className="underline" href="https://github.com/davepattz/playsafe/issues/new">Open a public GitHub issue</a></p>
    </ReportSection>
    <ReportSection id="private" title="Privacy questions and private feedback">
      {email && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)
        ? <p>Email <a className="underline" href={`mailto:${email}`}>{email}</a>.</p>
        : <p>Ask a maintainer for a private contact channel in a GitHub issue. Keep the request general and omit any private details.</p>}
    </ReportSection>
  </InformationPage>;
}
