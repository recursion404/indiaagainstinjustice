import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getPublicIssues } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/live-traffic",
    "/report-traffic-problem",
    "/top-traffic-problems",
    "/volunteer",
    "/polls",
    "/traffic-rules-pledge",
  ];
  const issues = await getPublicIssues(500);

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date()
    })),
    ...issues.filter((issue) => issue.indexable).map((issue) => ({
      url: `${siteConfig.url}/traffic-issues/pune/${issue.slug}`,
      lastModified: new Date(issue.publishedAt ?? issue.createdAt)
    }))
  ];
}
