"use client";
import { useState } from "react";
import { formatPrice } from "@/lib/pricing";
import { discountedPrice, MAX_RATE, type PromotionProduct } from "@/lib/promotions";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const validRate = (value: string) => {
  const rate = Number(value.replace(",", "."));
  return value.trim() !== "" && Number.isFinite(rate) && rate > 0 && rate <= MAX_RATE ? rate : null;
};
// Un pourcentage par produit coché (champs products et rate:<clé>), avec un raccourci pour remplir un groupe d'un coup
export function RateFields({ products, rates: initial }: { products: PromotionProduct[]; rates: Record<string, number> }) {
  const [rates, setRates] = useState<Record<string, string>>(Object.fromEntries(Object.entries(initial).map(([key, rate]) => [key, String(rate)])));
  const [selected, setSelected] = useState(Object.keys(initial));
  const [target, setTarget] = useState("all");
  const [bulk, setBulk] = useState("");
  const groups = [...new Map(products.map((p) => [p.group.id, p.group])).values()];
  const packs = groups.filter((g) => g.id.startsWith("pack:")), categories = groups.filter((g) => g.id.startsWith("category:"));
  const inTarget = (p: PromotionProduct) => target === "all" || target === p.kind || target === p.group.id;
  function apply(on: boolean) {
    const keys = products.filter(inTarget).map((p) => p.key);
    setSelected((s) => on ? [...new Set([...s, ...keys])] : s.filter((key) => !keys.includes(key)));
    if (on && validRate(bulk)) setRates((r) => ({ ...r, ...Object.fromEntries(keys.map((key) => [key, bulk])) }));
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-background/40 p-3">
      <label className="grid min-w-48 flex-1 gap-1.5 text-xs text-muted">Appliquer à
        <select value={target} onChange={(e) => setTarget(e.target.value)} className={input}>
          <option value="all">Tous les produits</option>
          <option value="pack">Tous les packs</option>
          {packs.map((g) => <option key={g.id} value={g.id}>Pack · {g.label}</option>)}
          <option value="option">Toutes les créations à la carte</option>
          {categories.map((g) => <option key={g.id} value={g.id}>À la carte · {g.label}</option>)}
        </select>
      </label>
      <label className="grid w-24 gap-1.5 text-xs text-muted">Remise (%)<input type="number" min="0.01" max={MAX_RATE} step="0.01" value={bulk} onChange={(e) => setBulk(e.target.value)} className={input} /></label>
      <button type="button" onClick={() => apply(true)} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">Appliquer</button>
      <button type="button" onClick={() => apply(false)} className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground">Retirer</button>
    </div>
    <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm">
      <thead className="bg-background text-xs text-muted"><tr><th className="p-3">Produit</th><th className="p-3">Prix normal</th><th className="w-28 p-3">Remise (%)</th><th className="p-3">Prix remisé</th></tr></thead>
      <tbody className="divide-y divide-border">{groups.map((g) => [
        <tr key={`groupe-${g.id}`} className="bg-background/60"><th colSpan={4} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">{g.id.startsWith("pack:") ? `Pack · ${g.label}` : `À la carte · ${g.label}`}</th></tr>,
        ...products.filter((p) => p.group.id === g.id).map((p) => {
          const checked = selected.includes(p.key), rate = validRate(rates[p.key] ?? "");
          return <tr key={p.key} className={checked ? "" : "text-muted"}>
            <td className="p-3"><label className="flex items-start gap-2"><input type="checkbox" name="products" value={p.key} checked={checked} onChange={(e) => setSelected((s) => e.target.checked ? [...s, p.key] : s.filter((key) => key !== p.key))} className="mt-1" />{p.name.replace(/^À la carte · /, "")}</label></td>
            <td className="whitespace-nowrap p-3">{formatPrice(p.price)}</td>
            <td className="p-3"><input name={`rate:${p.key}`} type="number" min="0.01" max={MAX_RATE} step="0.01" required={checked} disabled={!checked} value={rates[p.key] ?? ""} onChange={(e) => setRates((r) => ({ ...r, [p.key]: e.target.value }))} aria-label={`Remise ${p.name}`} className={`${input} py-1.5`} /></td>
            <td className="whitespace-nowrap p-3 font-semibold">{checked && rate ? formatPrice(discountedPrice(p.price, { kind: "percent", value: rate })) : "—"}</td>
          </tr>;
        }),
      ])}</tbody>
    </table></div>
  </div>;
}
