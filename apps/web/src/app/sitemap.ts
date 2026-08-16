import type { MetadataRoute } from "next";
import { puneLocations } from "@citizens-first/shared";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/report-traffic-problem",
    "/top-traffic-problems",
    "/volunteer",
    "/polls",
    "/traffic-rules-pledge",
    "/traffic-issues/pune/baner-heavy-traffic-pun-001245"
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date()
    })),
    ...puneLocations.map((location) => ({
      url: `${siteConfig.url}/pune-traffic/${location}`,
      lastModified: new Date()
    }))
  ];
}
