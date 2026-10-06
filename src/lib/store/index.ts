import "server-only";
import { withTranslations } from "@/lib/admin-translations";
import { localStoreAllowed, supabaseConfigured } from "@/lib/env";
import { mediaBaseUrl, mediaUrl } from "@/lib/media";
import { s3Configured, s3DeliverableRead, s3DeliverableUrl, s3DeliverableWrite, s3Download, s3Upload } from "@/lib/s3";
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
  const base = baseStore();
  const store: Store = {
    ...base,
    async getCatalog() {
      const [catalog, raw] = await Promise.all([base.getCatalog(), base.getHomeContent()]);
      return {
        settings: withTranslations(catalog.settings, raw, "settings", ["deliveryDays"]),
        packs: catalog.packs.map((pack) => withTranslations({ ...pack, formulas: pack.formulas?.map((formula) => withTranslations(formula, raw, `pack:${pack.id}:formula:${formula.id}`, ["label"])) }, raw, `pack:${pack.id}`, ["name", "tagline", "deliverables", "extras", "note"], ["deliverables", "extras"])),
        options: catalog.options.map((option) => withTranslations(option, raw, `option:${option.id}`, ["name", "unit"])),
      };
    },
    async getPortfolio() {
      const [portfolio, raw] = await Promise.all([base.getPortfolio(), base.getHomeContent()]);
      return {
        streamers: portfolio.streamers.map((streamer) => withTranslations(streamer, raw, `streamer:${streamer.id}`, ["name", "description"])),
        works: portfolio.works.map((work) => withTranslations({ ...work, emotes: work.emotes?.map((emote) => withTranslations(emote, raw, `work:${work.id}:emote:${emote.name}`, ["name"])) }, raw, `work:${work.id}`, ["title", "description"])),
      };
    },
    async listTestimonials() {
      const [reviews, raw] = await Promise.all([base.listTestimonials(), base.getHomeContent()]);
      return reviews.map((review) => withTranslations(review, raw, `review:${review.streamerId}`, ["author", "role"]));
    },
  };
  if (!mediaBaseUrl()) return store;
  return {
    ...store,
    getPortfolio: async () => withMediaUrls(await store.getPortfolio()),
    // Dès que les clés sont là, S3 remplace Supabase Storage : médias du portfolio (dossier public)
    // et fichiers livrés aux clients (dossier privé « livrables/ », liens signés uniquement)
    ...(s3Configured()
      ? {
          createSignedUpload: undefined,
          downloadAsset: s3Download,
          uploadAsset: s3Upload,
          createDeliverableUpload: undefined,
          deliverableDownloadUrl: s3DeliverableUrl,
          readDeliverableFile: s3DeliverableRead,
          saveDeliverableFile: (path: string, data: Uint8Array) => s3DeliverableWrite(path, data),
        }
      : {}),
  };
}

export * from "./types";
