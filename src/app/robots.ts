import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-origin";

// Pages publiques indexables ; admin, paiement et API exclus.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/merci", "/paiement-demo", "/livraison", "/commande"] },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
