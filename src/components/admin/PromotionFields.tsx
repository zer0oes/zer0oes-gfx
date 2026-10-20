"use client";
import { useState } from "react";
import type { Catalog } from "@/lib/pricing";
import { promotionProducts, promotionRates, type Promotion } from "@/lib/promotions";
import { RateFields } from "./RateFields";
import { Segmented } from "./Segmented";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
export function PromotionFields({ promotion, catalog }: { promotion?: Promotion; catalog: Catalog }) {
  const [mode, setMode] = useState(promotion?.mode ?? "code");
  const products = promotionProducts(catalog);
  return <>
    <fieldset><legend className="mb-2 text-sm font-medium">Utilisation de la remise</legend><div className="flex flex-wrap gap-4">
      <Segmented name="mode" options={[["code", "Code promo ou fidélité"], ["sale", "Prix promotionnels publics"]]} value={mode} onChange={(v) => setMode(v as typeof mode)} />
    </div></fieldset>
    {mode === "code" ? <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">Code (vide : généré automatiquement)<input name="code" defaultValue={promotion?.code} maxLength={60} className={input} /></label>
        <label className="grid gap-2 text-sm">Type<select name="kind" defaultValue={promotion?.kind ?? "percent"} className={input}><option value="percent">Pourcentage (%)</option><option value="fixed">Montant (€)</option></select></label>
        <label className="grid gap-2 text-sm">Valeur<input name="value" type="number" min="0.01" step="0.01" required defaultValue={promotion && promotion.mode !== "sale" ? promotion.kind === "fixed" ? promotion.value / 100 : promotion.value : ""} className={input} /></label>
      </div>
      <fieldset><legend className="mb-2 text-sm font-medium">Packs concernés (aucune sélection : tous)</legend><div className="flex flex-wrap gap-3">{catalog.packs.filter((p) => p.checkout && !p.archived).map((p) => <label key={p.id} className="flex gap-2 text-sm"><input type="checkbox" name="packIds" value={p.id} defaultChecked={promotion?.packIds.includes(p.id)} />{p.name}</label>)}</div></fieldset>
      <p className="text-xs text-muted">Le code est réutilisable jusqu’à expiration ou désactivation. Toute personne qui le possède peut l’utiliser. Les promotions publiques et les codes ne se cumulent pas. Pour les prestations sur devis, reporte la remise dans ton devis.</p>
    </> : <>
      <p className="text-sm text-muted">Coche les produits concernés et donne à chacun son pourcentage, ou remplis un pack ou une catégorie d’un coup. Le prix normal sera barré sur le site.</p>
      <input type="hidden" name="kind" value="percent" />
      <RateFields products={products} rates={promotion?.mode === "sale" ? promotionRates(promotion, products) : {}} />
      <p className="text-xs text-muted">Si plusieurs promotions sont actives, le prix le plus bas s’applique. Le tarif catalogue reste conservé et revient à la fin de la promotion. Les prestations sur devis conservent leur fonctionnement habituel.</p>
    </>}
  </>;
}
