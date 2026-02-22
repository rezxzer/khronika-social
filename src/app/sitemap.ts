import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://khronika.ge";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/register`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/circles`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/feed`, changeFrequency: "hourly", priority: 0.9 },
  ];
}
