import "server-only";
import { cache } from "react";
import { withTranslations } from "@/lib/admin-translations";
import { readCategories, resolveCategory } from "@/lib/product-categories";
import { BASE, deliverablesWith, readComposition } from "@/lib/pack-composition";
import type { Formula, Option, Pack } from "@/lib/pricing";
import { tr } from "@/lib/translations-en";
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

// Une seule lecture des textes et traductions par rendu serveur, sans cache entre requêtes.
const getHomeContentForRender = cache(() => baseStore().getHomeContent());

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

type WithEnglish<T> = T & { __en?: Record<string, unknown> };

// Livrables d'une offre composée de produits à la carte : ceux du pack de base, puis ses lignes libres ;
// chaque autre formule reçoit les produits qu'elle ajoute au pack de base (affichés en option sur le site)
function withComposedDeliverables(pack: WithEnglish<Pack>, raw: unknown, options: WithEnglish<Option>[]) {
  const composition = readComposition(raw, pack.id);
  const fr = (o: Option) => o.name;
  const en = (o: Option) => ((o as WithEnglish<Option>).__en?.name as string | undefined) ?? tr("en", o.name);
  const formulas = pack.formulas?.map((formula: WithEnglish<Formula>, i) => {
    const items = i > 0 ? composition[formula.id] : undefined;
    return items?.length ? { ...formula, deliverables: deliverablesWith(items, fr, options, []), __en: { ...formula.__en, deliverables: deliverablesWith(items, en, options, []) } } : formula;
  });
  const items = composition[BASE];
  if (!items?.length) return { ...pack, formulas };
  const freeEn = (pack.__en?.deliverables as string[] | undefined) ?? pack.deliverables.map((line) => tr("en", line));
  return {
    ...pack,
    formulas,
    ownDeliverables: pack.deliverables,
    deliverables: deliverablesWith(items, fr, options, pack.deliverables),
    __en: { ...pack.__en, deliverables: deliverablesWith(items, en, options, freeEn) },
  };
}

export function getStore(): Store {
  const base = baseStore();
  const store: Store = {
    ...base,
    getHomeContent: getHomeContentForRender,
    async getCatalog() {
      const [catalog, raw] = await Promise.all([base.getCatalog(), getHomeContentForRender()]);
      const categories = readCategories(raw);
      const options = catalog.options.map((option) => withTranslations({ ...option, category: resolveCategory(option, categories) }, raw, `option:${option.id}`, ["name", "unit"]));
      return {
        settings: withTranslations(catalog.settings, raw, "settings", ["deliveryDays"]),
        packs: catalog.packs.map((pack) => withComposedDeliverables(withTranslations({ ...pack, formulas: pack.formulas?.map((formula) => withTranslations(formula, raw, `pack:${pack.id}:formula:${formula.id}`, ["label"])) }, raw, `pack:${pack.id}`, ["name", "tagline", "deliverables", "extras", "note"], ["deliverables", "extras"]), raw, options)),
        options,
        categories: categories.map((category) => withTranslations(category, raw, `categorie:${category.id}`, ["name"])),
      };
    },
    // Les livrables générés par la composition ne sont pas enregistrés avec l'offre : seulement ses lignes libres
    async savePack(pack) {
      const { ownDeliverables, __en, ...rest } = pack as WithEnglish<Pack>;
      void __en;
      const formulas = rest.formulas?.map(({ deliverables, __en: english, ...formula }: WithEnglish<Formula>) => (void deliverables, void english, formula));
      await base.savePack({ ...rest, formulas, deliverables: ownDeliverables ?? pack.deliverables });
    },
    async getPortfolio() {
      const [portfolio, raw] = await Promise.all([base.getPortfolio(), getHomeContentForRender()]);
      return {
        streamers: portfolio.streamers.map((streamer) => withTranslations(streamer, raw, `streamer:${streamer.id}`, ["name", "description"])),
        works: portfolio.works.map((work) => withTranslations({ ...work, emotes: work.emotes?.map((emote) => withTranslations(emote, raw, `work:${work.id}:emote:${emote.name}`, ["name"])) }, raw, `work:${work.id}`, ["title", "description"])),
      };
    },
    async listTestimonials() {
      const [reviews, raw] = await Promise.all([base.listTestimonials(), getHomeContentForRender()]);
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
