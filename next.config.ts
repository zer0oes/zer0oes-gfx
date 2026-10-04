import type { NextConfig } from "next";

// Médias servis par le bucket S3 (NEXT_PUBLIC_MEDIA_URL) : autorisés pour next/image
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_URL ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL) : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: mediaHost ? [{ protocol: "https", hostname: mediaHost.hostname, pathname: "/**" }] : [],
  },
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
