import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Envoi de médias par l'admin en mode local (en production, les fichiers
      // vont directement du navigateur vers Supabase Storage via une URL signée).
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
