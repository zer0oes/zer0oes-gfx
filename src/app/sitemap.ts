import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-origin";
import { getStore } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { streamers } = await getStore().getPortfolio();
  const pages = ["", "/offres", "/portfolio", "/a-propos", "/contact", "/cgv", "/mentions-legales", "/confidentialite"];
  return [
    ...pages.map((p) => ({ url: `${siteOrigin}${p}`, priority: p === "" ? 1 : p === "/offres" ? 0.9 : 0.5 })),
    ...streamers.map((s) => ({ url: `${siteOrigin}/portfolio/${s.id}`, priority: 0.7 })),
  ];
}
