import type { MetadataRoute } from "next";
import { siteConfig } from "@/constants/site";

const publicRoutes = [
  "",
  "/products",
  "/offers",
  "/about",
  "/contact",
  "/delivery-returns",
  "/privacy-policy",
  "/terms"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url.replace(/\/$/, "");

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7
  }));
}
