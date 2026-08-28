import type { MetadataRoute } from "next";
import { getPublicIssues } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/issues", "/report", "/records", "/polls", "/pledge", "/volunteer"];
  const issues = await getPublicIssues(500);

  const routes: MetadataRoute.Sitemap = [
    ...staticRoutes.map((route): MetadataRoute.Sitemap[number] => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "daily" : "weekly",
      priority: route === "" ? 1 : 0.8,
    })),
    ...issues.map((issue) => ({
      url: `${siteConfig.url}/issues/${issue.slug}`,
      lastModified: issue.updatedAt ? new Date(issue.updatedAt) : new Date(issue.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  return routes;
}
