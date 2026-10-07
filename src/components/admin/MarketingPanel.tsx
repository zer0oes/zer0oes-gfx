import { getStore } from "@/lib/store";
import { bannerPages, type Banner, type Promotion } from "@/lib/promotions";
import { MarketingDates } from "@/components/admin/MarketingDates";
import { saveBannerAction, savePromotionAction, deleteMarketingAction } from "@/app/admin/promotions-actions";
import type { Catalog } from "@/lib/pricing";
import { PromotionFields } from "./PromotionFields";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const button = "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background";
function status(item: { enabled: boolean; startsAt: string; endsAt: string }) {
  if (!item.enabled) return "Désactivé";
  const now = Date.now();
  if (item.endsAt && Date.parse(item.endsAt) <= now) return "Terminé";
  if (item.startsAt && Date.parse(item.startsAt) > now) return "Programmé";
  return "Actif";
}
function Field({ name, label, value = "", required = false }: { name: string; label: string; value?: string; required?: boolean }) {
  return <label className="grid gap-2 text-sm">{label}<input name={name} defaultValue={value} required={required} maxLength={name === "link" ? 500 : 300} className={input} /></label>;
}
function Remove({ id, kind }: { id: string; kind: string }) {
  return <form action={deleteMarketingAction} className="mt-4"><input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} /><label className="mr-3 text-sm text-muted"><input type="checkbox" name="confirm" required /> Confirmer</label><button className="text-sm text-muted underline">Supprimer {kind === "banner" ? "ce bandeau" : "cette remise"}</button></form>;
}
function BannerForm({ banner }: { banner?: Banner }) {
  return <><form action={saveBannerAction} className="space-y-4"><input type="hidden" name="id" value={banner?.id ?? ""} /><label className="flex gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={banner?.enabled ?? false} />Afficher le bandeau</label>
    <div className="grid gap-4 sm:grid-cols-2"><Field name="text" label="Message français" value={banner?.text} required /><Field name="textEn" label="Message anglais (facultatif)" value={banner?.textEn} /><Field name="code" label="Code à afficher (facultatif)" value={banner?.code} /><Field name="link" label="Lien (ex. /offres)" value={banner?.link} /><Field name="linkLabel" label="Texte du lien" value={banner?.linkLabel} /><Field name="linkLabelEn" label="Texte du lien en anglais" value={banner?.linkLabelEn} /></div>
    <p className="text-xs text-muted">Afficher un code ne crée pas de réduction : crée aussi la remise correspondante ci-dessous.</p>
    <fieldset><legend className="mb-2 text-sm font-medium">Pages concernées</legend><div className="flex flex-wrap gap-3">{[{ path: "*", label: "Toutes les pages" }, ...bannerPages].map((p) => <label key={p.path} className="flex gap-2 text-sm"><input type="checkbox" name="pages" value={p.path} defaultChecked={banner ? banner.pages.includes(p.path) : p.path === "*"} />{p.label}</label>)}</div></fieldset>
    <label className="grid gap-2 text-sm">Couleur<select name="tone" defaultValue={banner?.tone ?? "violet"} className={input}><option value="violet">Violet</option><option value="pink">Rose</option><option value="teal">Turquoise</option></select></label>
    <MarketingDates startsAt={banner?.startsAt} endsAt={banner?.endsAt} /><button className={button}>Enregistrer le bandeau</button></form>{banner && <Remove id={banner.id} kind="banner" />}</>;
}
function PromotionForm({ promotion, catalog }: { promotion?: Promotion; catalog: Catalog }) {
  return <><form action={savePromotionAction} className="space-y-4"><input type="hidden" name="id" value={promotion?.id ?? ""} /><label className="flex gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={promotion?.enabled ?? false} />Activer la remise</label>
    <Field name="label" label="Nom de la promotion ou repère privé" value={promotion?.label} />
    <PromotionFields promotion={promotion} catalog={catalog} />
    <MarketingDates startsAt={promotion?.startsAt} endsAt={promotion?.endsAt} /><button className={button}>Enregistrer la remise</button></form>{promotion && <Remove id={promotion.id} kind="promotion" />}</>;
}
export async function MarketingPanel() {
  const store = getStore();
  const [banners, promotions, catalog] = await Promise.all([store.listBanners(), store.listPromotions(), store.getCatalog()]);
  return <div className="mt-6 space-y-8"><p className="text-sm text-muted">Annonce tes offres sous le header et prépare les codes à envoyer à tes clients.</p>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Bandeaux</h2>{banners.map((b) => <details key={b.id} className="rounded-2xl border border-border bg-surface p-5"><summary className="cursor-pointer font-medium"><span className="mr-2 rounded-full border border-border px-2 py-0.5 text-xs">{status(b)}</span>{b.text}</summary><div className="mt-5"><BannerForm banner={b} /></div></details>)}<details className="rounded-2xl border border-border bg-surface p-5"><summary className="cursor-pointer font-medium">+ Nouveau bandeau</summary><div className="mt-5"><BannerForm /></div></details></section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Remises et fidélité</h2>{promotions.map((p) => <details key={p.id} className="rounded-2xl border border-border bg-surface p-5"><summary className="cursor-pointer font-medium"><span className="mr-2 rounded-full border border-border px-2 py-0.5 text-xs">{status(p)}</span>{p.label || "Remise"} · {p.mode === "sale" ? `${Object.keys(p.salePrices ?? {}).length} produit(s) en promotion` : `${p.code} · ${p.kind === "percent" ? `${p.value} %` : `${p.value / 100} €`}`}</summary><div className="mt-5"><PromotionForm promotion={p} catalog={catalog} /></div></details>)}<details className="rounded-2xl border border-border bg-surface p-5"><summary className="cursor-pointer font-medium">+ Nouvelle remise</summary><div className="mt-5"><PromotionForm catalog={catalog} /></div></details></section>
  </div>;
}
