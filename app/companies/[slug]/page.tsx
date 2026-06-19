import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportView } from "@/frontend/components/report-view";
import { getPublicCompanyScore } from "@/lib/public-scores";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await getPublicCompanyScore(slug);
  if (!company) return {};

  return {
    title: `${company.name} documentation readiness`,
    description: `${company.name} scored ${company.score}/100 with grade ${company.grade}. Review its category scores and ${company.checks.total} agent-readiness checks.`,
    alternates: {
      canonical: `/companies/${company.slug}`,
    },
    openGraph: {
      title: `${company.name}: ${company.score}/100`,
      description: `${company.checks.pass} of ${company.checks.total} agent-readiness checks passed.`,
      type: "article",
    },
  };
}

export default async function CompanyReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getPublicCompanyScore(slug);
  if (!company) notFound();

  return (
    <ReportView
      rawApiHref={`/api/company/${company.slug}`}
      report={company}
    />
  );
}
