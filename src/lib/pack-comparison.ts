// Tableau comparatif des packs, déduit des livrables, options et formules saisis dans l'admin :
// changer « 5 overlays » en « 6 overlays » ou le prix d'une formule met le tableau à jour.
import { formatPrice, type Pack, type PricingSettings, packPricingSettings } from "./pricing";
import type { Locale } from "./i18n";

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

const plus = (cents: number, locale: Locale) => `+${formatPrice(cents, locale)}`;

export function packComparison(packs: Pack[], settings: PricingSettings, locale: Locale): ComparisonRow[] {
  const en = locale === "en";
  const L = (fr: string, english: string) => (en ? english : fr);
  const formula = (p: Pack, id: string) => p.formulas?.find((f) => f.id === id);

  const rows: ComparisonRow[] = [
    {
      id: "logo",
      label: "Logo",
      hint: "declinaisons",
      cells: packs.map((p) => {
        const line = p.deliverables.find((l) => /logo/i.test(l));
        if (!line) return false;
        return /déclinaison/i.test(line) ? L("Logo + déclinaisons", "Logo + variations") : L("Logo", "Logo");
      }),
    },
    {
      id: "overlays",
      label: "Overlays",
      hint: "overlay",
      cells: packs.map((p) => {
        const o = count(p.deliverables, /(\d+)\s+overlays?/i);
        if (!o) return false;
        return /anim/i.test(o.line) ? L(`${o.n} animés`, `${o.n} animated`) : L(`${o.n} statiques`, `${o.n} static`);
      }),
    },
    {
      id: "animation",
      label: L("Animation des overlays", "Overlay animation"),
      cells: packs.map((p) => {
        if (p.deliverables.some((l) => /overlays?\s+animés|animated overlays/i.test(l))) return L("Légère, incluse", "Light, included");
        const anim = formula(p, "emotes-animations");
        const emotes = formula(p, "emotes");
        if (anim && emotes) return L(`En option, ${plus(anim.price - emotes.price, locale)}`, `Add-on, ${plus(anim.price - emotes.price, locale)}`);
        return false;
      }),
    },
    {
      id: "alertes",
      label: L("Alertes", "Alerts"),
      hint: "alertes",
      cells: packs.map((p) => {
        const a = count(p.deliverables, /(\d+)\s+alertes?/i);
        if (a) return /anim/i.test(a.line) ? L(`${a.n} animées`, `${a.n} animated`) : L(`${a.n} statiques`, `${a.n} static`);
        return p.checkout ? false : L("Sur devis", "On quote");
      }),
    },
    {
      id: "banniere-avatar",
      label: L("Bannière et avatar", "Banner and avatar"),
      hint: "banniere",
      cells: packs.map((p) => p.deliverables.some((l) => /banni/i.test(l)) && p.deliverables.some((l) => /avatar/i.test(l))),
    },
    {
      id: "emotes",
      label: "Emotes",
      hint: "emotes",
      cells: packs.map((p) => {
        const included = count(p.deliverables, /(\d+)\s+emotes?/i);
        if (included) return /statique|static/i.test(included.line) ? L(`${included.n} statiques incluses`, `${included.n} static, included`) : L(`${included.n} incluses`, `${included.n} included`);
        const extra = count(p.extras ?? [], /(\d+)\s+emotes?/i);
        const emotes = formula(p, "emotes");
        const base = p.formulas?.[0];
        if (extra && emotes && base) return L(`${extra.n} en option, ${plus(emotes.price - base.price, locale)}`, `${extra.n} as add-on, ${plus(emotes.price - base.price, locale)}`);
        return extra ? L(`${extra.n} en option`, `${extra.n} as add-on`) : false;
      }),
    },
    {
      id: "corrections",
      label: L("Corrections par élément", "Revisions per item"),
      hint: "corrections",
      cells: packs.map((p) => {
        const c = count(p.deliverables, /(\d+)\s+corrections?/i);
        return c ? String(c.n) : false;
      }),
    },
    {
      id: "logo-fourni",
      label: L("Tu as déjà ton logo", "You already have a logo"),
      cells: packs.map((p) => (p.checkout ? `−${formatPrice(packPricingSettings(settings, p.id).logoDiscount, locale)}` : L("Remise sur devis", "Discount on quote"))),
    },
    {
      id: "commande",
      label: L("Commande", "Ordering"),
      cells: packs.map((p) => (p.checkout ? L("En ligne", "Online") : L("Sur devis", "On quote"))),
    },
    {
      id: "acompte",
      label: L(`Acompte de ${settings.depositPercent} % possible`, `${settings.depositPercent}% deposit available`),
      cells: packs.map(() => true),
    },
  ];
  // Ligne vide pour tous les packs : rien à comparer
  return rows.filter((r) => r.cells.some((c) => c !== false));
}
