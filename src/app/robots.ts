import type { MetadataRoute } from "next";
import { siteConfig } from "@/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/checkout",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/auth/"
        ]
      }
    ],
    sitemap: `${siteConfig.url.replace(/\/$/, "")}/sitemap.xml`
  };
}
