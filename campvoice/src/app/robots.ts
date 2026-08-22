import type { MetadataRoute } from "next";
import { brand } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Everything behind sign-in is private and should never be crawled.
        disallow: ["/api/", "/dashboard", "/create", "/content", "/week", "/camp-dna", "/settings", "/admin", "/onboarding"],
      },
    ],
    sitemap: `${brand.siteUrl}/sitemap.xml`,
  };
}
