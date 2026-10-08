// Tableau comparatif des packs, déduit des livrables, options et formules saisis dans l'admin :
// changer « 5 overlays » en « 6 overlays » ou le prix d'une formule met le tableau à jour.
// Les libellés (« {n} statiques », « En option, {prix} »…) se modifient dans Admin > Offres.
import type { HomeContent } from "./home-content";
import type { Locale } from "./i18n";
import { formatPrice, type Pack, type PricingSettings, packPricingSettings } from "./pricing";

// Valeur d'une case : true = inclus (✓), false = non inclus (—), texte = précision
export type Cell = boolean | string;
export type ComparisonRow = { id: string; label: string; hint?: string; cells: Cell[] };

const count = (lines: string[], re: RegExp) => {
  for (const line of lines) {
    const m = re.exec(line);
    if (m) return { n: Number(m[1]), line };
  }
  return undefined;
};

export function packComparison(packs: Pack[], settings: PricingSettings, texts: HomeContent, locale: Locale): ComparisonRow[] {
  const fill = (key: string, values: Record<string, string | number> = {}) =>
    texts.text(key).replace(/\{(\w+)\}/g, (all, name: string) => (name in values ? String(values[name]) : all));
  const plus = (cents: number) => `+${formatPrice(cents, locale)}`;
  const formula = (p: Pack, id: string) => p.formulas?.find((f) => f.id === id);

  const rows: ComparisonRow[] = [
    {
      id: "logo",
      label: fill("compare.row.logo"),
      hint: "declinaisons",
      cells: packs.map((p) => {
        const line = p.deliverables.find((l) => /logo/i.test(l));
        if (!line) return false;
        return /déclinaison/i.test(line) ? fill("compare.logo.variations") : fill("compare.logo.plain");
      }),
    },
    {
      id: "overlays",
      label: fill("compare.row.overlays"),
      hint: "overlay",
      cells: packs.map((p) => {
        const o = count(p.deliverables, /(\d+)\s+overlays?/i);
        if (!o) return false;
        return fill(/anim/i.test(o.line) ? "compare.overlays.animated" : "compare.overlays.static", { n: o.n });
      }),
    },
    {
      id: "animation",
      label: fill("compare.row.animation"),
      cells: packs.map((p) => {
        if (p.deliverables.some((l) => /overlays?\s+animés|animated overlays/i.test(l))) return fill("compare.animation.included");
        const anim = formula(p, "emotes-animations");
        const emotes = formula(p, "emotes");
        if (anim && emotes) return fill("compare.animation.option", { prix: plus(anim.price - emotes.price) });
        return false;
      }),
    },
    {
      id: "alertes",
      label: fill("compare.row.alerts"),
      hint: "alertes",
      cells: packs.map((p) => {
        const a = count(p.deliverables, /(\d+)\s+alertes?/i);
        if (a) return fill(/anim/i.test(a.line) ? "compare.alerts.animated" : "compare.alerts.static", { n: a.n });
        return p.checkout ? false : fill("compare.onQuote");
      }),
    },
    {
      id: "banniere-avatar",
      label: fill("compare.row.bannerAvatar"),
      hint: "banniere",
      cells: packs.map((p) => p.deliverables.some((l) => /banni/i.test(l)) && p.deliverables.some((l) => /avatar/i.test(l))),
    },
    {
      id: "emotes",
      label: fill("compare.row.emotes"),
      hint: "emotes",
      cells: packs.map((p) => {
        const included = count(p.deliverables, /(\d+)\s+emotes?/i);
        if (included) return fill(/statique|static/i.test(included.line) ? "compare.emotes.includedStatic" : "compare.emotes.included", { n: included.n });
        const extra = count(p.extras ?? [], /(\d+)\s+emotes?/i);
        const emotes = formula(p, "emotes");
        const base = p.formulas?.[0];
        if (!extra) return false;
        return fill("compare.emotes.option", { n: extra.n, prix: emotes && base ? plus(emotes.price - base.price) : "" }).replace(/,\s*$/, "");
      }),
    },
    {
      id: "corrections",
      label: fill("compare.row.corrections"),
      hint: "corrections",
      cells: packs.map((p) => {
        const c = count(p.deliverables, /(\d+)\s+corrections?/i);
        return c ? String(c.n) : false;
      }),
    },
    {
      id: "logo-fourni",
      label: fill("compare.row.logoSupplied"),
      cells: packs.map((p) => (p.checkout ? `−${formatPrice(packPricingSettings(settings, p.id).logoDiscount, locale)}` : fill("compare.logoSupplied.quote"))),
    },
    {
      id: "commande",
      label: fill("compare.row.order"),
      cells: packs.map((p) => fill(p.checkout ? "compare.order.online" : "compare.order.quote")),
    },
    {
      id: "acompte",
      label: fill("compare.row.deposit", { acompte: settings.depositPercent }),
      cells: packs.map(() => true),
    },
  ];
  // Ligne vide pour tous les packs : rien à comparer
  return rows.filter((r) => r.cells.some((c) => c !== false));
}
