"use client";

import Link from "next/link";
import { useId, useState, Fragment, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";
import { createCheckout } from "@/app/actions";
import { href, t, type Locale } from "@/lib/i18n";
import { formatPrice, optionCategories, type Option, type Pack, type PricingSettings } from "@/lib/pricing";
import { glossaryIdFor, type GlossaryHint } from "@/lib/glossary";
import type { OptionContent } from "@/lib/option-content";
import { optionProducts, optionProductTitle, optionThemeColors } from "@/lib/option-products";
import { recommendPack } from "@/lib/pack-recommendation";
import { Hint } from "./Hint";
import { ProductPreview } from "./ProductPreview";
import { ProductCompatibility } from "./ProductCompatibility";
import { useOfferNavigation } from "./OfferTabs";
import { OfferPrice, SaleBadge } from "./ui";
import { briefDeliveryNeeds } from "@/lib/brief-delivery";

function CheckoutButton({ disabled, locale }: { disabled: boolean; locale: Locale }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={disabled || pending} className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-background hover:brightness-110 disabled:opacity-50">{t(locale, { fr: pending ? "Redirection…" : "Commander", en: pending ? "Redirecting…" : "Order" })}</button>;
}

function Quantity({ value, onChange, label, className = "flex flex-col gap-1" }: { value: number; onChange: (value: number) => void; label: string; className?: string }) {
  const id = useId();
  return <div className={`${className} text-xs`}><label htmlFor={id} className="text-center">{label}</label><div className="flex items-center gap-1.5">
    <button type="button" aria-label={`${label} −`} aria-controls={id} disabled={value <= 1} onClick={() => onChange(value - 1)} className="size-11 rounded-lg border border-border text-xl hover:border-accent disabled:opacity-30">−</button>
    <input id={id} type="number" min={1} max={20} step={1} value={value} onChange={(e) => { const next = Number(e.target.value); if (Number.isInteger(next) && next >= 1 && next <= 20) onChange(next); }} className="catalog-quantity h-11 w-12 rounded-lg border border-border bg-background p-1 text-center text-sm font-semibold" />
    <button type="button" aria-label={`${label} +`} aria-controls={id} disabled={value >= 20} onClick={() => onChange(value + 1)} className="size-11 rounded-lg border border-border text-xl hover:border-accent disabled:opacity-30">+</button>
  </div></div>;
}

// Textes modifiables dans l'admin, lus côté serveur : bulles « ? », fichiers livrés et titre de leur liste
export type CatalogTexts = {
  hints: Record<string, GlossaryHint>;
  content: Record<string, OptionContent>;
  labels: { receive: string; revision: string; add: string; quote: string; quoteHeading: string; custom: string; customLink: string };
};

function ProductCard({ product, locale, add, texts }: { product: ReturnType<typeof optionProducts>[number]; locale: Locale; add: (option: Option, quantity: number) => void; texts: CatalogTexts }) {
  const variantGroup = useId();
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const option = product.variants.find((o) => o.id === variantId) ?? product.variants[0];
  const title = optionProductTitle(option.name);
  const content = texts.content[option.id];
  const emotes = product.category === "emotes";
  // Place de chaque option dans la carte (réglée dans l'admin) : nombre et variante statique / animée
  const count = (o: Option) => texts.content[o.id]?.count ?? 1;
  const animatedOf = (o: Option) => texts.content[o.id]?.animated ?? false;
  const counts = [...new Set(product.variants.map(count))].sort((a, b) => a - b);
  const bySize = counts.length > 1;
  const variants = bySize ? product.variants.filter((v) => count(v) === count(option)) : product.variants;
  const toggle = new Set(product.variants.map(animatedOf)).size > 1;
  return <article style={{ "--product-color": optionThemeColors[product.category] } as CSSProperties} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--product-color)_35%,var(--border))] bg-surface">
    <div className="relative">
      <ProductPreview option={option} animated={animatedOf(option)} locale={locale} />
      <SaleBadge item={option} locale={locale} className="absolute right-3 top-3" />
    </div>
    <div className="flex flex-col gap-2.5 p-4">
      <div><h3 className="font-display text-lg font-bold">{content?.groupName || (emotes && bySize ? "Emotes" : title.main)}<Hint hint={texts.hints[glossaryIdFor(option.name) ?? ""]} /></h3>{!content?.groupName && !(emotes && bySize) && title.detail && <p className="mt-1 text-xs text-muted">{title.detail}</p>}</div>
      {toggle && <fieldset aria-label={t(locale, { fr: "Variante", en: "Variant" })} className="grid grid-cols-2 gap-1 rounded-full border border-border bg-background p-1">{[false, true].map((animated) => {
        const variant = variants.find((v) => animatedOf(v) === animated);
        const active = animatedOf(option) === animated;
        return <label key={String(animated)} className={`relative rounded-full px-3 py-2 text-center text-xs font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${!variant ? "opacity-35" : "cursor-pointer"} ${active ? "bg-[var(--product-color)] text-background shadow-sm" : "text-muted hover:text-foreground"}`}><input type="radio" name={variantGroup} value={variant?.id ?? String(animated)} checked={active} disabled={!variant} onChange={() => variant && setVariantId(variant.id)} className="sr-only" />{t(locale, { fr: animated ? "Animé" : "Statique", en: animated ? "Animated" : "Static" })}</label>;
      })}</fieldset>}
      {content?.description && <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{content.description}</p>}
      {(content?.files.length ?? 0) > 0 && <div className="text-xs"><p className="font-semibold text-foreground">{texts.labels.receive}</p><ul className="mt-1.5 space-y-1 text-muted">{content!.files.map((line) => <li key={line} className="flex gap-2"><span aria-hidden className="text-[var(--product-color)]">✓</span><span>{line}</span></li>)}</ul></div>}
      <ProductCompatibility platforms={content?.compat ?? []} locale={locale} />
      {texts.labels.revision && <p className="text-xs font-medium text-[var(--product-color)]">{texts.labels.revision}</p>}
      {bySize && toggle && variants.length === 1 && <p className="text-xs text-muted">{t(locale, emotes ? { fr: "Seule cette variante est disponible pour ce nombre d’emotes.", en: "Only this variant is available for this number of emotes." } : { fr: "Seule cette variante est disponible pour ce nombre.", en: "Only this variant is available for this number." })}</p>}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_2.75rem] items-center gap-x-3 gap-y-1">
      {bySize && <label className="row-span-2 grid grid-rows-subgrid text-center text-xs">{t(locale, emotes ? { fr: "Nombre d’emotes", en: "Number of emotes" } : { fr: "Nombre", en: "Number" })}<select value={count(option)} onChange={(e) => { const available = product.variants.filter((v) => count(v) === Number(e.target.value)); setVariantId((available.find((v) => animatedOf(v) === animatedOf(option)) ?? available[0]).id); }} className="h-11 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm font-semibold">{counts.map((n) => <option key={n} value={n}>{n}</option>)}</select></label>}
        {!option.priceFrom && !bySize && <Quantity className="row-span-2 grid grid-rows-subgrid" label={t(locale, { fr: /alerte|alert|panneau|panel/i.test(option.id) ? "Nombre de packs" : "Quantité", en: /alerte|alert|panneau|panel/i.test(option.id) ? "Number of packs" : "Quantity" })} value={quantity} onChange={setQuantity} />}
        <p className="col-start-2 row-start-2 text-right font-display text-2xl font-bold"><OfferPrice item={{ ...option, unit: undefined, price: option.price * quantity, normalPrice: option.normalPrice ? option.normalPrice * quantity : undefined }} locale={locale} /></p>
      </div>
      {option.priceFrom ? <Link href={href(locale, `/contact?option=${encodeURIComponent(option.id)}`)} className="rounded-full border border-[var(--product-color)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--product-color)]">{texts.labels.quote}</Link> : <button type="button" onClick={() => add(option, quantity)} className="rounded-full border border-transparent bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:border-[var(--product-color)] hover:bg-transparent hover:text-[var(--product-color)]">{texts.labels.add}</button>}
    </div>
  </article>;
}

