import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { CompanyScore } from "@/lib/types";
import { categoryLabels, readinessCategories } from "@/frontend/lib/content";
import {
  formatReportDate,
  gradeClass,
  sortCheckResults,
} from "@/frontend/lib/format";
import { SiteFooter } from "@/frontend/components/site-footer";
import { SiteHeader } from "@/frontend/components/site-header";

interface ReportViewProps {
  report: CompanyScore;
  privateResult?: boolean;
  rawApiHref?: string;
}

export function ReportView({
  report,
  privateResult = false,
  rawApiHref,
}: ReportViewProps) {
  const className = gradeClass(report.grade);
  const results = sortCheckResults(report.results);

  return (
    <>
      <SiteHeader />
      <main className="report-page">
        <Link className="agent-directive" href="/llms.txt">
          Agent-readable site index: /llms.txt
        </Link>
        <div className="shell">
          <div className="report-toolbar">
            <Link className="button report-back" href="/#leaderboard">
              Back to leaderboard
            </Link>
            {privateResult ? (
              <span className="private-result-label">Private scan result</span>
            ) : null}
          </div>

          <section className="report-hero">
            <div>
              <p className="eyebrow">
                {privateResult ? "Private readiness report" : "Company readiness report"}
              </p>
              <h1>{report.name}</h1>
              <p className="report-url">
                <a href={report.docsUrl} rel="noreferrer" target="_blank">
                  {report.docsUrl}
                  <ExternalLink aria-hidden="true" size={13} />
                </a>
              </p>
              <p className="report-summary">
                {report.name} documentation scored {report.score} out of 100.
                This report explains the category results and all{" "}
                {report.checks.total} agent-readiness checks.
              </p>
            </div>
            <div className="report-score-panel">
              <span className={`grade grade-${className}`}>Grade {report.grade}</span>
              <strong className={`report-score score-${className} mono`}>
                {report.score}
              </strong>
              <span className="mono">/ 100</span>
            </div>
          </section>

          <section className="report-meta-grid" aria-label="Report metadata">
            <div>
              <span>Category</span>
              <strong>{report.category}</strong>
            </div>
            <div>
              <span>Scoring engine</span>
              <strong className="mono">AFDocs {report.afdocsVersion ?? "unknown"}</strong>
            </div>
            <div>
              <span>Last scored</span>
              <strong className="mono">{formatReportDate(report.scoredAt)}</strong>
            </div>
            <div>
              <span>Platform detected</span>
              <strong>{report.platformDetected ?? "Not detected"}</strong>
            </div>
          </section>

          <section className="report-section">
            <div className="section-head">
              <div>
                <p className="eyebrow">Score breakdown</p>
                <h2>Seven readiness categories.</h2>
              </div>
              <div className="report-counts mono" aria-label="Check totals">
                <span className="status-pass">{report.checks.pass} pass</span>
                <span className="status-warn">{report.checks.warn} warn</span>
                <span className="status-fail">{report.checks.fail} fail</span>
                <span>{report.checks.skip} skip</span>
                {report.checks.error ? (
                  <span className="status-error">{report.checks.error} error</span>
                ) : null}
              </div>
            </div>
            <div className="report-categories">
              {readinessCategories.map((category) => {
                const rawScore = report.categoryScores?.[category.id];
                const score =
                  typeof rawScore === "number" ? Math.round(rawScore) : null;
                return (
                  <div className="report-category" key={category.id}>
                    <div className="report-category-head">
                      <span>{category.title}</span>
                      <strong className="mono">{score ?? "N/A"}</strong>
                    </div>
                    <div
                      aria-label={
                        score === null
                          ? `${category.title} score not applicable`
                          : `${category.title} score ${score} out of 100`
                      }
                      className="report-meter"
                      role="img"
                    >
                      <span style={{ width: `${score ?? 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="report-section" id="checks">
            <div className="section-head">
              <div>
                <p className="eyebrow">Check results</p>
                <h2>All {report.checks.total} checks.</h2>
              </div>
              {rawApiHref ? (
                <a
                  className="button"
                  href={rawApiHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open raw API
                  <ExternalLink aria-hidden="true" size={14} />
                </a>
              ) : null}
            </div>
            <div className="check-list">
              {results.length ? (
                results.map((result) => (
                  <article className="check-row" key={result.id}>
                    <span className={`check-status status-${result.status}`}>
                      {result.status}
                    </span>
                    <div>
                      <h3>{result.id}</h3>
                      <p>{result.message}</p>
                    </div>
                    <span className="check-category">
                      {categoryLabels[result.category] ?? result.category}
                    </span>
                  </article>
                ))
              ) : (
                <p className="empty-checks">Detailed check results are not available.</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
