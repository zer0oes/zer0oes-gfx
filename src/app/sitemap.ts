import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-origin";
import { getStore } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { streamers } = await getStore().getPortfolio();
  const pages = ["", "/offres", "/portfolio", "/a-propos", "/contact", "/cgv", "/mentions-legales", "/confidentialite"];
  const all = [
    ...pages.map((path) => ({ path, priority: path === "" ? 1 : path === "/offres" ? 0.9 : 0.5 })),
    ...streamers.map((s) => ({ path: `/portfolio/${s.id}`, priority: 0.7 })),
  ];
  // Chaque page en français (sans préfixe) et en anglais (/en), reliées entre elles
  const languages = (path: string) => ({ fr: `${siteOrigin}${path}`, en: `${siteOrigin}/en${path}` });
  return [
    ...all.map((e) => ({ url: `${siteOrigin}${e.path}`, priority: e.priority, alternates: { languages: languages(e.path) } })),
    ...all.map((e) => ({ url: `${siteOrigin}/en${e.path}`, priority: e.priority, alternates: { languages: languages(e.path) } })),
  ];
}
