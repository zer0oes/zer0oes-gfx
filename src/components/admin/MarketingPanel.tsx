import Link from "next/link";
import { getStore } from "@/lib/store";
import { activePeriod, bannerLinks, LAUNCH_LINK, promotionProducts, promotionRates, sortBanners, type Banner, type Promotion } from "@/lib/promotions";
import { formatPrice, type Catalog } from "@/lib/pricing";
import { launchProductRates, launchQuota } from "@/lib/launch-offer";
import { MarketingDates } from "@/components/admin/MarketingDates";
import { saveBannerAction, savePromotionAction, deleteMarketingAction, duplicateMarketingAction, reorderBannersAction } from "@/app/admin/promotions-actions";
import { RowActionsMenu } from "./RowActionsMenu";
import { ConfirmDelete, Drawer, DrawerButton, DrawerRow } from "./Drawer";
import { SortHandle, SortableRows } from "./SortableRows";
import { PromotionFields } from "./PromotionFields";
import { BannerFields } from "./BannerFields";
import { LaunchOfferForm, launchStatus } from "./LaunchOfferPanel";
import { Switch } from "./Switch";
import { SubmitButton } from "./SubmitButton";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const save = "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110";
const th = "px-4 py-3";
const td = "px-4 py-3";
type Feedback = { open?: string; saved: boolean; error?: string };