export function OptionCatalog({ options, packs, settings, locale, texts, installOption }: { options: Option[]; packs: Pack[]; settings: PricingSettings; locale: Locale; texts: CatalogTexts; installOption?: Option }) {
  const showPack = useOfferNavigation();
  const [filter, setFilter] = useState("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const cartId = useId();
  const selected = options.filter((o) => !o.priceFrom && quantities[o.id] > 0);
  const cartItems = selected.map((o) => ({ id: o.id, quantity: quantities[o.id] }));
  // Installation : code ajouté par le client (inclus) ou installation par zer0oes_GFX (supplément)
  const [install, setInstall] = useState<"" | "self" | "zer0oes">("");
  const needsInstall = Boolean(installOption) && briefDeliveryNeeds(selected.map((o) => o.name)).platform;
  const installed = needsInstall && install === "zer0oes" ? installOption : undefined;
  const items = installed ? [...cartItems, { id: installed.id, quantity: 1 }] : cartItems;
  const total = selected.reduce((sum, o) => sum + o.price * quantities[o.id], 0) + (installed?.price ?? 0);
  const recommendation = recommendPack(packs, options, cartItems, settings);
  const tooMany = items.length > 20 || JSON.stringify(items).length > 500;
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const labels: Record<string, string> = locale === "en" ? { all: "All", overlays: "Overlays", emotes: "Emotes", branding: "Visual identity", motion: "Animation" } : { all: "Tout", overlays: "Overlays", emotes: "Emotes", branding: "Identité visuelle", motion: "Animation" };
  const products = optionProducts(options, (o) => texts.content[o.id]?.group ?? null).filter((product) => filter === "all" || product.category === filter).sort((a, b) => filter === "all" ? Number(a.variants.every((v) => v.priceFrom)) - Number(b.variants.every((v) => v.priceFrom)) : 0);
  const change = (id: string, quantity: number) => setQuantities((current) => ({ ...current, [id]: quantity }));
  return <section className="pb-24 lg:pb-0">

    <p role="status" aria-live="polite" className="sr-only">{message}</p>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
    <div className="mb-3 flex flex-wrap gap-2" aria-label={t(locale, { fr: "Filtrer les créations", en: "Filter creations" })}>
      {["all", ...optionCategories.map((c) => c.id)].map((id) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} style={id !== "all" ? { "--filter-color": optionThemeColors[id as keyof typeof optionThemeColors] } as CSSProperties : undefined} className={`rounded-full border px-4 py-2 text-sm font-medium ${filter === id ? id === "all" ? "border-accent bg-accent text-background" : "border-[var(--filter-color)] bg-[var(--filter-color)] text-background" : id === "all" ? "border-border bg-surface text-muted hover:text-foreground" : "border-[color-mix(in_srgb,var(--filter-color)_40%,var(--border))] bg-surface text-[var(--filter-color)]"}`}>{labels[id]}</button>)}
    </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">{products.map((product, index) => <Fragment key={product.id}>{product.variants.every((v) => v.priceFrom) && (index === 0 || !products[index - 1].variants.every((v) => v.priceFrom)) && <h3 className="col-span-full mt-3 border-t border-border pt-4 font-display text-base font-semibold">{texts.labels.quoteHeading}</h3>}<ProductCard product={product} locale={locale} texts={texts} add={(option, quantity) => {
        const next = (quantities[option.id] ?? 0) + quantity;
        if (next > 20) { setMessage(t(locale, { fr: "Maximum 20 exemplaires par produit. Contacte-moi pour une commande plus importante.", en: "Maximum 20 of each product. Contact me for larger orders." })); return; }
        change(option.id, next);
        setMessage(t(locale, { fr: `${quantity} × ${option.name} ajouté à ta commande.`, en: `${quantity} × ${option.name} added to your order.` }));
      }} /></Fragment>)}{!products.length && <p className="text-sm text-muted">{t(locale, { fr: "Aucune création dans cette catégorie.", en: "No creations in this category." })}</p>}</div>
      </div>
      <aside id={cartId} className="flex max-h-[calc(100dvh-2rem)] scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-accent/40 bg-surface lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)]">
        <form action={createCheckout} className="flex min-h-0 flex-1 flex-col">
          <h3 className="shrink-0 px-4 pt-4 pb-2 font-display text-lg font-bold">{t(locale, { fr: "Ma commande", en: "My order" })} <span className="text-sm text-muted">· {count} {t(locale, { fr: count === 1 ? "article" : "articles", en: count === 1 ? "item" : "items" })}</span></h3>
          <input type="hidden" name="optionItems" value={JSON.stringify(items)} /><input type="hidden" name="expectedPrice" value={total} /><input type="hidden" name="lang" value={locale} />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {selected.length ? <ul className="divide-y divide-border">{selected.map((o) => <li key={o.id} className="space-y-1 px-4 py-2 text-sm"><div className="flex items-center justify-between gap-2"><p title={o.name} className="min-w-0 flex-1 truncate font-medium">{o.name.replace(/\s*\((?:unité|unit|each)\)/gi, "").replace(/\bfixe(s?)\b/gi, "statique$1").trim()}</p><button type="button" aria-label={t(locale, { fr: `Retirer ${o.name}`, en: `Remove ${o.name}` })} onClick={() => change(o.id, 0)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" /></svg></button></div><div className="flex items-center justify-between gap-2"><label className="flex items-center gap-2"><span className="text-xs text-muted">{t(locale, { fr: "Qté", en: "Qty" })}</span><input type="number" min={1} max={20} step={1} aria-label={t(locale, { fr: `Quantité de ${o.name}`, en: `Quantity of ${o.name}` })} value={quantities[o.id]} onChange={(e) => { const next = Number(e.target.value); if (Number.isInteger(next) && next >= 1 && next <= 20) change(o.id, next); }} className="catalog-quantity h-8 w-14 rounded-md border border-border bg-background px-2 text-center text-sm" /></label><span className="font-semibold">{formatPrice(o.price * quantities[o.id], locale)}</span></div></li>)}</ul> : <p className="px-4 py-3 text-sm text-muted">{t(locale, { fr: "Ajoute une création pour commencer ta commande.", en: "Add a creation to start your order." })}</p>}
          {needsInstall && installOption && <fieldset className="border-t border-border px-4 py-3 text-sm">
            <legend className="sr-only">{t(locale, { fr: "Installation", en: "Installation" })}</legend>
            <p className="font-semibold">{t(locale, { fr: "Installation sur StreamElements ou Streamlabs *", en: "Installation on StreamElements or Streamlabs *" })}</p>
            <div className="mt-2 space-y-2">
              {([["self", t(locale, { fr: "J’ajoute moi-même le code", en: "I’ll add the code myself" }), t(locale, { fr: "Tu reçois le HTML, le CSS et le JavaScript à coller dans ta plateforme.", en: "You receive the HTML, CSS and JavaScript to paste into your platform." }), t(locale, { fr: "Inclus", en: "Included" })], ["zer0oes", t(locale, { fr: "Installation par zer0oes_GFX", en: "Installation by zer0oes_GFX" }), t(locale, { fr: "Tu invites le compte zer0oes_GFX comme éditeur et j’installe tout pour toi.", en: "You invite the zer0oes_GFX account as an editor and I install everything for you." }), `+ ${formatPrice(installOption.price, locale)}`]] as const).map(([value, label, hint, price]) => (
                <label key={value} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2.5 text-xs transition-colors hover:border-accent/60 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                  <input type="radio" name="installChoice" value={value} checked={install === value} onChange={() => setInstall(value)} className="mt-0.5 accent-[var(--accent)]" />
                  <span className="min-w-0 flex-1"><span className="flex justify-between gap-2 font-semibold text-foreground"><span>{label}</span><span className="shrink-0">{price}</span></span><span className="mt-0.5 block text-muted">{hint}</span></span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">{t(locale, { fr: "Tu choisiras StreamElements ou Streamlabs dans ton brief.", en: "You’ll choose StreamElements or Streamlabs in your brief." })}</p>
          </fieldset>}
          {recommendation && <div className="mx-3 my-2 space-y-2 rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs" aria-live="polite">
            <p>{recommendation.pack.name}{recommendation.formula && recommendation.formula.id !== "base" ? ` · ${recommendation.formula.label}` : ""}{recommendation.hasLogo ? t(locale, { fr: " — logo fourni", en: " — logo supplied" }) : ""} · {recommendation.pack.priceFrom ? t(locale, { fr: "à partir de ", en: "from " }) : ""}{formatPrice(recommendation.price, locale)}</p>
            <p className="text-accent">{t(locale, { fr: "Économie : ", en: "Savings: " })}{recommendation.remaining.length ? t(locale, { fr: "à confirmer avec les compléments", en: "to confirm with add-ons" }) : total > recommendation.price ? `${formatPrice(total - recommendation.price, locale)} (${((total - recommendation.price) / total * 100).toLocaleString(locale, { maximumFractionDigits: 1 })} %)` : t(locale, { fr: "aucune sur cette sélection", en: "none for this selection" })}</p>
            <details><summary className="cursor-pointer text-muted">{t(locale, { fr: "Voir les éléments inclus", en: "View included items" })}</summary><div className="mt-2 space-y-2">
            <ul className="list-inside list-disc space-y-1 text-muted">{recommendation.pack.deliverables.map((line) => <li key={line}>{recommendation.hasLogo && /^logo\b/i.test(line) ? t(locale, { fr: "Ton logo existant fourni", en: "Your existing logo supplied" }) : line}</li>)}</ul>
            {recommendation.formula && recommendation.formula.id !== "base" && <ul className="list-inside list-disc space-y-1 text-muted">{(recommendation.formula.id === "emotes" ? recommendation.pack.extras?.slice(0, 1) : recommendation.pack.extras)?.map((line) => <li key={line}>{line}</li>)}</ul>}
            {recommendation.addsLogo && <p>{t(locale, { fr: "Le pack comprend aussi la création du logo.", en: "The package also includes a custom logo." })}</p>}
            {recommendation.remaining.length > 0 && <p className="text-muted">{t(locale, { fr: "À prévoir en complément : ", en: "To add separately: " })}{recommendation.remaining.join(" · ")}</p>}
            </div></details>
            <button type="button" onClick={() => showPack(recommendation.pack.id, recommendation.formula?.id, recommendation.hasLogo)} className="block w-full rounded-full bg-accent px-3 py-2 text-center font-semibold text-background">{t(locale, { fr: "Voir ce pack", en: "View this package" })}</button>
          </div>}
          </div>
          <div className="shrink-0 border-t border-border bg-surface px-4 py-3">
          <p aria-live="polite" className="mb-3 flex justify-between text-lg font-bold"><span>Total</span><span>{formatPrice(total, locale)}</span></p>
          {selected.length > 0 && <label className="mb-3 flex items-start gap-2 text-xs text-muted"><input type="checkbox" name="cgv" required className="mt-0.5 accent-[var(--accent)]" /><span>{locale === "fr" ? <>J&apos;accepte les <Link href={href(locale, "/cgv")} className="underline">CGV</Link> et demande le démarrage dès le paiement, avant la fin du délai de rétractation.</> : <>I accept the <Link href={href(locale, "/cgv")} className="underline">terms of sale</Link> and request work to start upon payment, before the withdrawal period ends.</>}</span></label>}
          {tooMany && <p role="alert" className="mb-3 text-xs text-muted">{t(locale, { fr: "Contacte-moi pour un devis groupé de cette taille.", en: "Contact me for a combined quote of this size." })}</p>}
          <CheckoutButton locale={locale} disabled={!cartItems.length || tooMany || total < 50 || (needsInstall && !install)} />
          {needsInstall && !install && <p className="mt-2 text-center text-[11px] text-accent">{t(locale, { fr: "Choisis le mode d’installation pour continuer.", en: "Choose the installation option to continue." })}</p>}
          <p className="mt-2 text-center text-[11px] text-muted">{t(locale, { fr: "Une seule modification incluse par création.", en: "One revision included per creation." })}</p>
          <p className="mt-1 text-center text-[11px] leading-relaxed text-muted"><span className="block">{t(locale, { fr: "Paiement sécurisé · En une fois", en: "Secure payment · Paid in full" })}</span><span className="block">{t(locale, { fr: "Brief à compléter après paiement", en: "Complete your brief after payment" })}</span></p>
          </div>
        </form>
      </aside>
    </div>
    <p className="mt-8 text-center text-sm text-muted">{texts.labels.custom} <Link href={href(locale, "/contact")} className="text-accent underline underline-offset-4">{texts.labels.customLink}</Link></p>
    <a href={`#${cartId}`} className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-full border border-accent/40 bg-surface px-5 py-4 text-sm font-semibold shadow-xl lg:hidden"><span>{t(locale, { fr: `Voir ma commande (${count})`, en: `View my order (${count})` })}</span><span>{formatPrice(total, locale)}</span></a>
  </section>;
}
