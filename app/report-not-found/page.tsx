import type { Metadata } from "next";
import NotFound from "@/app/not-found";

export const metadata: Metadata = {
  title: "Report not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportNotFoundPage() {
  return <NotFound />;
}
