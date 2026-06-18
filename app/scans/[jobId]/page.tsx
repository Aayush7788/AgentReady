import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScanResultLoader } from "@/frontend/components/scan-result-loader";

export const metadata: Metadata = {
  title: "Private scan result",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      jobId,
    )
  ) {
    notFound();
  }

  return <ScanResultLoader jobId={jobId} />;
}
