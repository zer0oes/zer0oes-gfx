import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/data/site";
import { formatBytes, isDeliveryToken } from "@/lib/delivery";
import { getStore } from "@/lib/store";

// Page privée de livraison d'une commande (accès par lien, sans compte).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ta livraison", robots: { index: false, follow: false } };

const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export default async function DeliveryPage({ params }: PageProps<"/livraison/[token]">) {
  const { token } = await params;
  if (!isDeliveryToken(token)) notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) notFound();
  const items = await store.listDeliverables(order.id);
  const links = items.filter((d) => d.kind === "lien");
  const files = items.filter((d) => d.kind === "fichier");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Ta livraison</p>
      <h1 className="mt-3 font-display text-4xl font-bold">{order.offerName}</h1>
      <p className="mt-3 text-muted">Tout ce qu&apos;il te faut pour lancer ton nouvel univers en live. Garde ce lien pour toi : il donne accès à tes fichiers.</p>

      {links.length > 0 && (
        <section aria-labelledby="importer" className={`mt-10 ${card}`}>
          <h2 id="importer" className="font-display text-xl font-bold">
            Importer sur StreamElements
          </h2>
          <p className="mt-1 text-sm text-muted">Connecte-toi à StreamElements, puis ouvre chaque lien : l&apos;overlay s&apos;ajoute à ton compte, déjà réglé.</p>
          <ul className="mt-4 space-y-3">
            {links.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-medium">{d.label}</span>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
                  Importer ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {files.length > 0 && (
        <section aria-labelledby="fichiers" className={`mt-6 ${card}`}>
          <h2 id="fichiers" className="font-display text-xl font-bold">
            Tes fichiers
          </h2>
          <p className="mt-1 text-sm text-muted">Visuels, fichiers pour Streamlabs et OBS, guide d&apos;installation.</p>
          <ul className="mt-4 space-y-3">
            {files.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  <span className="font-medium">{d.label}</span>
                  {d.sizeBytes ? <span className="ml-2 text-xs text-muted">{formatBytes(d.sizeBytes)}</span> : null}
                </span>
                <a href={`/livraison/${token}/${d.id}`} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-accent">
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 && <p className={`mt-10 ${card} text-muted`}>Ta livraison est en préparation : reviens un peu plus tard.</p>}

      <section aria-labelledby="installation" className="mt-10">
        <h2 id="installation" className="font-display text-xl font-bold">
          Installation en bref
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>
            <strong className="text-foreground">StreamElements</strong> : après l&apos;import, ouvre l&apos;overlay, copie son lien (« Copy URL ») et ajoute-le dans OBS comme
            source « Navigateur » en 1920 × 1080.
          </li>
          <li>
            <strong className="text-foreground">Streamlabs</strong> : dans le widget concerné (ex. Alert Box), active « Custom HTML/CSS » et colle le code fourni dans les
            fichiers.
          </li>
          <li>
            <strong className="text-foreground">OBS</strong> : les visuels se glissent directement dans tes scènes ; les PNG et WEBM gardent leur fond transparent.
          </li>
        </ul>
        <p className="mt-6 text-sm text-muted">
          Un souci, une correction ?{" "}
          <a href={`mailto:${site.email}`} className="text-accent hover:underline">
            {site.email}
          </a>{" "}
          ou{" "}
          <Link href="/contact" className="text-accent hover:underline">
            le formulaire de contact
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
