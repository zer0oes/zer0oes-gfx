import "server-only";
import { localStoreAllowed, supabaseConfigured } from "@/lib/env";
import { mediaBaseUrl, mediaUrl } from "@/lib/media";
import { s3Configured, s3Download, s3Upload } from "@/lib/s3";
import { localStore } from "./local";
import { staticStore } from "./static";
import { supabaseStore } from "./supabase";
import type { Portfolio, Store } from "./types";

// Source des données :
// - Supabase si configuré (production) ;
// - sinon, en développement uniquement, le magasin JSON local (.data/dev-store.json) ;
// - sinon les données statiques de src/data (lecture seule).
function baseStore(): Store {
  if (supabaseConfigured()) return supabaseStore;
  if (localStoreAllowed()) return localStore;
  return staticStore;
}

// Médias « /portfolio/… » servis depuis le bucket S3 quand NEXT_PUBLIC_MEDIA_URL est défini
function withMediaUrls(p: Portfolio): Portfolio {
  return {
    ...p,
    works: p.works.map((w) => ({
      ...w,
      image: mediaUrl(w.image),
      video: mediaUrl(w.video),
      emotes: w.emotes?.map((e) => ({ ...e, src: mediaUrl(e.src) })),
    })),
  };
}

export function getStore(): Store {
  const store = baseStore();
  if (!mediaBaseUrl()) return store;
  return {
    ...store,
    getPortfolio: async () => withMediaUrls(await store.getPortfolio()),
    // Envois de l'admin : stockés dans S3 (au lieu de Supabase Storage) dès que les clés sont là
    ...(s3Configured() ? { createSignedUpload: undefined, downloadAsset: s3Download, uploadAsset: s3Upload } : {}),
  };
}

export * from "./types";
