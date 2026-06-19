import type { Metadata } from "next";
import { SiteFooter } from "@/frontend/components/site-footer";
import { SiteHeader } from "@/frontend/components/site-header";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How AgentReady handles scan and contact data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <div className="shell legal-content">
          <p className="eyebrow">Privacy</p>
          <h1>Data used by AgentReady</h1>
          <p>
            AgentReady scans public documentation URLs submitted by users. It does
            not request credentials or access private documentation.
          </p>

          <h2>Scan data</h2>
          <p>
            The submitted URL, generated score, check results, and technical
            metadata are stored to return the report. User-submitted reports are
            private by default and are automatically removed after 30 days.
          </p>

          <h2>Abuse prevention</h2>
          <p>
            Requests are limited using a one-way hash derived from network and
            browser information. Raw IP addresses are not stored in the request
            limit table. Limit records are removed after they are no longer needed.
          </p>

          <h2>Contact requests</h2>
          <p>
            When you request an audit call, AgentReady stores the work email and
            documentation URL you submit so the AgentReady team can respond.
            Contact requests are retained for no longer than 180 days.
          </p>

          <h2>Questions or deletion requests</h2>
          <p>
            Email{" "}
            <a href="mailto:aayushkotadia76@gmail.com">
              aayushkotadia76@gmail.com
            </a>{" "}
            to ask about stored data or request deletion.
          </p>

          <p className="legal-updated">Last updated: June 18, 2026.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
