import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} - Public Accountability`,
    short_name: "IAI",
    description: "Report civic issues, review public records, and follow local accountability updates.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8f0",
    theme_color: "#ff6b00",
    orientation: "portrait-primary",
    categories: ["civic", "government", "news", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
