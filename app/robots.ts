import type { MetadataRoute } from "next";
import { isStagingBuild } from "@/lib/staging";
import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  if (isStagingBuild()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", disallow: ["/api/", "/dev/"] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