function status(item: { enabled: boolean; startsAt: string; endsAt: string }) {
  if (!item.enabled) return "Désactivé";
  const now = Date.now();
  if (item.endsAt && Date.parse(item.endsAt) <= now) return "Terminé";
  if (item.startsAt && Date.parse(item.startsAt) > now) return "Programmé";
  return "Actif";
}
function Pill({ label }: { label: string }) {
  const on = /^Acti/.test(label), later = /^Programm/.test(label);
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${on ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : later ? "border-violet-400/40 bg-violet-400/10 text-violet-300" : "border-border text-muted"}`}>{label}</span>;
}
const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });
function periodLabel(item: { startsAt: string; endsAt: string }) {
  if (item.startsAt && item.endsAt) return `${day(item.startsAt)} → ${day(item.endsAt)}`;
  if (item.startsAt) return `Dès le ${day(item.startsAt)}`;
  if (item.endsAt) return `Jusqu’au ${day(item.endsAt)}`;
  return "Sans limite";
}
const promoName = (p: Promotion) => p.label || p.code;
function Notice({ feedback, id }: { feedback: Feedback; id: string }) {
  if (feedback.open !== id) return null;
  return feedback.error ? <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{feedback.error}</p> : null;
}
// Bandeaux liés à une remise (ou à l'offre de lancement) : liens vers leur panneau, ou ajout
function LinkedBanners({ banners, link }: { banners: Banner[]; link: string }) {
  const linked = banners.filter((b) => bannerLinks(b).includes(link));
  return <span className="flex flex-col gap-1">
    {linked.map((b) => <Link key={b.id} href={`/admin/offres?onglet=bandeaux&ouvrir=${b.id}`} className="line-clamp-1 max-w-56 text-accent hover:underline">{b.badge || b.text}</Link>)}
    <Link href={`/admin/offres?onglet=bandeaux&ouvrir=nouveau&lien=${link}`} className="whitespace-nowrap text-muted hover:text-accent">+ Ajouter un bandeau</Link>
  </span>;
}

// Bandeaux de l'offre, choisis dans le panneau de l'offre (offer : "launch" ou id de la remise ; vide pour une nouvelle remise)
function BannerPicker({ banners, offer }: { banners: Banner[]; offer: string }) {
  return <fieldset><input type="hidden" name="bannersShown" value="1" />
    <legend className="mb-2 text-sm font-medium">Bandeaux de l’offre</legend>
    {banners.length ? <div className="flex flex-col gap-2">{sortBanners(banners).map((b) => <label key={b.id} className="flex items-center gap-2 text-sm">
      <input type="checkbox" name="banners" value={b.id} defaultChecked={!!offer && bannerLinks(b).includes(offer)} />
      <span className="line-clamp-1">{b.badge && <span className="mr-2 text-xs font-bold uppercase tracking-wider text-accent">{b.badge}</span>}{b.text}</span>
    </label>)}</div> : <p className="text-sm text-muted">Aucun bandeau pour l’instant.</p>}
    <p className="mt-2 text-xs text-muted">{offer ? <Link href={`/admin/offres?onglet=bandeaux&ouvrir=nouveau&lien=${offer}`} className="text-accent hover:underline">+ Créer un bandeau pour cette offre</Link> : "Pour créer un nouveau bandeau, enregistre d’abord la remise."} Un bandeau décoché qui n’a plus d’offre liée est désactivé.</p>
  </fieldset>;
}

function PromotionForm({ promotion, catalog, banners, formId }: { promotion?: Promotion; catalog: Catalog; banners: Banner[]; formId: string }) {
  return <form id={formId} action={savePromotionAction} className="space-y-4"><input type="hidden" name="id" value={promotion?.id ?? ""} />
    <Switch name="enabled" label="Activer la remise" defaultChecked={promotion?.enabled ?? false} />
    <label className="grid gap-2 text-sm">Nom de la promotion ou repère privé<input name="label" defaultValue={promotion?.label} maxLength={120} className={input} /></label>
    <PromotionFields promotion={promotion} catalog={catalog} />
    <MarketingDates startsAt={promotion?.startsAt} endsAt={promotion?.endsAt} />
    <BannerPicker banners={banners} offer={promotion?.id ?? ""} />
  </form>;
}

// Onglet « Remises et codes » : offre de lancement, codes et prix barrés, chacun avec son bandeau
export async function DiscountsPanel({ feedback }: { feedback: Feedback }) {
  const store = getStore();
  const [promotions, banners, catalog, launch] = await Promise.all([store.listPromotions(), store.listBanners(), store.getCatalog(), store.getLaunchState()]);
  const products = promotionProducts(catalog);
  // Remise publique : fourchette des pourcentages par produit
  const range = (rates: Record<string, number>) => {
    const values = Object.values(rates);
    if (!values.length) return "—";
    const min = Math.min(...values), max = Math.max(...values);
    return min === max ? `−${min} %` : `−${min} à −${max} %`;
  };
  const value = (p: Promotion) => p.mode === "sale" ? range(promotionRates(p, products)) : p.kind === "percent" ? `−${p.value} %` : `−${formatPrice(p.value)}`;
  return <section className="mt-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <p className="min-w-0 flex-1 basis-80 text-sm text-muted">Clique sur une ligne pour modifier la remise. Chaque remise peut avoir son bandeau sous le menu.</p>
      <DrawerButton drawer="remise-nouvelle" className="rounded-full border border-accent/50 px-4 py-1.5 text-sm text-accent hover:bg-accent/10">+ Nouvelle remise</DrawerButton>
    </div>
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs uppercase tracking-wider text-muted"><tr><th className={th}>Remise</th><th className={th}>Type</th><th className={th}>Valeur</th><th className={th}>Période</th><th className={th}>Bandeau</th><th className={th}>Statut</th><th className="w-12"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody className="divide-y divide-border">
          <DrawerRow drawer="remise-lancement" label="Modifier l’offre de lancement">
            <td className={td}><span className="font-semibold">Offre de lancement</span><p className="mt-1 text-xs text-muted">{launchQuota(launch) === null ? "Places illimitées" : `${launch.remaining} place${launch.remaining > 1 ? "s" : ""} sur ${launchQuota(launch)}`}</p></td>
            <td className={td}>Prix barrés</td>
            <td className={`${td} whitespace-nowrap`}>{range(launchProductRates(catalog, launch))}</td>
            <td className={`${td} whitespace-nowrap`}>{launch.startsAt ? periodLabel({ startsAt: launch.startsAt, endsAt: launch.endsAt ?? "" }) : "Non programmée"}</td>
            <td className={td}><LinkedBanners banners={banners} link={LAUNCH_LINK} /></td>
            <td className={td}><Pill label={launchStatus(launch)} /></td>
            <td />
          </DrawerRow>
          {promotions.map((p) => <DrawerRow key={p.id} drawer={`remise-${p.id}`} label={`Modifier ${promoName(p)}`}>
            <td className={td}><span className="font-semibold">{promoName(p)}</span>{p.mode !== "sale" && <p className="mt-1 font-mono text-xs text-muted">{p.code}</p>}</td>
            <td className={td}>{p.mode === "sale" ? "Prix barrés" : "Code"}</td>
            <td className={`${td} whitespace-nowrap`}>{value(p)}</td>
            <td className={`${td} whitespace-nowrap`}>{periodLabel(p)}</td>
            <td className={td}><LinkedBanners banners={banners} link={p.id} /></td>
            <td className={td}><Pill label={status(p)} /></td>
            <td className="pr-2 text-right"><RowActionsMenu id={p.id} name={promoName(p)} fields={{ kind: "promotion" }} duplicateAction={duplicateMarketingAction} deleteAction={deleteMarketingAction} deleteNote={banners.some((b) => bannerLinks(b).includes(p.id)) ? "Ses bandeaux restent, sans cette remise." : undefined} /></td>
          </DrawerRow>)}
        </tbody>
      </table>
    </div>
    <Drawer id="remise-lancement" kicker="Remise" title="Offre de lancement" openOnLoad={feedback.open === "lancement"} footer={<><span /><SubmitButton form={"remise-lancement-form"} label="Enregistrer l’offre" className={save} /></>}>
      <Notice feedback={feedback} id="lancement" />
      <LaunchOfferForm state={launch} catalog={catalog} formId="remise-lancement-form"><BannerPicker banners={banners} offer={LAUNCH_LINK} /></LaunchOfferForm>
    </Drawer>
    {promotions.map((p) => <Drawer key={p.id} id={`remise-${p.id}`} kicker="Remise" title={promoName(p)} openOnLoad={feedback.open === p.id}
      footer={<><ConfirmDelete action={deleteMarketingAction} id={p.id} icon label="Supprimer la remise" fields={{ kind: "promotion" }} question={`Es-tu sûre de vouloir supprimer « ${promoName(p)} » ?${banners.some((b) => bannerLinks(b).includes(p.id)) ? " Son bandeau ne s’affichera plus." : ""}`} /><SubmitButton form={`remise-form-${p.id}`} label="Enregistrer la remise" className={save} /></>}>
      <Notice feedback={feedback} id={p.id} />
      <PromotionForm promotion={p} catalog={catalog} banners={banners} formId={`remise-form-${p.id}`} />
    </Drawer>)}
    <Drawer id="remise-nouvelle" kicker="Remise" title="Nouvelle remise" openOnLoad={feedback.open === "nouvelle"} footer={<><span /><SubmitButton form={"remise-form-nouvelle"} label="Créer la remise" className={save} /></>}>
      <Notice feedback={feedback} id="nouvelle" />
      <PromotionForm catalog={catalog} banners={banners} formId="remise-form-nouvelle" />
    </Drawer>
  </section>;
}

// Onglet « Bandeaux » : tous les bandeaux sous le menu, dans l'ordre du carrousel
export async function BannersPanel({ feedback, linkTo }: { feedback: Feedback; linkTo?: string }) {
  const store = getStore();
  const [stored, promotions, launch] = await Promise.all([store.listBanners(), store.listPromotions(), store.getLaunchState()]);
  const banners = sortBanners(stored);
  const choices = promotions.map((p) => ({ id: p.id, label: promoName(p) }));
  // Offres liées : l'état affiché est le meilleur des offres (actif, sinon programmé…)
  const offerState = (link: string) => {
    if (link === LAUNCH_LINK) return { label: "Offre de lancement", state: ({ "Désactivée": "Désactivé", "Quota atteint": "Terminé", Active: "Actif", "Terminée": "Terminé", "Programmée": "Programmé" } as Record<string, string>)[launchStatus(launch)] };
    const p = promotions.find((x) => x.id === link);
    return { label: p ? `Remise « ${promoName(p)} »` : "Remise supprimée", state: p ? (activePeriod(p) ? "Actif" : status(p)) : "Terminé" };
  };
  const schedule = (b: Banner) => {
    const links = bannerLinks(b);
    if (!links.length) return { label: periodLabel(b), state: status(b) };
    const offers = links.map(offerState);
    const state = !b.enabled ? "Désactivé" : ["Actif", "Programmé", "Terminé"].find((x) => offers.some((o) => o.state === x)) ?? "Désactivé";
    return { label: offers.map((o) => o.label).join(", "), state };
  };
  const pages = (b: Banner) => b.pages.includes("*") ? "Toutes" : `${b.pages.length} page${b.pages.length > 1 ? "s" : ""}`;
  return <section className="mt-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <p className="min-w-0 flex-1 basis-80 text-sm text-muted">Les bandeaux s’affichent sous le menu. Ceux « Dans le carrousel » tournent ensemble, dans l’ordre du tableau : tire une ligne par sa poignée pour le changer.</p>
      <DrawerButton drawer="bandeau-nouveau" className="rounded-full border border-accent/50 px-4 py-1.5 text-sm text-accent hover:bg-accent/10">+ Nouveau bandeau</DrawerButton>
    </div>
    {banners.length ? <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs uppercase tracking-wider text-muted"><tr><th className="w-12 px-2 py-3"><span className="sr-only">Ordre</span></th><th className={th}>Bandeau</th><th className={th}>Quand</th><th className={th}>Affichage</th><th className={th}>Pages</th><th className={th}>Statut</th><th className="w-12"><span className="sr-only">Actions</span></th></tr></thead>
        <SortableRows onReorder={reorderBannersAction}>
          {banners.map((b) => <DrawerRow key={b.id} sortId={b.id} drawer={`bandeau-${b.id}`} label={`Modifier ${b.badge || b.text}`}>
            <td className="px-2 py-3"><SortHandle id={b.id} label={b.badge || b.text} /></td>
            <td className={td}>{b.badge && <span className="mr-2 inline-block rounded-full border border-accent/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">{b.badge}</span>}<span className="line-clamp-1 max-w-md">{b.text}</span></td>
            <td className={`${td} whitespace-nowrap`}>{schedule(b).label}</td>
            <td className={td}>{b.carousel === false ? "Fixe" : "Carrousel"}</td>
            <td className={td}>{pages(b)}</td>
            <td className={td}><Pill label={schedule(b).state} /></td>
            <td className="pr-2 text-right"><RowActionsMenu id={b.id} name={b.badge || b.text} fields={{ kind: "banner" }} duplicateAction={duplicateMarketingAction} deleteAction={deleteMarketingAction} /></td>
          </DrawerRow>)}
        </SortableRows>
      </table>
    </div> : <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">Aucun bandeau pour l’instant.</p>}
    {banners.map((b) => <Drawer key={b.id} id={`bandeau-${b.id}`} kicker="Bandeau" title={b.badge || "Bandeau"} openOnLoad={feedback.open === b.id}
      footer={<><ConfirmDelete action={deleteMarketingAction} id={b.id} icon label="Supprimer le bandeau" fields={{ kind: "banner" }} /><SubmitButton form={`bandeau-form-${b.id}`} label="Enregistrer le bandeau" className={save} /></>}>
      <Notice feedback={feedback} id={b.id} />
      <form id={`bandeau-form-${b.id}`} action={saveBannerAction} className="space-y-6"><BannerFields banner={b} promotions={choices} /></form>
    </Drawer>)}
    <Drawer id="bandeau-nouveau" kicker="Bandeau" title="Nouveau bandeau" openOnLoad={feedback.open === "nouveau"} footer={<><span /><SubmitButton form={"bandeau-form-nouveau"} label="Créer le bandeau" className={save} /></>}>
      <Notice feedback={feedback} id="nouveau" />
      <form id="bandeau-form-nouveau" action={saveBannerAction} className="space-y-6"><BannerFields promotions={choices} linkedTo={linkTo} /></form>
    </Drawer>
  </section>;
}
