"use client";
import { useState } from "react";
import { formatPrice, type Catalog } from "@/lib/pricing";
import { discountedPrice, promotionProducts, type Promotion } from "@/lib/promotions";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
export function PromotionFields({ promotion, catalog }: { promotion?: Promotion; catalog: Catalog }) {
  const [mode, setMode] = useState(promotion?.mode ?? "code");
  const [selected, setSelected] = useState(promotion?.productKeys ?? Object.keys(promotion?.salePrices ?? {}));
  const [percent, setPercent] = useState(promotion?.mode === "sale" && promotion.kind === "percent" && promotion.value > 0 ? String(promotion.value) : "");
  const rate = Number(percent);
  const validRate = percent.trim() !== "" && Number.isFinite(rate) && rate > 0 && rate <= 80;
  const products = promotionProducts(catalog);
  return <>
    <fieldset><legend className="mb-2 text-sm font-medium">Utilisation de la remise</legend><div className="flex flex-wrap gap-4">
      <label className="flex gap-2 text-sm"><input type="radio" name="mode" value="code" checked={mode === "code"} onChange={() => setMode("code")} />Code promo ou fidélité</label>
      <label className="flex gap-2 text-sm"><input type="radio" name="mode" value="sale" checked={mode === "sale"} onChange={() => setMode("sale")} />Prix promotionnels publics</label>
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
      <p className="text-sm text-muted">Coche les produits concernés et indique le pourcentage de remise. Leur prix réduit est calculé automatiquement ; le prix normal sera barré sur le site.</p>
      <input type="hidden" name="kind" value="percent" />
      <label className="grid max-w-xs gap-2 text-sm">Remise (%)<input name="value" type="number" min="0.01" max="80" step="0.01" required value={percent} onChange={(e) => setPercent(e.target.value)} className={input} /></label>
      <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-background"><tr><th className="p-3">Produit</th><th className="p-3">Prix normal</th><th className="p-3">Prix après remise</th></tr></thead><tbody className="divide-y divide-border">{products.map((p) => {
        const checked = selected.includes(p.key);
        return <tr key={p.key}><td className="p-3"><label className="flex items-start gap-2"><input type="checkbox" name="products" value={p.key} checked={checked} onChange={(e) => setSelected((s) => e.target.checked ? [...s, p.key] : s.filter((key) => key !== p.key))} className="mt-1" />{p.name}</label></td><td className="whitespace-nowrap p-3 text-muted">{formatPrice(p.price)}</td><td className="whitespace-nowrap p-3 font-semibold">{checked && validRate ? formatPrice(discountedPrice(p.price, { kind: "percent", value: rate })) : "—"}</td></tr>;
      })}</tbody></table></div>
      <p className="text-xs text-muted">Si plusieurs promotions sont actives, le prix le plus bas s’applique. Le tarif catalogue reste conservé et revient à la fin de la promotion. Les prestations sur devis conservent leur fonctionnement habituel.</p>
    </>}
  </>;
}
