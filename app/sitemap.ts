import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { getPublicLeaderboard } from "@/lib/public-scores";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const companies = await getPublicLeaderboard();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date("2026-06-18"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    ...companies.map((company) => ({
      url: `${siteUrl}/companies/${company.slug}`,
      lastModified: new Date(company.scoredAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
