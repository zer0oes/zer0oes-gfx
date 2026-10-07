import { orderPrice, packPricingSettings, type Option, type Pack, type PricingSettings } from "./pricing";
import { includedOverlays } from "./brief-overlays";

type Selection = { id: string; quantity: number }[];
const staticEmotes: Record<string, number> = { "emote-statique": 1, "emotes-3": 3, "emotes-5": 5, "emotes-10": 10 };

export function recommendPack(packs: Pack[], options: Option[], items: Selection, settings?: PricingSettings) {
  const quantity = (id: string) => items.find((item) => item.id === id)?.quantity ?? 0;
  const fixed = quantity("overlay-fixe-unite");
  const animated = quantity("overlay-anime-unite");
  // A lone asset is not an identity pack. Require the scenes, banner and avatar together.
  if (fixed + animated < 2 || !quantity("banniere") || !quantity("avatar")) return null;
  const emotes = items.reduce((sum, item) => sum + (staticEmotes[item.id] ?? 0) * item.quantity, 0);
  const packId = animated >= 5 && emotes >= 15 ? "univers-complet" : animated >= 5 || fixed > 2 ? "identite-signature" : "premier-look";
  const pack = packs.find((p) => p.id === packId && !p.archived);
  if (!pack) return null;
  if (animated > 0 && animated < 5) return null;
  const formulaId = packId === "identite-signature" && animated >= 5 ? "emotes-animations" : emotes > 0 && packId !== "univers-complet" ? "emotes" : "base";
  const formula = pack.formulas?.find((f) => f.id === formulaId);
  if (pack.checkout && !formula) return null;
  const capacity = includedOverlays(pack);
  if (!capacity) return null;
  const emoteCapacity = packId === "univers-complet" ? 15 : formulaId === "base" ? 0 : packId === "premier-look" ? 5 : 10;
  const animatedPack = packId === "univers-complet" || formulaId === "emotes-animations";
  const coveredIds = new Set(["banniere", "avatar", "logo", animatedPack ? "overlay-anime-unite" : "overlay-fixe-unite", ...(emoteCapacity ? Object.keys(staticEmotes) : [])]);
  if (packId === "identite-signature") coveredIds.add("alertes-fixes");
  const remaining = items.filter((item) => !coveredIds.has(item.id)).map((item) => options.find((o) => o.id === item.id)?.name ?? item.id);
  if ((animatedPack ? animated : fixed) > capacity) remaining.push(`${(animatedPack ? animated : fixed) - capacity} overlays`);
  if (emotes > emoteCapacity) remaining.push(`${emotes - emoteCapacity} emotes`);
  if (quantity("banniere") > 1) remaining.push(`${quantity("banniere") - 1} × ${options.find((o) => o.id === "banniere")?.name ?? "Bannière"}`);
  if (quantity("avatar") > 1) remaining.push(`${quantity("avatar") - 1} × Avatar`);
  if (packId === "identite-signature" && quantity("alertes-fixes") > 1) remaining.push(`${quantity("alertes-fixes") - 1} × ${options.find((o) => o.id === "alertes-fixes")?.name ?? "Alertes"}`);
  const hasLogo = Boolean(settings && pack.checkout && !quantity("logo"));
  const price = formula?.price ?? pack.price;
  return { pack, formula, remaining, price: hasLogo ? orderPrice(price, true, packPricingSettings(settings!, pack.id)) : price, hasLogo, addsLogo: !hasLogo && !quantity("logo") };
}
