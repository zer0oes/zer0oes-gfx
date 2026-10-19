"use client";

import { useState } from "react";
import { bannerLinks, bannerPages, LAUNCH_LINK, type Banner } from "@/lib/promotions";
import { MarketingDates } from "./MarketingDates";
import { Switch } from "./Switch";

const input = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const label = "block text-sm font-medium";
type Copy = "badge" | "text" | "conditions" | "remainingText";

// Champs d'un bandeau : textes FR / EN, programmation (ses dates, l'offre de lancement ou une remise), pages.
export function BannerFields({ banner, promotions, linkedTo: initialLink = "" }: { banner?: Banner; promotions: { id: string; label: string }[]; linkedTo?: string }) {
  const [links, setLinks] = useState(banner ? bannerLinks(banner) : initialLink ? [initialLink] : []);
  const offers = [{ id: LAUNCH_LINK, label: "Offre de lancement" }, ...promotions.map((p) => ({ id: p.id, label: `Remise « ${p.label} »` }))];
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  return <>
    <input type="hidden" name="id" value={banner?.id ?? ""} />
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      <Switch name="enabled" label="Afficher le bandeau" defaultChecked={banner?.enabled ?? true} />
      <Switch name="carousel" label="Dans le carrousel" defaultChecked={banner?.carousel ?? true} />
    </div>
    <p className="-mt-3 text-xs text-muted">Dans le carrousel, il tourne avec les autres bandeaux du carrousel. Sinon, il reste affiché fixe sous le menu.</p>
    <fieldset><legend className="mb-2 text-sm font-medium">Offres liées</legend>
      <div className="flex flex-col gap-2">{offers.map((o) => <label key={o.id} className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="links" value={o.id} checked={links.includes(o.id)} onChange={(e) => setLinks((l) => e.target.checked ? [...l, o.id] : l.filter((x) => x !== o.id))} />{o.label}
      </label>)}</div>
      <p className="mt-2 text-xs text-muted">{links.length ? "Affiché pendant l’une des offres cochées (l’offre de lancement : dès sa date de début, tant qu’il reste des places)." : "Aucune offre cochée : le bandeau suit ses propres dates."}</p>
    </fieldset>
    {!links.length && <MarketingDates startsAt={banner?.startsAt} endsAt={banner?.endsAt} />}
    <div className="-mx-5 border-y border-border px-5 sm:-mx-6 sm:px-6">
      <div role="tablist" aria-label="Langue des textes" className="flex gap-6">
        {(["fr", "en"] as const).map((lang) => <button key={lang} type="button" role="tab" aria-selected={locale === lang} onClick={() => setLocale(lang)} className={`-mb-px border-b-2 py-3 text-sm ${locale === lang ? "border-accent font-semibold text-accent" : "border-transparent text-muted"}`}>{lang === "fr" ? "Français" : "English"}</button>)}
      </div>
    </div>
    {/* Les deux langues restent dans le formulaire : l'onglet masqué n'est que caché */}
    {(["fr", "en"] as const).map((lang) => {
      const shown = lang === locale;
      const field = (f: Copy) => lang === "fr" ? f : `${f}En`;
      const initial = (f: Copy) => (lang === "fr" ? banner?.[f] : banner?.[`${f}En` as const]) ?? "";
      return <div key={lang} hidden={!shown} className="space-y-4">
        {lang === "en" && <p className="text-xs text-muted">Un champ anglais vide reprend le texte français.</p>}
        <label className={label}>Pastille<input name={field("badge")} defaultValue={initial("badge")} maxLength={80} className={input} /></label>
        <label className={label}>Phrase{lang === "fr" && " *"}<textarea name={field("text")} defaultValue={initial("text")} required={lang === "fr"} maxLength={600} rows={2} className={input} /><span className="mt-1 block text-xs font-normal text-muted">Les pourcentages (ex. −50 %) s’affichent en gras et en dégradé.</span></label>
        {links.includes(LAUNCH_LINK) && <label className={label}>Places restantes<input name={field("remainingText")} defaultValue={initial("remainingText")} maxLength={150} className={input} /><span className="mt-1 block text-xs font-normal text-muted">Utilise {"{count}"}, remplacé par le vrai nombre de places restantes (en violet). Vide : pas de compteur.</span></label>}
        <label className={label}>Petite note<input name={field("conditions")} defaultValue={initial("conditions")} maxLength={400} className={input} /><span className="mt-1 block text-xs font-normal text-muted">En petit, sous la phrase. Facultative.</span></label>
      </div>;
    })}
    <label className={label}>Lien du bandeau *<input name="link" defaultValue={banner?.link ?? ""} required maxLength={500} placeholder="/offres" className={input} /><span className="mt-1 block text-xs font-normal text-muted">Tout le bandeau est cliquable. Lien interne (/offres, /contact?sujet=audit) ou adresse https://.</span></label>
    <fieldset><legend className="mb-2 text-sm font-medium">Pages</legend><div className="flex flex-wrap gap-x-4 gap-y-2">{[{ path: "*", label: "Toutes les pages" }, ...bannerPages].map((p) => <label key={p.path} className="flex items-center gap-2 text-sm"><input type="checkbox" name="pages" value={p.path} defaultChecked={banner ? banner.pages.includes(p.path) : p.path === "*"} />{p.label}</label>)}</div></fieldset>
  </>;
}
