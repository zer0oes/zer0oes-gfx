import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Envoi de médias par l'admin en mode local (en production, les fichiers
      // vont directement du navigateur vers Supabase Storage via une URL signée).
      bodySizeLimit: "25mb",
    },
  },
  // Médias du portfolio hors de Google Images ; les pages restent indexées.
  async headers() {
    return [
      {
        source: "/portfolio",
        headers: [{ key: "X-Robots-Tag", value: "noimageindex" }],
      },
      {
        source: "/portfolio/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noimageindex" }],
      },
      // Les fichiers eux-mêmes (règle placée en dernier : elle l'emporte)
      {
        source: "/portfolio/:file(.*\.(?:webp|png|jpe?g|gif|mp4|webm))",
        headers: [{ key: "X-Robots-Tag", value: "noindex, noimageindex" }],
      },
    ];
  },
};

export default nextConfig;
